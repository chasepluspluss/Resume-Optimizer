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

def chat(messages, settings=None, temperature=0.3):
    s = settings or load_settings()
    p = PROVIDERS.get(s.get("provider"))
    if not p:
        raise AIError("Unknown AI provider.")
    if not s.get("key"):
        raise AIError("No API key yet. Add one in AI settings.")
    models = [s["model"]] if s.get("model") else p["models"]
    last = ""
    for model in models:
        body = json.dumps({"model": model, "messages": messages, "temperature": temperature}).encode()
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
    return normalize(_json(chat(messages, temperature=0.1)))


# --------------------------------------------------------------------------- polishing

POLISH_SYSTEM = """You are an expert resume writer. You rewrite resume content so it reads as concise, specific and
professional, tailored to the person's target.
Rules:
- Never invent anything: no new employers, titles, dates, numbers, results, awards or skills. Only rephrase what is
  given. If a bullet has no number, do not add one.
- Bullets: one line each, about 8 to 22 words, start with a strong action verb, past tense for finished roles and
  present tense for current ones (dates ending in Present or Current). No "I", no "my", no ending period.
- Merge duplicate or overlapping bullets and cut filler, but keep every concrete fact.
- Order the entries in each section from most to least relevant to the target, using recency as the tiebreaker.
- Summary: 2 or 3 sentences, 35 to 65 words, no "I", tailored to the target, grounded only in the given facts.
- Skills: keep the same items, grouped into lines like "Label: item, item", duplicates removed.
- Never use em dashes. Keep proper names exactly as written.
Return only JSON."""


def polish(payload):
    scope = payload.get("scope", "all")
    sections = payload.get("sections") or {}
    ids = {sec: [e.get("id") for e in items] for sec, items in sections.items()}
    if scope == "summary":
        shape = '{"summary": ""}'
        task = "Write only the summary."
    else:
        shape = '{"summary": "", "sections": {"experience": [{"id": "experience:0", "bullets": []}]}, "skills": []}'
        task = ("Rewrite the summary, every entry's bullets and the skills. In \"sections\" list every entry id you were "
                "given exactly once, in your recommended order, each with its rewritten bullets.")
    brief = {
        "target": payload.get("target", ""),
        "what_this_target_values": payload.get("guidance", ""),
        "role_or_program": payload.get("role", ""),
        "current_summary": payload.get("summary", ""),
        "education": payload.get("education", []),
        "sections": sections,
        "skills": payload.get("skills", []),
        "awards": payload.get("awards", []),
    }
    messages = [
        {"role": "system", "content": POLISH_SYSTEM},
        {"role": "user", "content": f"{task}\nReturn JSON shaped like {shape}\n\nResume data:\n{json.dumps(brief, ensure_ascii=False)}"},
    ]
    data = _json(chat(messages, temperature=0.4))

    result = {"summary": _clean(data.get("summary"))}
    if scope == "summary":
        return result
    result["sections"] = {}
    for sec, wanted in ids.items():
        got = (data.get("sections") or {}).get(sec) or []
        seen, rows = set(), []
        for row in got:
            if isinstance(row, dict) and row.get("id") in wanted and row["id"] not in seen:
                seen.add(row["id"])
                rows.append({"id": row["id"], "bullets": _clean_list(row.get("bullets"))})
        result["sections"][sec] = rows
    result["skills"] = _clean_list(data.get("skills"))
    return result
