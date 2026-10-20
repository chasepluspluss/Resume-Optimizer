"""Optional AI helpers: sort raw resume text into sections and polish the wording.

Talks to any OpenAI-compatible chat endpoint. Google Gemini (free tier) is the default; Groq also works.
Locally the key lives in ai_settings.json next to this file, or in GEMINI_API_KEY / GROQ_API_KEY.
When hosted (SHORTLIST_HOSTED=1) only environment variables are used, so the key never ships in the code.
"""

import json
import os
import re
import urllib.error
import urllib.request

from extract import ENTRY_SECTIONS, LIST_SECTIONS, _empty

BASE = os.path.dirname(os.path.abspath(__file__))
SETTINGS_PATH = os.path.join(BASE, "ai_settings.json")
HOSTED = os.environ.get("SHORTLIST_HOSTED") == "1"

# Built-in keys: paste a key between the quotes and the app uses it with no setup.
# Anyone who gets a copy of this file can use the key, so don't share or upload it.
EMBEDDED_KEYS = {
    "groq": "",
    "gemini": "",
}

PROVIDERS = {
    "gemini": {
        "label": "Google Gemini",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "models": ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"],
        "key_url": "https://aistudio.google.com/apikey",
        "env": "GEMINI_API_KEY",
        "note": "Free tier, no credit card. On the free tier Google may use what you send to improve its products.",
    },
    "groq": {
        "label": "Groq",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "models": ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"],
        "key_url": "https://console.groq.com/keys",
        "env": "GROQ_API_KEY",
        "note": "Free tier, no credit card. Very fast open models.",
    },
}

ENTRY_FIELDS = {
    "education": ("school", "degree", "location", "dates", "gpa"),
    "experience": ("title", "org", "location", "dates"),
    "activities": ("title", "org", "location", "dates"),
    "volunteer": ("title", "org", "location", "dates"),
    "projects": ("title", "org", "location", "dates"),
}


class AIError(Exception):
    pass


# --------------------------------------------------------------------------- settings

def load_settings():
    if HOSTED:
        provider = os.environ.get("AI_PROVIDER") or ("groq" if os.environ.get("GROQ_API_KEY") else "gemini")
        env = PROVIDERS.get(provider, {}).get("env", "")
        return {"provider": provider, "key": os.environ.get(env, ""), "model": os.environ.get("AI_MODEL", ""), "off": False}
    s = {"provider": "gemini", "key": "", "model": "", "off": False}
    saved = {}
    try:
        with open(SETTINGS_PATH, encoding="utf-8") as f:
            saved = {k: v for k, v in json.load(f).items() if k in s}
    except (OSError, ValueError):
        pass
    if "provider" not in saved:  # nothing picked in the app yet, so start with a built-in key if there is one
        s["provider"] = next((p for p, k in EMBEDDED_KEYS.items() if k), "gemini")
    s.update(saved)
    if not s["key"] and not s["off"] and s["provider"] in PROVIDERS:
        s["key"] = os.environ.get(PROVIDERS[s["provider"]]["env"], "") or EMBEDDED_KEYS.get(s["provider"], "")
    return s


def save_settings(provider, key, model="", off=False):
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump({"provider": provider, "key": key, "model": model, "off": off}, f, indent=2)


def status():
    s = load_settings()
    p = PROVIDERS.get(s["provider"], PROVIDERS["gemini"])
    return {
        "configured": bool(s["key"]) and s["provider"] in PROVIDERS,
        "locked": HOSTED,
        "provider": s["provider"],
        "label": p["label"],
        "model": s["model"] or p["models"][0],
        "key_hint": ("…" + s["key"][-4:]) if s["key"] and not HOSTED else "",
        "providers": {k: {"label": v["label"], "key_url": v["key_url"], "models": v["models"], "note": v["note"]}
                      for k, v in PROVIDERS.items()},
    }


# --------------------------------------------------------------------------- transport

def chat(messages, settings=None, temperature=0.3, json_mode=False):
    s = settings or load_settings()
    p = PROVIDERS.get(s.get("provider"))
    if not p:
        raise AIError("Unknown AI provider.")
    if not s.get("key"):
        raise AIError("No API key yet. Add one in AI settings.")
    models = [s["model"]] if s.get("model") else p["models"]
    last = ""
    for model in models:
        req_body = {"model": model, "messages": messages, "temperature": temperature}
        if json_mode and s.get("provider") == "groq":  # Groq's JSON mode guarantees parseable output
            req_body["response_format"] = {"type": "json_object"}
        body = json.dumps(req_body).encode()
        req = urllib.request.Request(p["url"], body, {"Content-Type": "application/json", "Authorization": f"Bearer {s['key']}"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.loads(r.read())
            return data["choices"][0]["message"]["content"] or ""
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:400]
            low = detail.lower()
            if e.code in (401, 403) or "api key" in low or "api_key" in low:
                raise AIError("The API key was rejected. Double-check it in AI settings.")
            if e.code == 429:
                raise AIError("Free-tier rate limit reached. Wait a minute and try again.")
            if e.code == 404 or (e.code == 400 and "model" in low):
                last = f"{model} isn't available"
                continue
            raise AIError(f"{p['label']} returned an error ({e.code}).")
        except (urllib.error.URLError, TimeoutError) as e:
            raise AIError(f"Couldn't reach {p['label']}. Check your internet connection. ({getattr(e, 'reason', e)})")
        except (KeyError, IndexError, ValueError):
            raise AIError("The AI sent back something unexpected. Try again.")
    raise AIError(f"No usable model found: {last}. Set a model name in AI settings.")


def _json(text):
    t = re.sub(r"^\s*```(?:json)?|```\s*$", "", text.strip())
    start, end = t.find("{"), t.rfind("}")
    if start < 0 or end < start:
        raise AIError("The AI didn't return usable data. Try again.")
    try:
        return json.loads(t[start:end + 1])
    except ValueError:
        raise AIError("The AI returned malformed data. Try again.")


def _clean(v):
    if v is None:
        return ""
    s = re.sub(r"\s+", " ", str(v)).strip()
    return s.replace(" — ", ", ").replace("—", "-")


def _clean_list(v):
    if isinstance(v, str):
        v = v.split("\n")
    return [c for c in (_clean(x) for x in (v or [])) if c]


# --------------------------------------------------------------------------- sorting raw text

STRUCTURE_SYSTEM = """You turn raw resume material (old resumes, notes, activity lists, transcripts) into structured JSON.
Rules:
- Use only facts in the material. Never invent names, dates, numbers, schools, employers or skills.
- Put each item in the best section: education, experience (paid work and internships), activities
  (clubs, sports, leadership, arts), volunteer (unpaid service), projects (personal, class or research projects).
- Split combined lines into proper fields. Dates like "Jun 2024 - Present". Leave a field "" when unknown.
- bullets: short factual statements of what the person did, copied or lightly cleaned from the material.
- skills: one group per line like "Languages: Python, Java". Coursework and tests: one item each.
- If the same thing appears twice, include it once.
- Do not use em dashes.
Return only JSON in exactly this shape:
{"profile":{"name":"","email":"","phone":"","location":"","links":[],"summary":""},
 "education":[{"school":"","degree":"","location":"","dates":"","gpa":"","bullets":[]}],
 "experience":[{"title":"","org":"","location":"","dates":"","bullets":[]}],
 "activities":[...same as experience...],"volunteer":[...],"projects":[...],
 "skills":[],"awards":[],"certifications":[],"coursework":[],"tests":[]}"""


def normalize(data):
    out = _empty()
    prof = data.get("profile") or {}
    for k in ("name", "email", "phone", "location", "summary"):
        out["profile"][k] = _clean(prof.get(k))
    links = prof.get("links") or []
    out["profile"]["links"] = " | ".join(_clean_list(links if isinstance(links, list) else str(links).split("|")))
    for sec in ENTRY_SECTIONS:
        for e in data.get(sec) or []:
            if not isinstance(e, dict):
                continue
            item = {k: _clean(e.get(k)) for k in ENTRY_FIELDS[sec]}
            item["bullets"] = _clean_list(e.get("bullets"))
            if any(item.values()):
                out[sec].append(item)
    for sec in LIST_SECTIONS:
        out[sec] = _clean_list(data.get(sec))
    return out


def structure(text):
    messages = [
        {"role": "system", "content": STRUCTURE_SYSTEM},
        {"role": "user", "content": "Raw material:\n<<<\n" + text[:40000] + "\n>>>"},
    ]
    return normalize(_json(chat(messages, temperature=0.1, json_mode=True)))


# --------------------------------------------------------------------------- polishing

# Shared rules, based on what recruiter and admissions research says gets resumes through:
# ~6-8 second first scans focused on titles, organizations, dates and education (Ladders eye-tracking);
# employers screening for problem-solving, teamwork, communication and work ethic (NACE Job Outlook);
# quantified accomplishments over duties; and depth, commitment and impact for admissions.
BASE_RULES = """You are a senior resume writer and former campus recruiter. You turn rough resume content into polished,
professional, specific writing that wins interviews and acceptances.

What the research says works, so apply it:
1. Recruiters give a resume a 6 to 8 second first scan, mostly on titles, organizations, dates and education. Make
   every line scannable and put the most impressive, most relevant words first.
2. Accomplishments beat duties. Write each bullet as strong action verb + what was done + scale or result.
3. Employers look hardest for problem-solving, teamwork, communication, work ethic, initiative, analytical and
   technical skills. Show these through evidence in the bullets, never as empty adjectives.
4. Use the vocabulary of the target field and role so keyword screening (ATS) matches.
5. Choose precise, vivid verbs and synonyms. Never start two bullets in the same entry with the same verb.
   Replace weak wording (helped, worked on, responsible for, did, got, various, things, stuff).

Hard rules:
- ACCOUNT FOR EVERYTHING. Every fact in the input must still be in your output, reworded: every entry, number,
  name, tool, course, score, award, certification, hour count and date. If you merge two bullets, keep both facts.
  Write numbers exactly as given (keep "$3,200", "80+", "120+ hours").
- Never invent numbers, results, employers, titles, dates, awards, tools, scores or courses.
- Bullets: one line, about 10 to 24 words, start with a strong action verb, past tense for finished roles and present
  tense for current ones (dates ending in Present or Current), no "I" or "my", no ending period.
- Enrichment is allowed in two places only:
  a) "added": for an entry with fewer than 3 bullets, up to 2 extra bullets describing duties or skills that are
     standard and clearly implied for that exact role and type of organization (a cashier processes payments and
     balances a register; a club treasurer tracks the budget). No numbers, names, tools or outcomes in added bullets.
  b) Skills may include transferable or technical skills that the entries clearly demonstrate.
- "tips": up to 5 short, specific questions about missing details that would make the resume stronger, naming the
  entry, for example "About how many customers did you help per shift at H-E-B?".
- Never use em dashes. Keep proper names exactly as written. Return only JSON."""

TARGET_GUIDES = {
    "internship": """TARGET: INTERNSHIP.
- Employers choosing between similar students lean hardest on relevant experience, so frame every job, club and class
  project as proof of the skills the target field needs.
- Bring out technical tools, methods and transferable skills; connect part-time work to professionalism and teamwork.
- Summary (3 sentences, 50 to 80 words): class level, school and field of study; the strongest relevant experience or
  project with its result; 2 or 3 key skills; the internship goal.""",
    "job": """TARGET: JOB (professional or new-grad role).
- Hiring managers want impact and scope: lead with results, scale (people, money, volume) and ownership.
- Mirror the language of the target role so applicant tracking systems match keywords.
- Professional, confident tone; no student framing unless the person is still in school.
- Summary (3 to 4 sentences, 55 to 90 words): professional identity and type of experience; 2 standout
  accomplishments with their numbers; core skills that match the role; what they bring to the team.""",
    "college": """TARGET: COLLEGE ADMISSIONS.
- Admissions readers look for depth, sustained commitment, leadership growth, initiative and impact on others, not a
  long list. Show how long and how much: years involved, hours per week, people reached, results.
- Show progression (member to officer to leader), what the student started or changed, and community contribution.
- Warm but polished tone that sounds like a motivated student, not a corporate executive.
- Summary (3 sentences, 50 to 80 words): academic strengths and interests, 2 defining commitments or leadership roles
  with impact, and personal qualities or goals shown by the facts.""",
    "scholarship": """TARGET: SCHOLARSHIP.
- Committees score academic achievement, leadership, community service and goals. Make each one easy to find.
- Stress service hours, people helped, honors and the drive behind them; connect activities to future goals.
- Summary (3 sentences, 50 to 80 words): academic record and honors, leadership and service impact, and the
  educational or career goal the scholarship would support.""",
    "research": """TARGET: RESEARCH POSITION OR ACADEMIC PROGRAM (CV style).
- Faculty look for research methods, technical and lab skills, analytical thinking, persistence and outcomes such as
  results, posters, presentations or papers. Name methods, instruments, software, datasets and mentors precisely.
- Precise, scholarly tone; describe the question, the method and the finding.
- Summary (3 sentences, 50 to 80 words): academic standing and field, research interests and experience with methods,
  and technical skills plus the program or lab goal.""",
    "firstjob": """TARGET: FIRST OR PART-TIME JOB.
- Managers hiring entry-level staff want reliability, work ethic, customer service, teamwork, communication and
  willingness to learn. School, sports, clubs, volunteering and family responsibilities all prove these.
- Plain, friendly, professional wording; translate school activities into workplace strengths.
- Summary (2 to 3 sentences, 40 to 70 words): who they are, the strengths their activities prove, and eagerness and
  availability for the role.""",
}

NUM_RE = re.compile(r"\$?\d[\d,.]*\+?%?")
NAME_RE = re.compile(r"(?<=[\s(/,])[A-Z][A-Za-z0-9&.+#'-]+")


def _facts(text):
    """Numbers and mid-sentence proper nouns: the details a rewrite must not lose."""
    found = {m.group(0).rstrip(".,").lower() for m in NUM_RE.finditer(text)}
    found |= {m.group(0).rstrip(".,'").lower() for m in NAME_RE.finditer(text)}
    return {f for f in found if f}


def _restore(originals, rewritten):
    """Rewritten lines plus any original line whose numbers or names the AI dropped."""
    blob = " ".join(rewritten).lower()
    lost = [o for o in originals if any(f not in blob for f in _facts(o))]
    return rewritten + lost, len(lost)


def _restore_items(originals, rewritten, kind):
    """For comma lists (skills, coursework): every item must survive."""
    blob = " ".join(rewritten).lower()
    missing = []
    for line in originals:
        for item in re.split(r"[,;]", re.sub(r"^[^:]{1,32}:\s*", "", line)):
            item = item.strip(" .")
            core = re.sub(r"\s*\(.*?\)", "", item).lower()
            if core and core not in blob:
                missing.append(item)
    if not missing:
        return rewritten, 0
    if kind == "skills":
        return rewritten + ["Additional: " + ", ".join(missing)], len(missing)
    return rewritten + missing, len(missing)


def _highlights(p):
    """Facts the summary has to work in, so it reflects the whole resume."""
    out = []
    key = p.get("target_key", "")
    edu = (p.get("education") or [{}])[0]
    if edu.get("school"):
        out.append(edu["school"] + (f", {edu['degree']}" if edu.get("degree") else ""))
    if edu.get("gpa") and key in ("internship", "college", "scholarship", "research"):
        out.append(f"GPA {edu['gpa']}")
    for sec in ("experience", "activities", "projects", "volunteer"):
        items = (p.get("sections") or {}).get(sec) or []
        if items:
            out.append(" at ".join(x for x in (items[0].get("title"), items[0].get("org")) if x))
    if p.get("awards"):
        out.append(p["awards"][0])
    if p.get("skills"):
        out.append("skills: " + re.sub(r"^[^:]{1,32}:\s*", "", p["skills"][0]))
    if p.get("role"):
        out.append("goal: " + p["role"])
    return [x for x in out if x]


def polish(payload):
    scope = payload.get("scope", "all")
    guide = TARGET_GUIDES.get(payload.get("target_key"), TARGET_GUIDES["job"])
    sections = payload.get("sections") or {}
    education = payload.get("education") or []
    lists = {k: payload.get(k) or [] for k in ("skills", "awards", "certifications", "coursework", "tests")}
    brief = {
        "role_or_program": payload.get("role", ""),
        "current_summary": payload.get("summary", ""),
        "summary_must_mention": _highlights(payload),
        "education": education,
        "sections": sections,
        **lists,
    }
    if scope == "summary":
        task = ("Write only the summary. Draw on the whole resume, not just the current summary, and work in every "
                "item in summary_must_mention.")
        shape = '{"summary": ""}'
    else:
        task = ("Rewrite everything: the summary, every education entry's details, every entry's bullets, and the skills, "
                "awards, certifications, coursework and tests lists. In \"sections\" list every entry id you were given "
                "exactly once, ordered from most to least relevant to the target (recency breaks ties). In \"education\" "
                "return every education id. The summary must work in every item in summary_must_mention.")
        shape = ('{"summary": "", "education": [{"id": "education:0", "bullets": []}], '
                 '"sections": {"experience": [{"id": "experience:0", "bullets": [], "added": []}]}, '
                 '"skills": [], "awards": [], "certifications": [], "coursework": [], "tests": [], "tips": []}')
    messages = [
        {"role": "system", "content": BASE_RULES + "\n\n" + guide},
        {"role": "user", "content": f"{task}\nReturn JSON shaped like {shape}\n\nResume data:\n{json.dumps(brief, ensure_ascii=False)}"},
    ]
    data = _json(chat(messages, temperature=0.5, json_mode=True))

    result = {"summary": _clean(data.get("summary"))}
    if scope == "summary":
        return result

    restored = added = 0
    edu_rows = {r.get("id"): r for r in data.get("education") or [] if isinstance(r, dict)}
    result["education"] = []
    for e in education:
        bullets, n = _restore(e.get("details") or [], _clean_list((edu_rows.get(e.get("id")) or {}).get("bullets")))
        restored += n
        result["education"].append({"id": e.get("id"), "bullets": bullets})

    result["sections"] = {}
    for sec, items in sections.items():
        originals = {e.get("id"): e for e in items}
        seen, rows = set(), []
        for row in (data.get("sections") or {}).get(sec) or []:
            rid = row.get("id") if isinstance(row, dict) else None
            if rid not in originals or rid in seen:
                continue
            seen.add(rid)
            bullets, n = _restore(originals[rid].get("bullets") or [], _clean_list(row.get("bullets")))
            extra = [b for b in _clean_list(row.get("added")) if not NUM_RE.search(b)][:2]
            restored += n
            added += len(extra)
            rows.append({"id": rid, "bullets": bullets + extra, "added": len(extra)})
        for rid, e in originals.items():  # anything the AI skipped keeps its original wording
            if rid not in seen:
                rows.append({"id": rid, "bullets": e.get("bullets") or [], "added": 0})
        result["sections"][sec] = rows

    for k, orig in lists.items():
        new = _clean_list(data.get(k))
        new, n = _restore_items(orig, new, k) if k in ("skills", "coursework") else _restore(orig, new)
        restored += n
        result[k] = new or orig

    result["tips"] = _clean_list(data.get("tips"))[:5]
    result["restored"], result["added"] = restored, added
    return result
