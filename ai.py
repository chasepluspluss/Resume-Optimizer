"""Optional AI helpers: sort raw resume text into sections and rewrite the wording.

Talks to any OpenAI-compatible chat endpoint. Google Gemini (free tier) is the default; Groq also works.
Locally the key lives in ai_settings.json next to this file, or in GEMINI_API_KEY / GROQ_API_KEY.
When hosted (SHORTLIST_HOSTED=1) only environment variables are used, so the key never ships in the code.
"""

import json
import os
import re
import time
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
        for attempt in range(2):
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
                    # Free tiers cap tokens per minute; one short wait usually clears it.
                    wait = re.match(r"\d+", e.headers.get("retry-after") or "")
                    wait = int(wait.group(0)) if wait else 10
                    if attempt == 0 and wait <= 30:
                        time.sleep(wait + 1)
                        continue
                    raise AIError("Free-tier rate limit reached. Wait a minute and try again.")
                if e.code == 404 or (e.code == 400 and "model" in low):
                    last = f"{model} isn't available"
                    break
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


# Safety net for the handful of words that instantly read as machine-written.
SWAPS = {
    "spearheaded": "led", "spearheading": "leading", "spearhead": "lead", "leveraged": "applied", "leveraging": "applying",
    "utilized": "used", "utilizing": "using", "utilize": "use", "showcased": "demonstrated", "showcasing": "demonstrating",
    "seamlessly": "smoothly",
}
SWAP_RE = re.compile(r"\b(" + "|".join(SWAPS) + r")\b", re.I)


def _humanize(s):
    s = re.sub(r"\b(?:successfully|effectively)\s+", "", s, flags=re.I)
    s = SWAP_RE.sub(lambda m: (lambda r: r[0].upper() + r[1:] if m.group(0)[0].isupper() else r)(SWAPS[m.group(0).lower()]), s)
    s = s.replace(";", ",")
    return s[:1].upper() + s[1:]


# --------------------------------------------------------------------------- sorting raw text

STRUCTURE_SYSTEM = """You turn raw resume material (old resumes, notes, activity lists, transcripts, or a single paragraph
where someone describes themselves) into structured JSON.
Rules:
- Use only facts in the material. Never invent names, dates, numbers, schools, employers or skills.
- A self-description paragraph usually mentions many things at once. Pull every job, club, sport, leadership role,
  volunteer role, project, award, honor, certification, course, test score and skill out into its own section.
- If the material says nothing for a section, return an empty list for it. Do not fill gaps with guesses.
- profile.summary: leave "" unless the material contains an actual career goal or objective statement.
- Put each item in the best section: education, experience (paid work and internships), activities
  (clubs, sports, leadership, arts), volunteer (unpaid service), projects (personal, class or research projects).
- Split combined lines into proper fields. Dates like "Jun 2024 - Present". Leave a field "" when unknown.
- SPLIT COMBINED ROLES. A line that joins several roles with "and", "&", "/", commas or "then" is several entries.
  Roles at a different school level (middle school vs. high school), organization, team, year or title are always
  separate entries, even when the activity has the same name. Example: "Middle School Yearbook Staff Member AND High
  School Yearbook People Section Editor" becomes two activities entries: {"title":"Staff Member","org":"Yearbook,
  [middle school]"} and {"title":"People Section Editor","org":"Yearbook, [high school]"}, using the real school names
  when given.
- bullets: factual statements of what the person did, copied or lightly cleaned from the material. Keep every detail.
- skills: one group per line like "Languages: Python, Java". Coursework and tests: one item each.
- Only merge two items when they are word-for-word the same role at the same place and time.
- Check your work before answering: every role, organization, school, title, number and award in the material must
  appear somewhere in your JSON.
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


STOPWORDS = {"and", "or", "the", "of", "for", "in", "at", "to", "with", "on", "my", "then", "also", "a", "an"}


def _missing(text, data):
    """Names and numbers from the raw material that never made it into the structured JSON."""
    blob = json.dumps(data, ensure_ascii=False).lower()
    return sorted(f for f in _facts(text) if f not in blob and f not in STOPWORDS)


def structure(text):
    text = text[:40000]
    messages = [
        {"role": "system", "content": STRUCTURE_SYSTEM},
        {"role": "user", "content": "Raw material:\n<<<\n" + text + "\n>>>"},
    ]
    raw = chat(messages, temperature=0.1, json_mode=True)
    data = _json(raw)
    lost = _missing(text, data)
    if lost:  # one corrective pass: dropped roles are the most common failure
        messages += [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": "You left these details out: " + ", ".join(lost[:40]) + ". Re-read the material, "
             "put each one where it belongs (a separate entry if it is a separate role) and return the complete JSON again."},
        ]
        try:
            retry = _json(chat(messages, temperature=0.1, json_mode=True))
            if len(_missing(text, retry)) < len(lost):
                data = retry
        except AIError:
            pass
    return normalize(data)


# --------------------------------------------------------------------------- polishing

# Shared rules, based on what recruiter and admissions research says gets resumes through:
# ~6-8 second first scans focused on titles, organizations, dates and education (Ladders eye-tracking);
# employers screening for problem-solving, teamwork, communication and work ethic (NACE Job Outlook);
# quantified accomplishments over duties; and depth, commitment and impact for admissions.
BASE_RULES = """You are a senior resume writer and former campus recruiter editing a real person's resume by hand. You turn
rough notes into polished, substantial, precisely worded writing that wins interviews and acceptances. Recruiters
complain that AI resumes are interchangeable buzzword salad, so every phrase you write must be tied to something this
specific person actually did. Sophisticated vocabulary is welcome; empty vocabulary is not.

What the research says works, so apply it:
1. Recruiters give a resume a 6 to 8 second first scan, mostly on titles, organizations, dates and education. Put the
   most impressive, most relevant words at the front of every line.
2. Accomplishments beat duties. Each bullet shows what was done, how (tools, methods, setting, who was involved) and
   why it mattered (result, scale, who benefited).
3. Employers look hardest for problem-solving, teamwork, communication, work ethic, initiative, analytical and
   technical skills. Prove these with evidence in the bullets, never as bare adjectives.
4. Use the real vocabulary of the field so keyword screening (ATS) matches: the terms a practitioner would use for
   that work. A yearbook editor does "page layout", "copyediting", "photo selection", "interviews", "editorial
   deadlines" and "production schedules"; a cashier handles "point-of-sale transactions", "cash reconciliation" and
   "customer inquiries"; a team captain handles "conditioning plans", "team morale" and "coaching younger athletes".
   Choose the keywords that fit the role and the target, and use each one where it describes a real task.

Length, depth and vocabulary (do not just retype the input, rebuild it):
- Each entry gets 3 to 5 bullets when the facts allow. Expand thin bullets with the context the facts imply: the
  setting, the audience, the tools, the purpose, the scope. Split a bullet that packs in two accomplishments.
- Bullets run about 18 to 32 words. One sentence, no ending period, no "I" or "my".
- Past tense for finished roles, present tense for current ones (dates ending in Present or Current).
- Write with a broad, exact, professional vocabulary. Prefer the precise word to the plain one when it is more
  accurate: "curated" over "picked", "copyedited" over "fixed", "coordinated" over "set up", "mentored" over "helped".
- Use synonyms deliberately. Do not repeat an opening verb anywhere in the whole resume, and avoid reusing the same
  noun or adjective across bullets in one entry. Rich verb choices include: directed, oversaw, supervised, chaired,
  coordinated, administered, organized, mobilized, recruited, mentored, coached, trained, tutored, instructed,
  advised, guided, designed, engineered, developed, devised, drafted, authored, composed, edited, copyedited,
  proofread, curated, photographed, produced, launched, founded, established, pioneered, initiated, revamped,
  restructured, streamlined, standardized, consolidated, modernized, expanded, accelerated, increased, boosted,
  reduced, minimized, resolved, troubleshot, diagnosed, analyzed, assessed, evaluated, audited, investigated,
  researched, surveyed, compiled, catalogued, documented, tracked, monitored, forecast, budgeted, allocated,
  negotiated, secured, solicited, persuaded, presented, pitched, interviewed, liaised, collaborated, partnered,
  facilitated, executed, delivered, managed, maintained, processed, served, assisted, supported, cultivated,
  orchestrated, championed, fostered.

Sound like an expert human, not a template:
- Confident, concrete, specific. Specific nouns and numbers over abstract claims.
- Vary rhythm: mix shorter and longer bullets, and vary how bullets open (most with the action, an occasional one
  with the setting or the result).
- Never use these overused filler words and phrases: spearheaded, leveraged, utilized, utilize, synergy, synergies,
  dynamic, passionate, results-driven, detail-oriented, go-getter, team player, hard worker, self-starter, think
  outside the box, cutting-edge, robust, seamless, seamlessly, delve, tapestry, testament, proven track record,
  in today's, a wide range of, diverse array, multifaceted, navigate, navigating, elevate, empower, journey, realm,
  landscape, showcasing, showcased.
- Never tack a trailing "-ing" clause onto the end of a bullet (", ensuring...", ", demonstrating...",
  ", highlighting...", ", resulting in..."). State the result directly instead.
- No strings of three adjectives, no filler like "successfully" or "effectively", no em dashes, no semicolons.

Hard rules:
- ACCOUNT FOR EVERYTHING. Every fact in the input must still be in your output: every entry, number, name, tool,
  course, score, award, certification, hour count and date. If you merge two bullets, keep both facts.
  Write numbers exactly as given (keep "$3,200", "80+", "120+ hours").
- An entry with no bullets still gets 3 bullets built from its title, organization and the standard duties of that
  exact role.
- Never invent numbers, results, employers, titles, dates, awards, tools, scores or courses.
- Enrichment is allowed in two places only:
  a) "added": for an entry with fewer than 3 bullets, up to 3 extra bullets describing duties or skills that are
     standard and clearly implied for that exact role and type of organization (a cashier processes payments and
     balances a register; a yearbook editor assigns stories and meets print deadlines). No numbers, names, tools or
     outcomes in added bullets.
  b) Skills may include transferable or technical skills that the entries clearly demonstrate.
- "tips": up to 5 short, specific questions about missing details that would make the resume stronger, naming the
  entry, for example "About how many pages did you design for the People section?".
- Keep proper names exactly as written. Return only JSON."""

TARGET_GUIDES = {
    "internship": """TARGET: INTERNSHIP.
- Employers choosing between similar students lean hardest on relevant experience, so frame every job, club and class
  project as proof of the skills the target field needs.
- Bring out technical tools, methods and transferable skills; connect part-time work to professionalism and teamwork.""",
    "job": """TARGET: JOB (professional or new-grad role).
- Hiring managers want impact and scope: lead with results, scale (people, money, volume) and ownership.
- Mirror the language of the target role so applicant tracking systems match keywords.
- Professional, confident tone; no student framing unless the person is still in school.""",
    "college": """TARGET: COLLEGE ADMISSIONS.
- Admissions readers look for depth, sustained commitment, leadership growth, initiative and impact on others, not a
  long list. Show how long and how much: years involved, hours per week, people reached, results.
- Show progression (member to officer to leader), what the student started or changed, and community contribution.
- Warm but polished tone that sounds like a motivated student, not a corporate executive.""",
    "scholarship": """TARGET: SCHOLARSHIP.
- Committees score academic achievement, leadership, community service and goals. Make each one easy to find.
- Stress service hours, people helped, honors and the drive behind them; connect activities to future goals.""",
    "research": """TARGET: RESEARCH POSITION OR ACADEMIC PROGRAM (CV style).
- Faculty look for research methods, technical and lab skills, analytical thinking, persistence and outcomes such as
  results, posters, presentations or papers. Name methods, instruments, software, datasets and mentors precisely.
- Precise, scholarly tone; describe the question, the method and the finding.""",
    "firstjob": """TARGET: FIRST OR PART-TIME JOB.
- Managers hiring entry-level staff want reliability, work ethic, customer service, teamwork, communication and
  willingness to learn. School, sports, clubs, volunteering and family responsibilities all prove these.
- Plain, friendly, professional wording; translate school activities into workplace strengths.""",
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


def polish(payload):
    guide = TARGET_GUIDES.get(payload.get("target_key"), TARGET_GUIDES["job"])
    sections = payload.get("sections") or {}
    education = payload.get("education") or []
    lists = {k: payload.get(k) or [] for k in ("skills", "awards", "certifications", "coursework", "tests")}
    brief = {
        "role_or_program": payload.get("role", ""),
        "education": education,
        "sections": sections,
        **lists,
    }
    task = ("Rewrite everything: every education entry's details, every entry's bullets, and the skills, awards, "
            "certifications, coursework and tests lists. In \"sections\" list every entry id you were given exactly "
            "once, ordered from most to least relevant to the target (recency breaks ties). In \"education\" return "
            "every education id.")
    shape = ('{"education": [{"id": "education:0", "bullets": []}], '
             '"sections": {"experience": [{"id": "experience:0", "bullets": [], "added": []}]}, '
             '"skills": [], "awards": [], "certifications": [], "coursework": [], "tests": [], "tips": []}')
    messages = [
        {"role": "system", "content": BASE_RULES + "\n\n" + guide},
        {"role": "user", "content": f"{task}\nReturn JSON shaped like {shape}\n\nResume data:\n{json.dumps(brief, ensure_ascii=False)}"},
    ]
    data = _json(chat(messages, temperature=0.5, json_mode=True))
    result = {}

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
            extra = [b for b in _clean_list(row.get("added")) if not NUM_RE.search(b)][:3]
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

    for row in result["education"] + [r for rows in result["sections"].values() for r in rows]:
        row["bullets"] = [_humanize(b) for b in row["bullets"]]
    for k in lists:
        result[k] = [_humanize(x) for x in result[k]]
    result["tips"] = _clean_list(data.get("tips"))[:5]
    result["restored"], result["added"] = restored, added
    return result
