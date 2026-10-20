# Shortlist: resume studio

A local resume builder. Drop in old resumes / activity lists (PDF, DOCX, ODT, RTF, TXT, MD, HTML) or just type,
pick what the resume is for, and download a formatted PDF or Word file.

## Run it

Double-click `run.bat` (first run installs Flask, python-docx and pypdf into `.venv`), or:

```
py -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python app.py
```

Then open http://127.0.0.1:5050 (it opens automatically). Set `PORT` to use a different port.

## Targets

| Target | What changes |
|---|---|
| Internship | Education first, GPA + relevant coursework shown, projects high |
| Job | Summary + experience first, education lower, GPA only if 3.5+ |
| College App | Academics, test scores, extracurriculars, honors, service |
| Scholarship | Honors, leadership and service lead |
| Research | CV style: research & projects, coursework, technical skills; may run past one page |
| First Job | Skills & strengths first, then any work, service, activities |

Your data is saved in the browser on this computer only. Without AI, nothing is sent anywhere except to the local Python server.

## AI (optional, free)

Click **Connect AI** in the top bar and paste a free key:

- **Google Gemini** (recommended): get a key at https://aistudio.google.com/apikey. No credit card. On the free tier Google may use what you send to improve its products.
- **Groq**: get a key at https://console.groq.com/keys. No credit card.

With AI connected:

- **Sort with AI** (Import tab) files your uploads and notes into the right sections.
- **Polish** (Your info tab) rewrites the summary and every bullet for your target, tidies skills and orders entries by relevance. **Undo** restores your version.
- **Draft for me** writes the summary with AI.

The key is saved in `ai_settings.json` in this folder (or set `GEMINI_API_KEY` / `GROQ_API_KEY`). Don't share that file.

## Put it online (Render, free) without exposing the key

The key is stored as a secret on Render, never in the code. Visitors' browsers talk to your server; only the server talks to Groq.

1. Make sure `EMBEDDED_KEYS` in `ai.py` is empty and push this folder to a GitHub repo. `.gitignore` already keeps `ai_settings.json` and `.venv` out.
2. On https://render.com, sign in with GitHub, click **New > Blueprint**, and pick the repo. It reads `render.yaml`.
3. When it asks for `GROQ_API_KEY`, paste your key. Click **Apply**.
4. Your site is live at `https://shortlist-xxxx.onrender.com` after the build finishes.

On the hosted site the Connect AI button is hidden, the key can't be read or changed by visitors, and each visitor gets
20 AI calls per 10 minutes (change with `AI_LIMIT_PER_10_MIN`). Free Render services sleep after about 15 minutes idle,
so the first visit after a quiet spell takes up to a minute to load.

Netlify can't run this as is: it only runs JavaScript/TypeScript/Go functions, and the file reading and Word export here are Python.

## Files

- `app.py`: Flask server (`/api/extract`, `/api/docx`)
- `extract.py`: reads uploaded files and sorts text into resume sections
- `docx_builder.py`: writes the Word file
- `static/`: the web app (layout, live preview, optimization rules)
