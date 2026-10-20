"""Shortlist - a local resume builder. Run `python app.py` and open http://127.0.0.1:5050."""

import os
import re
import sys
import threading
import time
import webbrowser
from collections import defaultdict, deque

from flask import Flask, jsonify, request, send_file, send_from_directory

import ai
from docx_builder import build_docx
from extract import extract_text, parse_resume_text

BASE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", 5050))

app = Flask(__name__, static_folder=os.path.join(BASE, "static"), static_url_path="/static")
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024

# Per-visitor cap on AI calls so a public site can't burn through the free quota.
AI_LIMIT = int(os.environ.get("AI_LIMIT_PER_10_MIN", 20))
_ai_hits = defaultdict(deque)
_ai_lock = threading.Lock()


def ai_allowed():
    ip = (request.headers.get("X-Forwarded-For") or request.remote_addr or "?").split(",")[0].strip()
    now = time.time()
    with _ai_lock:
        hits = _ai_hits[ip]
        while hits and now - hits[0] > 600:
            hits.popleft()
        if len(hits) >= AI_LIMIT:
            return False
        hits.append(now)
        return True


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.post("/api/extract")
def api_extract():
    texts, files, errors = [], [], []
    for f in request.files.getlist("files"):
        try:
            text = extract_text(f.filename, f.read())
        except Exception as e:  # one bad file shouldn't sink the rest
            errors.append(f"{f.filename}: {e}")
            continue
        if not text.strip():
            errors.append(f"{f.filename}: no readable text (scanned PDFs need OCR, so paste the text instead)")
            continue
        texts.append(text)
        files.append(f.filename)

    typed = request.form.get("text", "")
    if typed.strip():
        texts.append(typed)

    if not texts:
        return jsonify(error="; ".join(errors) or "Nothing to read. Add a file or type something."), 400

    used_ai = False
    if request.form.get("ai") == "1" and ai.status()["configured"]:
        if not ai_allowed():
            errors.append("AI limit reached for now, so the built-in sorter was used. Try AI again in a few minutes.")
        else:
            try:
                # One call for everything, so the AI can merge duplicates across sources.
                results = [ai.structure("\n\n----- next source -----\n\n".join(texts))]
                used_ai = True
            except ai.AIError as e:
                errors.append(f"AI sorting didn't work, so the built-in sorter was used instead. {e}")
    if not used_ai:
        results = [parse_resume_text(t) for t in texts]
    return jsonify(results=results, files=files, errors=errors, ai=used_ai)


@app.get("/api/ai/status")
def api_ai_status():
    return jsonify(ai.status())


@app.post("/api/ai/settings")
def api_ai_settings():
    if ai.HOSTED:  # on a public site the key comes from the host's secret settings, never from visitors
        return jsonify(error="AI is managed by the site owner."), 403
    body = request.get_json(force=True, silent=True) or {}
    current = ai.load_settings()
    if body.get("remove"):
        ai.save_settings(current["provider"], "", "", off=True)  # off also stops the built-in key
        return jsonify(ai.status())
    provider = body.get("provider") if body.get("provider") in ai.PROVIDERS else "gemini"
    key = (body.get("key") or "").strip()
    if not key and provider == current["provider"]:
        key = current["key"]  # changing only the model keeps the saved key
    if not key:
        key = ai.EMBEDDED_KEYS.get(provider, "")
    if not key:
        return jsonify(error="Paste an API key first."), 400
    trial = {"provider": provider, "key": key, "model": (body.get("model") or "").strip()}
    try:
        ai.chat([{"role": "user", "content": "Reply with the single word OK."}], settings=trial, temperature=0)
    except ai.AIError as e:
        return jsonify(error=str(e)), 400
    ai.save_settings(provider, key, trial["model"])
    return jsonify(ai.status())


@app.post("/api/ai/polish")
def api_ai_polish():
    if not ai_allowed():
        return jsonify(error="You've hit the AI limit for now. Try again in a few minutes."), 429
    try:
        return jsonify(ai.polish(request.get_json(force=True, silent=True) or {}))
    except ai.AIError as e:
        return jsonify(error=str(e)), 502


@app.post("/api/docx")
def api_docx():
    payload = request.get_json(force=True, silent=True) or {}
    model = payload.get("model") or {}
    buf = build_docx(model, payload.get("design") or {})
    name = re.sub(r"[^\w\-]+", "_", payload.get("filename") or "Resume").strip("_") or "Resume"
    return send_file(buf, as_attachment=True, download_name=f"{name}.docx",
                     mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


if __name__ == "__main__":
    url = f"http://127.0.0.1:{PORT}"
    print(f"\n  Shortlist is running at {url}  (Ctrl+C to stop)\n")
    if "--no-browser" not in sys.argv:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    app.run(host="127.0.0.1", port=PORT, debug=False)
