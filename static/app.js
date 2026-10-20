'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ------------------------------------------------------------------ icons

const ICONS = {
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  briefcase: '<rect x="2.5" y="7" width="19" height="13.5" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2.5 13h19"/>',
  cap: '<path d="M22 9.5L12 4.5 2 9.5l10 5 10-5z"/><path d="M6 11.5v5c3 2.8 9 2.8 12 0v-5M22 9.5v5"/>',
  medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/><path d="M12 6.5v5M10 8.5h4"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3"/><path d="M7.2 15h9.6"/>',
  sprout: '<path d="M7 21h10M12 21v-9M12 12c0-4.4 3-6.6 7.5-6.6 0 4.4-3 6.6-7.5 6.6zM12 14.5c0-3.3-2.3-5.5-6.5-5.5 0 3.3 2.3 5.5 6.5 5.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6"/>',
  star: '<path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.6l-5.8 3 1.1-6.4-4.7-4.6 6.5-.9z"/>',
  heart: '<path d="M20.4 4.9a5.2 5.2 0 0 0-7.4 0L12 5.9l-1-1a5.2 5.2 0 0 0-7.4 7.4l1 1L12 20.6l7.4-7.3 1-1a5.2 5.2 0 0 0 0-7.4z"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6M14 4l-4 16"/>',
  bolt: '<path d="M13 2L3.5 14H12l-1 8 9.5-12H12l1-8z"/>',
  doc: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5M9 15l2 2 4-4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2.5H6.5A2.5 2.5 0 0 0 4 5v14.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  pencil: '<path d="M16.5 3.5l4 4L8 20H4v-4z"/><path d="M13.5 6.5l4 4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5l1-13M9 7V4h6v3"/>',
  grip: '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 7v6M12 17h.01"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  file: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  download: '<path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14"/>',
  upload: '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4.5 14.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5"/>',
};
const icon = (name, size = 18, sw = 1.9) =>
  `<svg class="i" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// ------------------------------------------------------------------ configuration

const COLORS = { blue: '#2E5BFF', lime: '#4D9F0A', sun: '#E08A00', pink: '#E0337A', mint: '#0E9F8E', coral: '#F2541B' };

const MODES = {
  internship: {
    label: 'Internship', icon: 'rocket', tile: COLORS.blue, tileInk: '#fff',
    desc: 'Education and projects first',
    how: 'Education leads with GPA and relevant coursework, then experience and projects that show what you can already do.',
    order: ['summary', 'education', 'experience', 'projects', 'activities', 'volunteer', 'skills', 'certifications', 'awards'],
    titles: { activities: 'Leadership & Activities' },
    gpa: 'show', coursework: true, maxBullets: 4,
    checks(c, add) {
      if (!c.gpa) add('tip', 'Add your GPA. Internship recruiters screen on it (skip it only if it’s under about 3.0).');
      if (!c.lists.coursework) add('tip', 'List 4 to 6 relevant courses. They stand in for experience you don’t have yet.');
      if (!c.entries.projects) add('tip', 'Add a project from class, a club or your own time. It’s the best proof of skills for interns.');
      if (c.lists.skills < 2) add('tip', 'Add a Skills section with tools and technical skills.');
    },
  },
  job: {
    label: 'Job', icon: 'briefcase', tile: COLORS.lime, tileInk: '#101014',
    desc: 'Experience first, results up front',
    how: 'A short summary up top, then work experience and skills. Education moves down and GPA only shows if it’s 3.5 or higher.',
    order: ['summary', 'experience', 'projects', 'skills', 'certifications', 'education', 'activities', 'volunteer', 'awards'],
    titles: { experience: 'Professional Experience', activities: 'Leadership' },
    gpa: 'strong', coursework: false, maxBullets: 5,
    checks(c, add) {
      if (!c.summary) add('warn', 'Add a 2 to 3 line summary. Hiring managers read it first, and “Draft for me” in Your info writes one.');
      if (!c.entries.experience) add('warn', 'Job resumes need work experience. Internships, part-time jobs and freelance all count.');
      if (c.lists.skills < 2) add('tip', 'Add more skills. Applicant tracking systems match keywords from the job post.');
    },
  },
  college: {
    label: 'College App', icon: 'cap', tile: COLORS.sun, tileInk: '#101014',
    desc: 'Academics, activities, honors',
    how: 'Academics and test scores first, then extracurriculars, honors and service. That’s what admissions officers scan for.',
    order: ['education', 'tests', 'activities', 'awards', 'volunteer', 'experience', 'projects', 'skills', 'certifications'],
    titles: { activities: 'Extracurricular Activities', awards: 'Honors & Awards', volunteer: 'Community Service', experience: 'Work Experience', tests: 'Test Scores' },
    gpa: 'show', coursework: true, maxBullets: 3,
    checks(c, add) {
      if (c.entries.activities < 3) add('tip', 'Colleges like to see 3 or more activities. Clubs, sports, arts, jobs and family responsibilities all count.');
      if (!c.lists.tests) add('tip', 'Add SAT, ACT or AP scores if you’re submitting them.');
      if (!c.lists.awards) add('tip', 'Add honors like honor roll, competitions, AP Scholar or team awards.');
      if (!c.entries.volunteer) add('tip', 'Community service stands out. Include hours if you have them.');
      if (!c.gpa) add('tip', 'Add your GPA and note whether it’s weighted.');
    },
  },
  scholarship: {
    label: 'Scholarship', icon: 'medal', tile: COLORS.pink, tileInk: '#101014',
    desc: 'Achievement, service, leadership',
    how: 'Leads with academics and honors, then leadership and service, the things scholarship committees actually score.',
    order: ['summary', 'education', 'awards', 'activities', 'volunteer', 'experience', 'tests', 'projects', 'skills', 'certifications'],
    titles: { activities: 'Leadership & Involvement', volunteer: 'Community Service', awards: 'Honors & Awards' },
    gpa: 'show', coursework: false, maxBullets: 3,
    checks(c, add) {
      if (!c.lists.awards) add('warn', 'Scholarship committees look for honors first. Add any awards or recognition.');
      if (!c.entries.volunteer) add('tip', 'Add community service with hours. Many scholarships score service directly.');
      if (!c.summary) add('tip', 'A short summary of your goals helps committees connect the dots.');
    },
  },
  research: {
    label: 'Research', icon: 'flask', tile: COLORS.mint, tileInk: '#101014',
    desc: 'Academic CV style',
    how: 'CV style: education, research and projects, then relevant experience, honors and technical skills. Allowed to run long.',
    order: ['education', 'projects', 'experience', 'awards', 'skills', 'certifications', 'activities', 'volunteer', 'tests'],
    titles: { projects: 'Research & Projects', experience: 'Relevant Experience', skills: 'Technical Skills' },
    gpa: 'show', coursework: true, maxBullets: 4, multiPage: true,
    checks(c, add) {
      if (!c.entries.projects) add('warn', 'Add research or projects. They’re the core of an academic CV.');
      if (!c.lists.coursework) add('tip', 'List advanced coursework that’s relevant to the lab or program.');
      if (c.lists.skills < 2) add('tip', 'Add methods, lab techniques or software like R, Python or MATLAB.');
    },
  },
  firstjob: {
    label: 'First Job', icon: 'sprout', tile: COLORS.coral, tileInk: '#101014',
    desc: 'Part-time and entry level',
    how: 'Leads with strengths and skills, then any work, service and activities. Perfect when your work history is short.',
    order: ['summary', 'skills', 'experience', 'volunteer', 'activities', 'education', 'certifications', 'awards', 'projects'],
    titles: { skills: 'Skills & Strengths', experience: 'Experience', activities: 'Activities' },
    gpa: 'strong', coursework: false, maxBullets: 3,
    checks(c, add) {
      if (!c.summary) add('tip', 'Add a friendly two-line summary that mentions reliability and availability.');
      if (c.lists.skills < 2) add('warn', 'Add skills: customer service, teamwork, cash handling, languages, software.');
      if (!c.lists.certifications) add('tip', 'Certifications like CPR, First Aid or a food handler card help for entry-level jobs.');
    },
  },
};

const DEFAULT_TITLES = {
  summary: 'Summary', education: 'Education', experience: 'Experience', activities: 'Activities & Leadership',
  volunteer: 'Volunteer Experience', projects: 'Projects', skills: 'Skills', awards: 'Awards & Honors',
  certifications: 'Certifications', tests: 'Test Scores', coursework: 'Relevant Coursework',
};

const ENTRY = {
  education: {
    label: 'Education', icon: 'cap', color: COLORS.sun, noun: 'school', heading: e => e.school, sub: e => e.degree,
    fields: [['school', 'School', 'Lincoln High School'], ['degree', 'Degree or program', 'High School Diploma'],
      ['dates', 'Dates', 'Aug 2022 – May 2026'], ['location', 'Location', 'Austin, TX'], ['gpa', 'GPA', '3.92 / 4.0']],
    bullets: 'Details like honors or focus areas, one per line',
  },
  experience: {
    label: 'Work Experience', icon: 'briefcase', color: COLORS.blue, noun: 'job', heading: e => e.title, sub: e => e.org,
    fields: [['title', 'Role', 'Sales Associate'], ['org', 'Company', 'Target'], ['dates', 'Dates', 'Jun 2024 – Present'], ['location', 'Location', 'Austin, TX']],
    bullets: 'What you did, one per line. Start with a verb and add numbers.',
  },
  activities: {
    label: 'Extracurriculars & Leadership', icon: 'star', color: COLORS.pink, noun: 'activity', heading: e => e.title, sub: e => e.org,
    fields: [['title', 'Role', 'President'], ['org', 'Club, team or org', 'Robotics Club'], ['dates', 'Dates or grades', 'Grades 10–12'], ['location', 'Location or hours', '6 hrs/week']],
    bullets: 'Your impact, one per line: members led, money raised, results',
  },
  volunteer: {
    label: 'Volunteer & Service', icon: 'heart', color: COLORS.mint, noun: 'role', heading: e => e.title, sub: e => e.org,
    fields: [['title', 'Role', 'Volunteer Tutor'], ['org', 'Organization', 'Austin Public Library'], ['dates', 'Dates', '2022 – Present'], ['location', 'Location or hours', '120+ hours']],
    bullets: 'What you did, one per line',
  },
  projects: {
    label: 'Projects & Research', icon: 'code', color: COLORS.coral, noun: 'project', heading: e => e.title, sub: e => e.org,
    fields: [['title', 'Project', 'Budget Buddy'], ['org', 'Context or tools', 'Personal · React, Firebase'], ['dates', 'Dates', '2024'], ['location', 'Link (optional)', 'github.com/you/budget']],
    bullets: 'What it does and what you achieved, one per line',
  },
};
const ENTRY_KEYS = Object.keys(ENTRY);

const LISTS = {
  skills: { label: 'Skills', icon: 'bolt', color: COLORS.lime, rows: 4, hint: 'One group per line, like “Languages: Python, Java” or “Excel, Canva, Spanish (fluent)”.' },
  awards: { label: 'Awards & Honors', icon: 'medal', color: COLORS.sun, rows: 4, hint: 'One per line, like “National Merit Commended Scholar (2025)”.' },
  certifications: { label: 'Certifications', icon: 'doc', color: COLORS.mint, rows: 2, hint: 'One per line, like “CPR & First Aid, American Red Cross (2024)”.' },
  coursework: { label: 'Relevant Coursework', icon: 'book', color: COLORS.pink, rows: 2, hint: 'Comma or line separated. Shows under Education when your target uses it.' },
  tests: { label: 'Test Scores', icon: 'pencil', color: COLORS.coral, rows: 2, hint: 'One per line, like “SAT 1510 (Math 780, EBRW 730)” or “AP Calculus BC: 5”.' },
};
const LIST_KEYS = Object.keys(LISTS);

const TEMPLATES = [['clean', 'Clean'], ['classic', 'Classic'], ['bold', 'Bold'], ['minimal', 'Minimal']];
const ACCENTS = [['#1A1A1A', 'Black'], ['#2250FF', 'Electric'], ['#E8553D', 'Coral'], ['#12A37A', 'Emerald'], ['#F08A24', 'Tangerine'], ['#D6336C', 'Raspberry'], ['#2B2B2B', 'Graphite']];
const FONTS = {
  sans: ['Sans', "'Inter', Arial, sans-serif"],
  serif: ['Serif', "'Source Serif 4', Georgia, serif"],
  modern: ['Modern', "'Manrope', 'Segoe UI', sans-serif"],
};

const PAGE_H = 1056, MARGIN = 52.8, AVAIL = PAGE_H - 2 * MARGIN;
const STORE_KEY = 'shortlist.v1';
const BULLET_RE = /^\s*(?:[•●○◦▪▫■□‣⁃∙·➢➤►▶✓✔]\s*|[-*–—]\s+|\d{1,2}[.)]\s+)/;

// ------------------------------------------------------------------ state

function blank() {
  return {
    target: 'internship', role: '',
    profile: { name: '', email: '', phone: '', location: '', links: '', summary: '' },
    education: [], experience: [], activities: [], volunteer: [], projects: [],
    skills: '', awards: '', certifications: '', coursework: '', tests: '',
    design: { template: 'clean', accent: '#1A1A1A', font: 'sans', size: 10.5, gpa: 'auto', strengthen: true, fit: true },
  };
}

function blankEntry(sec) {
  const e = { bullets: '', hidden: false };
  ENTRY[sec].fields.forEach(([k]) => { e[k] = ''; });
  return e;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw), base = blank();
    const design = { ...base.design, ...saved.design };
    if (!design.accentChosen) design.accent = base.design.accent;  // old saves got a colored default; black is the new start
    return { ...base, ...saved, profile: { ...base.profile, ...saved.profile }, design };
  } catch { return null; }
}

let saveTimer;
function save() {
  const el = $('#saveState');
  el.textContent = 'Saving';
  el.classList.add('busy');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); el.textContent = 'Saved on this device'; }
    catch { el.textContent = 'Not saved (storage blocked)'; }
    el.classList.remove('busy');
  }, 300);
}

let state = load() || blank();
let pendingFiles = [];
let lastModel = null;
let lastFit = { size: 10.5, gap: 1, pages: 1 };
let zoomMode = 'fit';

// ------------------------------------------------------------------ text helpers

const lines = s => String(s || '').split('\n').map(x => x.replace(BULLET_RE, '').trim()).filter(Boolean);
const hasNumber = s => /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|dozen|hundred|thousand)\b/i.test(s);
const words = s => s.trim().split(/\s+/).filter(Boolean).length;
const humanList = a => a.length < 3 ? a.join(' and ') : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;

const WEAK = [
  [/^(?:i|we)\s+/i, ''],
  [/^(?:was|were)\s+responsible\s+for\s+/i, 'Managed '],
  [/^responsible\s+for\s+/i, 'Managed '],
  [/^duties\s+included\s+/i, ''],
  [/^(?:was\s+)?in\s+charge\s+of\s+/i, 'Led '],
  [/^(?:was\s+)?tasked\s+with\s+/i, 'Handled '],
  [/^helped\s+(?:out\s+)?with\s+/i, 'Supported '],
  [/^helped\s+out\s+/i, 'Supported '],
  [/^assisted\s+with\s+/i, 'Supported '],
  [/^worked\s+on\s+/i, 'Developed '],
  [/^worked\s+with\s+/i, 'Collaborated with '],
  [/^(?:was\s+)?(?:a\s+)?(?:part|member)\s+of\s+/i, 'Contributed to '],
  [/^participated\s+in\s+/i, 'Contributed to '],
  [/^did\s+/i, 'Completed '],
  [/^made\s+/i, 'Created '],
  [/^got\s+/i, 'Earned '],
  [/^talked\s+(?:to|with)\s+/i, 'Communicated with '],
  [/^tried\s+to\s+/i, 'Worked to '],
];

const IRREGULAR = {
  running: 'ran', leading: 'led', building: 'built', teaching: 'taught', writing: 'wrote', making: 'made', selling: 'sold',
  keeping: 'kept', meeting: 'met', bringing: 'brought', holding: 'held', speaking: 'spoke', taking: 'took', giving: 'gave',
  cutting: 'cut', setting: 'set', putting: 'put', getting: 'got', doing: 'completed', finding: 'found', paying: 'paid',
  buying: 'bought', spending: 'spent', winning: 'won', choosing: 'chose', drawing: 'drew', driving: 'drove', seeing: 'saw',
};
function toPast(gerund) {
  const w = gerund.toLowerCase();
  if (IRREGULAR[w]) return IRREGULAR[w];
  const stem = w.slice(0, -3);
  return /[^aeiou]y$/.test(stem) ? stem.slice(0, -1) + 'ied' : stem + 'ed';
}
// "Responsible for helping X" -> "Helped X"; "Helped with building X" -> "Contributed to building X"
const OWNED_GERUND = /^(?:(?:i|we)\s+)?(?:(?:was|were)\s+)?(?:responsible\s+for|in\s+charge\s+of|tasked\s+with|worked\s+on|duties\s+included)\s+(\w+ing)\b/i;
const SHARED_GERUND = /^(?:(?:i|we)\s+)?(?:helped\s+(?:out\s+)?with|assisted\s+(?:with|in)|participated\s+in|(?:was\s+)?(?:a\s+)?(?:part|member)\s+of)\s+(\w+ing)\b/i;

function tidy(b) {
  b = b.trim().replace(/\s+/g, ' ').replace(/[.;]+$/, '');
  return b.charAt(0).toUpperCase() + b.slice(1);
}
function strengthen(b) {
  let out = b.trim();
  if (OWNED_GERUND.test(out)) return tidy(out.replace(OWNED_GERUND, (_, g) => toPast(g)));
  if (SHARED_GERUND.test(out)) return tidy(out.replace(SHARED_GERUND, (_, g) => 'Contributed to ' + g.toLowerCase()));
  for (const [re, rep] of WEAK) out = out.replace(re, rep);
  return tidy(out);
}
const polish = b => state.design.strengthen ? strengthen(b) : tidy(b);

function gpaValue(g) {
  const m = String(g || '').match(/(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/);
  if (!m) return null;
  const v = parseFloat(m[1]), d = m[2] ? parseFloat(m[2]) : (v <= 4 ? 4 : v <= 5 ? 5 : 100);
  return v / d;
}
function showGpa(gpa, mode) {
  if (!String(gpa || '').trim()) return false;
  const pref = state.design.gpa;
  if (pref !== 'auto') return pref === 'show';
  if (mode.gpa === 'show') return true;
  const r = gpaValue(gpa);
  return r === null || r >= 0.875;
}
const visible = sec => state[sec].filter(e => !e.hidden && (ENTRY[sec].heading(e) || ENTRY[sec].sub(e) || e.bullets.trim()));

// ------------------------------------------------------------------ model (shared by preview + Word export)

function buildModel() {
  const mode = MODES[state.target], p = state.profile;
  const contact = [p.location, p.email, p.phone, ...String(p.links || '').split(/\s*[|,\n]\s*|\s{2,}/)]
    .map(s => (s || '').trim()).filter(Boolean);
  const coursework = lines(state.coursework.replace(/[,;]/g, '\n'));
  const sections = [];

  for (const key of mode.order) {
    const title = mode.titles[key] || DEFAULT_TITLES[key];
    if (key === 'summary') {
      if (p.summary.trim()) sections.push({ key, title, type: 'text', text: p.summary.trim().replace(/\s+/g, ' ') });
    } else if (ENTRY[key]) {
      const items = visible(key).map((e, i) => {
        if (key === 'education') {
          const bullets = lines(e.bullets).map(tidy);
          if (i === 0 && mode.coursework && coursework.length) bullets.push(`Relevant Coursework: ${coursework.join(', ')}`);
          const g = e.gpa.trim();
          return { heading: e.school.trim(), sub: e.degree.trim(), dates: e.dates.trim(), location: e.location.trim(),
            meta: showGpa(g, mode) ? `GPA: ${g}` : '', bullets };
        }
        return { heading: (e.title || e.org).trim(), sub: e.title.trim() ? e.org.trim() : '', dates: e.dates.trim(),
          location: e.location.trim(), meta: '', bullets: lines(e.bullets).map(polish) };
      });
      if (items.length) sections.push({ key, title, type: 'entries', items });
    } else {
      const items = lines(state[key]).map(tidy);
      if (items.length) sections.push({ key, title, type: 'list', style: key === 'skills' ? 'skills' : key === 'tests' ? 'inline' : 'bullets', items });
    }
  }
  return { name: p.name.trim(), contact, sections };
}

function labelled(text) {
  const m = text.match(/^([^:]{1,32}):\s*(.+)$/);
  return m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(text);
}

function resumeHTML(model) {
  const d = state.design;
  const contact = model.contact.map(esc).join('<span class="sep">•</span>');
  let h = `<header class="rz-head"><h1>${esc(model.name || 'Your Name')}</h1>${contact ? `<div class="rz-contact">${contact}</div>` : ''}</header>`;
  for (const s of model.sections) {
    h += `<section class="rz-sec"><h2>${esc(s.title)}</h2>`;
    if (s.type === 'text') h += `<p>${esc(s.text)}</p>`;
    else if (s.type === 'entries') {
      for (const it of s.items) {
        h += '<div class="rz-entry">';
        if (it.heading || it.sub || it.dates) {
          const left = it.heading
            ? `<strong>${esc(it.heading)}</strong>${it.sub ? `, <em>${esc(it.sub)}</em>` : ''}`
            : `<strong>${esc(it.sub)}</strong>`;
          h += `<div class="rz-row"><div>${left}</div><div class="rz-date">${esc(it.dates)}</div></div>`;
        }
        if (it.meta || it.location) h += `<div class="rz-row"><div class="rz-meta">${esc(it.meta)}</div><div class="rz-loc">${esc(it.location)}</div></div>`;
        if (it.bullets.length) h += `<ul>${it.bullets.map(b => `<li>${labelled(b)}</li>`).join('')}</ul>`;
        h += '</div>';
      }
    } else if (s.style === 'inline') h += `<p>${s.items.map(esc).join('<span class="dot">·</span>')}</p>`;
    else if (s.style === 'skills') h += `<div class="rz-lines">${s.items.map(x => `<div>${labelled(x)}</div>`).join('')}</div>`;
    else h += `<ul>${s.items.map(x => `<li>${labelled(x)}</li>`).join('')}</ul>`;
    h += '</section>';
  }
  return `<div class="rz t-${d.template}" style="--accent:${d.accent};--rz-font:${FONTS[d.font][1].replace(/"/g, "'")}">${h}</div>`;
}

// ------------------------------------------------------------------ preview

let previewQueued = false;
function schedulePreview() {
  if (previewQueued) return;
  previewQueued = true;
  requestAnimationFrame(() => { previewQueued = false; renderPreview(); });
}

function flashPage() {
  const page = $('#page');
  page.classList.remove('swap');
  void page.offsetWidth;
  page.classList.add('swap');
}

function renderPreview() {
  const page = $('#page'), d = state.design, mode = MODES[state.target];
  lastModel = buildModel();
  page.innerHTML = resumeHTML(lastModel);
  const rz = $('.rz', page);
  const apply = (fs, gap) => {
    rz.style.setProperty('--fs', fs + 'pt');
    rz.style.setProperty('--gap', gap);
    rz.style.setProperty('--lh', (1.22 + 0.1 * Math.min(1, gap)).toFixed(3));
  };
  let fs = +d.size, gap = 1;
  apply(fs, gap);
  if (d.fit && !mode.multiPage) {
    while (rz.offsetHeight > AVAIL && (fs > 9 || gap > 0.55)) {
      if (gap > 0.55) gap = +(gap - 0.09).toFixed(2);
      else fs = +(fs - 0.25).toFixed(2);
      apply(fs, gap);
    }
  }
  const pages = Math.max(1, Math.ceil((rz.offsetHeight - 2) / AVAIL));
  lastFit = { size: fs, gap, pages };

  page.style.minHeight = Math.max(PAGE_H, pages * PAGE_H) + 'px';
  $('#guides').innerHTML = Array.from({ length: pages - 1 }, (_, i) =>
    `<div style="top:${MARGIN + (i + 1) * AVAIL}px"><span>Page ${i + 2}</span></div>`).join('');

  const info = $('#pageInfo');
  const shrunk = fs < +d.size || gap < 1;
  info.textContent = pages > 1 ? `${pages} pages` : shrunk ? `1 page, fitted to ${fs}pt` : '1 page';
  info.classList.toggle('over', pages > 1 && !mode.multiPage);
  $('#modePill').textContent = `${mode.label} mode`;
  scalePreview();
  renderInsights();
}

function scalePreview() {
  const wrap = $('#previewWrap'), holder = $('#pageHolder'), scaler = $('#scaler');
  const avail = wrap.clientWidth - 48;
  const scale = zoomMode === 'fit' ? Math.min(1, avail / 824) : 1;
  scaler.style.transform = `scale(${scale})`;
  holder.style.width = 824 * scale + 'px';
  holder.style.height = ($('#page').offsetHeight + 8) * scale + 'px';
}

// ------------------------------------------------------------------ insights

let insightsOpen = true;
let shownScore = null;
let celebrated = false;

function renderInsights() {
  const mode = MODES[state.target], p = state.profile;
  const items = [];
  const add = (level, text) => items.push({ level, text });

  const ctx = {
    summary: !!p.summary.trim(),
    gpa: (visible('education')[0] || {}).gpa || '',
    entries: Object.fromEntries(ENTRY_KEYS.map(k => [k, visible(k).length])),
    lists: Object.fromEntries(LIST_KEYS.map(k => [k, lines(state[k]).length])),
  };

  if (!p.name.trim()) add('warn', 'Add your name at the top of Your info.');
  if (!p.email.trim()) add('warn', 'Add an email address so they can reach you.');
  else if (!p.phone.trim()) add('tip', 'Add a phone number.');

  const allEntries = ENTRY_KEYS.filter(k => k !== 'education').flatMap(k => visible(k));
  const bullets = allEntries.flatMap(e => lines(e.bullets));
  const edu = visible('education')[0];
  const hasContent = allEntries.length || edu;
  if (!hasContent) add('warn', 'Nothing to show yet. Import a file or type your info in step 2.');
  if (bullets.length) {
    const withNum = bullets.filter(hasNumber).length;
    if (withNum / bullets.length >= 0.4) add('good', `${withNum} of ${bullets.length} bullets show numbers. Results stick.`);
    else add('warn', `Only ${withNum} of ${bullets.length} bullets have numbers. Add counts, %, $, hours or team sizes.`);
    const weak = bullets.filter(b => strengthen(b) !== tidy(b)).length;
    if (weak) {
      add(state.design.strengthen ? 'good' : 'warn', state.design.strengthen
        ? `Rewrote ${weak} weak opener${weak > 1 ? 's' : ''}, like “Responsible for helping” into “Helped”.`
        : `${weak} bullet${weak > 1 ? 's start' : ' starts'} weakly. Turn on “Strengthen wording” in Design.`);
    }
    const long = bullets.filter(b => words(b) > 28).length;
    if (long) add('tip', `${long} bullet${long > 1 ? 's are' : ' is'} over 28 words. Aim for one line, two at most.`);
  } else if (allEntries.length) {
    add('tip', 'Add 1 to 3 bullets under each entry describing what you did and the result.');
  }
  const crowded = allEntries.filter(e => lines(e.bullets).length > mode.maxBullets).length;
  if (crowded) add('tip', `${crowded} entr${crowded > 1 ? 'ies have' : 'y has'} more than ${mode.maxBullets} bullets. ${mode.label} resumes read best when trimmed.`);

  mode.checks(ctx, add);

  if (edu && edu.gpa && !showGpa(edu.gpa, mode)) add('tip', `GPA is hidden for ${mode.label} because it’s under 3.5. Change that in Design.`);
  if (!['college', 'scholarship', 'research'].includes(state.target) && ctx.lists.tests) add('tip', `Test scores are left off ${mode.label} resumes.`);

  if (lastFit.pages > 1 && !mode.multiPage) {
    add('warn', state.design.fit
      ? `Still ${lastFit.pages} pages at the smallest size. Trim older entries or hide them with the eye button.`
      : `Runs to ${lastFit.pages} pages. Turn on “Fit to one page” in Design or trim entries.`);
  } else if (lastFit.pages === 1 && hasContent) {
    add('good', 'Fits on one page.');
  }

  const warns = items.filter(i => i.level === 'warn').length, tips = items.filter(i => i.level === 'tip').length;
  const empty = !hasAnyInfo();
  const score = empty ? 0 : Math.max(20, Math.min(100, 100 - warns * 13 - tips * 5));
  const ring = score >= 85 ? '#16A34A' : score >= 65 ? '#E08A00' : '#E5484D';
  const rank = { warn: 0, tip: 1, good: 2 };
  const sorted = [...items].sort((a, b) => rank[a.level] - rank[b.level]);
  const headline = empty ? 'No info yet' : score >= 95 ? 'Ready to send' : score >= 85 ? 'Looking strong' : score >= 65 ? 'Almost there' : 'Needs a few things';
  const markIcon = { good: icon('check', 13, 2.6), warn: icon('alert', 13, 2.8), tip: icon('arrow', 13, 2.4) };
  const C = 2 * Math.PI * 25, prev = shownScore ?? score;

  $('#insights').innerHTML = `
    <div class="ins-top">
      <div class="score">
        <svg width="58" height="58" viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="none" stroke="#EEF0F4" stroke-width="5"/>
        <circle id="scoreRing" cx="29" cy="29" r="25" fill="none" stroke="${ring}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - prev / 100)}"/></svg>
        <b id="scoreNum">${prev}</b>
      </div>
      <div style="flex:1;min-width:0">
        <div class="ins-title">${empty ? 'Add your info to get a score' : `${headline} for ${esc(mode.label)}`}</div>
        <div class="ins-sub">${empty ? 'Type a few sentences about yourself or drop in an old resume, then hit Optimize my Resume'
          : `${warns ? `${warns} thing${warns > 1 ? 's' : ''} to fix` : 'Nothing to fix'}, ${tips} suggestion${tips === 1 ? '' : 's'}`}</div>
      </div>
      <button class="btn ins-toggle" id="insToggle" type="button">${insightsOpen ? 'Hide' : 'Show'} tips</button>
    </div>
    <ul class="ins-list" ${insightsOpen ? '' : 'hidden'}>
      ${sorted.map((i, n) => `<li class="${i.level}" style="animation-delay:${n * 30}ms"><span class="mark">${markIcon[i.level]}</span><span>${esc(i.text)}</span></li>`).join('')}
    </ul>`;

  requestAnimationFrame(() => { const r = $('#scoreRing'); if (r) r.style.strokeDashoffset = C * (1 - score / 100); });
  countTo(score);
  if (!booted) celebrated = score >= 90;  // don't throw confetti for a score you already had
  if (booted && hasContent && score >= 90 && !celebrated) {
    celebrated = true;
    const r = $('.score').getBoundingClientRect();
    setTimeout(() => confetti(r.left + r.width / 2, r.top + r.height / 2, 90), 250);
  }
  if (score < 85) celebrated = false;
}

function countTo(target) {
  const el = $('#scoreNum');
  const from = shownScore ?? target;
  shownScore = target;
  if (calm || from === target) { el.textContent = target; return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / 500), eased = 1 - Math.pow(1 - k, 3);
    const live = $('#scoreNum');
    if (live) live.textContent = Math.round(from + (target - from) * eased);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ------------------------------------------------------------------ confetti

let bits = [], confettiRunning = false;
function confetti(x = innerWidth / 2, y = innerHeight / 3, n = 140) {
  if (calm) return;
  const c = $('#confetti'), ctx = c.getContext('2d'), dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const palette = ['#2E5BFF', '#2E5BFF', '#7FA0FF', '#16A34A', '#F5B400', '#E0337A', '#14B8A6', '#F2541B'];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI - Math.PI, speed = 6 + Math.random() * 10;
    bits.push({
      x, y, vx: Math.cos(a) * speed * 1.2, vy: Math.sin(a) * speed - 3,
      w: 6 + Math.random() * 7, h: 8 + Math.random() * 9, r: Math.random() * 6.3, vr: (Math.random() - .5) * .35,
      c: palette[(Math.random() * palette.length) | 0], round: Math.random() < .25, life: 0,
    });
  }
  if (confettiRunning) return;
  confettiRunning = true;
  const tick = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits = bits.filter(b => b.y < innerHeight + 40 && b.life < 260);
    for (const b of bits) {
      b.vy += 0.38; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life++;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.r);
      ctx.fillStyle = b.c;
      if (b.round) { ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, 6.3); ctx.fill(); }
      else { ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r))); }
      ctx.restore();
    }
    if (bits.length) requestAnimationFrame(tick);
    else { confettiRunning = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  };
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ summary drafting

function draftSummary() {
  const mode = state.target, role = state.role.trim();
  const edu = visible('education')[0];
  const skills = lines(state.skills).flatMap(l => l.replace(/^[^:]{1,32}:\s*/, '').split(/\s*[,;·]\s*/))
    .map(s => s.replace(/\s*\(.*?\)\s*/g, '').trim()).filter(Boolean).slice(0, 3);
  const exp = visible('experience'), acts = visible('activities'), vol = visible('volunteer'), proj = visible('projects');
  const level = edu && /high school/i.test(edu.school + ' ' + edu.degree) ? 'High school student'
    : edu && edu.degree ? `${edu.degree.replace(/,.*$/, '')} student` : 'Student';
  const student = `${level}${edu && edu.school ? ` at ${edu.school}` : ''}`;
  const skillText = skills.length ? humanList(skills) : '';
  const leader = acts.find(a => /president|captain|founder|lead|chair|head|director|editor/i.test(a.title));
  const leadText = leader ? `${leader.title.toLowerCase()} of ${leader.org || 'a student organization'}` : '';
  const gpa = edu && edu.gpa ? ` with a ${edu.gpa} GPA` : '';
  const exper = [...exp, ...proj].slice(0, 2).map(e => (e.title || e.org).trim()).filter(Boolean);

  const out = {
    internship: `${student} seeking a ${role || 'summer'} internship. ${exper.length ? `Hands-on experience as ${humanList(exper)}` : 'Hands-on experience through coursework and projects'}${skillText ? `, with skills in ${skillText}` : ''}. Quick learner who is eager to contribute to a real team and deliver results.`,
    job: `${role ? `${role} candidate` : 'Motivated, results-driven professional'}${exper.length ? ` with experience as ${humanList(exper)}` : ''}${skillText ? `. Skilled in ${skillText}` : ''}. Known for reliability, clear communication and measurable impact.`,
    college: `${student}${gpa}${leadText ? `, ${leadText}` : ''}${acts.length ? `, and active in ${humanList(acts.slice(0, 2).map(a => a.org || a.title))}` : ''}. ${role ? `Planning to study ${role}. ` : ''}Curious, driven and committed to my community.`,
    scholarship: `${student}${gpa} committed to academic excellence and service${vol.length ? ` through ${humanList(vol.slice(0, 2).map(v => v.org || v.title))}` : ''}. ${leadText ? `Serves as ${leadText}. ` : ''}${role ? `Pursuing ${role}. ` : ''}`,
    research: `${student} with interests in ${role || 'research'}${proj.length ? ` and experience on ${humanList(proj.slice(0, 2).map(x => x.title))}` : ''}${skillText ? `. Technical skills include ${skillText}` : ''}.`,
    firstjob: `Dependable, hardworking ${level.toLowerCase()} ready to ${role ? `join the team as a ${role}` : 'contribute from day one'}. ${acts.length ? `Proven teamwork through ${acts[0].org || acts[0].title}. ` : ''}${skillText ? `Strengths include ${skillText}. ` : ''}Flexible schedule and quick to learn.`,
  }[mode];
  return out.replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
}

// ------------------------------------------------------------------ rendering: targets

function renderTargets() {
  $('#targetGrid').innerHTML = Object.entries(MODES).map(([k, m]) => `
    <button class="target ${state.target === k ? 'active' : ''}" data-target="${k}" type="button" style="--tile:${m.tile};--tile-ink:${m.tileInk}">
      <span class="tick">${icon('check', 12, 3)}</span>
      <div class="t-icon">${icon(m.icon, 19)}</div>
      <div class="t-name">${m.label}</div>
      <div class="t-desc">${m.desc}</div>
    </button>`).join('');
  $('#modeNote').innerHTML = `${icon('sparkle', 15)}<b>${esc(MODES[state.target].label)} mode</b><span>${esc(MODES[state.target].how)}</span>`;
}

// ------------------------------------------------------------------ rendering: info form

const needNote = (value, text = 'Fill this in') => `<em class="need" ${String(value || '').trim() ? 'hidden' : ''}>${text}</em>`;

function field(path, label, value, placeholder, type = 'text', need = false) {
  return `<label class="fld"><span>${label}${need ? needNote(value) : ''}</span><input type="${type}" data-path="${path}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
}

const emptyNote = what => `<p class="empty-note">${icon('alert', 15, 2.4)}<span>Nothing about ${what} was found in your info yet. Fill it in here, or leave it blank if it doesn't apply.</span></p>`;

function entryTitle(sec, e) {
  const h = ENTRY[sec].heading(e), s = ENTRY[sec].sub(e);
  return h && s ? `${h} · ${s}` : h || s || '';
}

function cardHead(iconName, color, label, count, countLabel, needs = !count) {
  return `<summary><span class="s-icon" style="--c:${color}">${icon(iconName, 17)}</span>${label}
    ${needs ? '<span class="need-tag">Needs info</span>' : ''}
    <span class="count ${count ? 'has' : ''}">${countLabel ?? count}</span><span class="chev">${icon('chevron', 18)}</span></summary>`;
}

function aiCardHTML() {
  const mode = MODES[state.target].label;
  if (!aiInfo.configured && aiInfo.locked) return '';
  if (!aiInfo.configured) {
    return `<div class="ai-card"><span class="ai-card-icon">${icon('sparkle', 17)}</span>
      <div class="ai-card-text"><strong>Make it sound professional with AI</strong><small>Connect a free AI so Optimize my Resume also rewrites everything for ${esc(mode)}.</small></div>
      <div class="ai-card-actions"><button class="btn primary" type="button" data-ai-connect>Connect</button></div></div>`;
  }
  if (!aiBusy && !state.aiUndo && !state.aiTips?.length) return '';
  return `<div class="ai-card ${aiBusy ? 'busy' : ''}"><span class="ai-card-icon">${aiBusy ? '<i class="spin"></i>' : icon('sparkle', 17)}</span>
    <div class="ai-card-text"><strong>${aiBusy ? `Rewriting with ${esc(aiInfo.label)}` : `Optimized for ${esc(mode)}`}</strong>
      <small>${aiBusy ? 'Rewriting your summary, bullets and every section. This takes a few seconds.' : 'Read it over. Undo brings back your previous wording.'}</small></div>
    <div class="ai-card-actions">${state.aiUndo && !aiBusy ? '<button class="btn" type="button" data-ai-undo>Undo</button>' : ''}</div>
    ${state.aiTips?.length && !aiBusy ? `<div class="ai-tips"><b>Answer these to make it even stronger</b>
      <ul>${state.aiTips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}</div>`;
}

function renderInfo() {
  const p = state.profile;
  const open = new Set($$('#infoPanel details[open]').map(d => d.dataset.card));
  const isOpen = k => open.size ? open.has(k) : k === 'contact';

  let h = aiCardHTML() + `
  <details class="card" data-card="contact" ${isOpen('contact') ? 'open' : ''}>
    ${cardHead('user', COLORS.blue, 'Contact & summary', p.name ? 1 : 0, p.name ? icon('check', 14, 3) : '!', !(p.name && p.email && p.phone))}
    <div class="card-body">
      <div class="grid2">
        ${field('profile.name', 'Full name', p.name, 'Jordan Rivera', 'text', true)}
        ${field('profile.email', 'Email', p.email, 'jordan@email.com', 'email', true)}
        ${field('profile.phone', 'Phone', p.phone, '(512) 555-0147', 'tel', true)}
        ${field('profile.location', 'City, State', p.location, 'Austin, TX', 'text', true)}
        <label class="fld wide"><span>Links: LinkedIn, portfolio, GitHub (separate with | )</span>
          <input type="text" data-path="profile.links" value="${esc(p.links)}" placeholder="linkedin.com/in/jordan | jordan.dev"></label>
        <label class="fld wide">
          <span class="fld-row"><span>Summary${needNote(p.summary, 'Optimize writes this')}</span> <button class="mini-btn" type="button" data-draft>${icon('sparkle', 14)}Draft for me</button></span>
          <textarea data-path="profile.summary" rows="3" placeholder="Two or three lines on who you are and what you're aiming for. Optional for internships and college apps.">${esc(p.summary)}</textarea>
        </label>
      </div>
    </div>
  </details>`;

  for (const sec of ENTRY_KEYS) {
    const cfg = ENTRY[sec], items = state[sec];
    h += `
    <details class="card" data-card="${sec}" ${isOpen(sec) ? 'open' : ''}>
      ${cardHead(cfg.icon, cfg.color, cfg.label, items.length)}
      <div class="card-body">
        ${items.length ? '' : emptyNote(cfg.label.toLowerCase())}
        ${items.map((e, i) => {
          const t = entryTitle(sec, e);
          return `
          <div class="entry ${e.hidden ? 'is-hidden' : ''}" data-sec="${sec}" data-i="${i}">
            <div class="entry-head">
              <span class="grip" title="Drag to reorder">${icon('grip', 16)}</span>
              <span class="entry-title ${t ? '' : 'empty'}">${esc(t || `New ${cfg.noun}`)}</span>
              <button class="icon-btn" type="button" data-act="toggle" title="${e.hidden ? 'Show on resume' : 'Hide from resume (keeps it saved)'}">${icon(e.hidden ? 'eyeOff' : 'eye', 17)}</button>
              <button class="icon-btn" type="button" data-act="up" title="Move up">${icon('up', 16)}</button>
              <button class="icon-btn" type="button" data-act="down" title="Move down">${icon('down', 16)}</button>
              <button class="icon-btn danger" type="button" data-act="del" title="Delete">${icon('trash', 16)}</button>
            </div>
            <div class="grid2">${cfg.fields.map(([k, label, ph]) => field(`${sec}.${i}.${k}`, label, e[k], ph)).join('')}</div>
            <label class="fld wide"><span>${cfg.bullets}</span>
              <textarea data-path="${sec}.${i}.bullets" rows="3">${esc(e.bullets)}</textarea></label>
          </div>`;
        }).join('')}
        <button class="add-btn" type="button" data-add="${sec}">${icon('plus', 16, 2.6)}Add ${cfg.noun}</button>
      </div>
    </details>`;
  }

  for (const key of LIST_KEYS) {
    const cfg = LISTS[key], n = lines(state[key]).length;
    h += `
    <details class="card" data-card="${key}" ${isOpen(key) ? 'open' : ''}>
      ${cardHead(cfg.icon, cfg.color, cfg.label, n)}
      <div class="card-body">
        ${n ? '' : emptyNote(cfg.label.toLowerCase())}
        <textarea data-path="${key}" rows="${cfg.rows}">${esc(state[key])}</textarea>
        <p class="field-hint">${cfg.hint}</p>
      </div>
    </details>`;
  }
  $('#infoPanel').innerHTML = h;
}

// ------------------------------------------------------------------ rendering: design

function renderDesign() {
  const d = state.design, mode = MODES[state.target];
  $('#designPanel').innerHTML = `
    <div class="design-group" style="--dot:${COLORS.blue}">
      <h3>Template</h3>
      <div class="tpl-grid">
        ${TEMPLATES.map(([k, label]) => `
          <button class="tpl ${d.template === k ? 'active' : ''}" type="button" data-set="template" data-val="${k}" style="--sw:${d.accent}">
            <div class="tpl-thumb ${k}"><i class="n"></i><i class="w"></i><i class="h"></i><i></i><i class="w"></i><i class="h"></i><i></i></div>${label}
          </button>`).join('')}
      </div>
    </div>
    <div class="design-group" style="--dot:${COLORS.pink}">
      <h3>Accent color</h3>
      <div class="swatches">
        ${ACCENTS.map(([c, name]) => `<button class="swatch ${d.accent === c ? 'active' : ''}" type="button" title="${name}" aria-label="${name}" data-set="accent" data-val="${c}" style="--sw:${c}">${icon('check', 18, 3.2)}</button>`).join('')}
      </div>
    </div>
    <div class="design-group" style="--dot:${COLORS.sun}">
      <h3>Font</h3>
      <div class="seg">${Object.entries(FONTS).map(([k, [label, stack]]) => `<button type="button" class="${d.font === k ? 'active' : ''}" data-set="font" data-val="${k}" style="font-family:${stack.replace(/"/g, "'")}">${label}</button>`).join('')}</div>
    </div>
    <div class="design-group" style="--dot:${COLORS.mint}">
      <h3>Text size</h3>
      <div class="range-row"><input type="range" min="9" max="12" step="0.25" value="${d.size}" id="sizeRange" aria-label="Text size"><output id="sizeOut">${d.size}pt</output></div>
    </div>
    <div class="design-group" style="--dot:${COLORS.coral}">
      <h3>GPA</h3>
      <div class="seg">${[['auto', mode.gpa === 'show' ? 'Auto (show)' : 'Auto (3.5+ only)'], ['show', 'Always show'], ['hide', 'Hide']]
        .map(([k, label]) => `<button type="button" class="${d.gpa === k ? 'active' : ''}" data-set="gpa" data-val="${k}">${label}</button>`).join('')}</div>
    </div>
    <div class="design-group" style="--dot:${COLORS.lime}">
      <h3>Smart options</h3>
      <div class="toggle-row"><div><strong>Fit to one page</strong><small>Tightens spacing, then text (down to 9pt) until it fits.${mode.multiPage ? ' Off for Research, since CVs can run long.' : ''}</small></div>
        <label class="switch"><input type="checkbox" data-toggle="fit" ${d.fit ? 'checked' : ''}><span></span></label></div>
      <div class="toggle-row"><div><strong>Strengthen wording</strong><small>Swaps weak openers for action verbs and tidies punctuation. Your original text stays untouched.</small></div>
        <label class="switch"><input type="checkbox" data-toggle="strengthen" ${d.strengthen ? 'checked' : ''}><span></span></label></div>
    </div>
    <div class="design-group" style="--dot:${COLORS.blue}">
      <h3>Section order for ${esc(mode.label)}</h3>
      <div class="order-list">${mode.order.map((k, i) => `<div><b>${i + 1}</b>${esc(mode.titles[k] || DEFAULT_TITLES[k])}</div>`).join('')}</div>
      <p class="field-hint">Set by your target in step 1. Empty sections are skipped.</p>
    </div>`;
}

// ------------------------------------------------------------------ import

function renderFiles() {
  $('#fileList').innerHTML = pendingFiles.map((f, i) =>
    `<span class="file-chip">${icon('file', 15)}<span>${esc(f.name)}</span><button type="button" data-rm="${i}" aria-label="Remove ${esc(f.name)}">${icon('x', 14, 2.6)}</button></span>`).join('');
}

function addFiles(list) {
  for (const f of list) if (!pendingFiles.some(p => p.name === f.name && p.size === f.size)) pendingFiles.push(f);
  renderFiles();
}

function mergeParsed(r) {
  const added = {};
  const p = state.profile, rp = r.profile || {};
  for (const k of ['name', 'email', 'phone', 'location']) if (!p[k] && rp[k]) p[k] = rp[k];
  if (rp.links) {
    const have = p.links ? p.links.split(/\s*\|\s*/) : [];
    rp.links.split(/\s*\|\s*/).forEach(l => { if (l && !have.includes(l)) have.push(l); });
    p.links = have.join(' | ');
  }
  if (rp.summary && !p.summary.trim()) p.summary = rp.summary;

  for (const sec of ENTRY_KEYS) {
    for (const e of r[sec] || []) {
      const item = { ...blankEntry(sec) };
      for (const k of Object.keys(item)) if (k !== 'bullets' && k !== 'hidden' && e[k]) item[k] = String(e[k]);
      item.bullets = (e.bullets || []).join('\n');
      const key = (entryTitle(sec, item) + '|' + item.dates).toLowerCase();
      if (key === '|' && !item.bullets) continue;
      if (state[sec].some(x => (entryTitle(sec, x) + '|' + x.dates).toLowerCase() === key && key !== '|')) continue;
      state[sec].push(item);
      added[sec] = (added[sec] || 0) + 1;
    }
  }
  for (const key of LIST_KEYS) {
    const have = lines(state[key]), seen = new Set(have.map(x => x.toLowerCase()));
    let n = 0;
    for (const item of r[key] || []) {
      if (item && !seen.has(item.toLowerCase())) { have.push(item); seen.add(item.toLowerCase()); n++; }
    }
    if (n) { state[key] = have.join('\n'); added[key] = n; }
  }
  return added;
}

async function runOptimize() {
  const text = $('#pasteBox').value.trim();
  // A self-description typed into Summary is raw material too: sort its facts into the sections once.
  const notes = state.profile.summary.trim();
  const useNotes = aiInfo.configured && words(notes) >= 20 && state.notesSorted !== notes;
  const hasNew = pendingFiles.length || text || useNotes;
  if (!hasNew && !hasAnyInfo()) return toast('Add a file or type a few sentences about yourself first', true);

  const btn = $('#optimizeBtn'), label = $('.btn-label', btn), ic = $('.btn-icon', btn), errBox = $('#importErrors');
  const busy = msg => { label.textContent = msg; };
  btn.disabled = true;
  ic.innerHTML = '<i class="spin"></i>';
  errBox.innerHTML = '';
  let parts = [], sortedByAI = false;
  try {
    if (hasNew) {
      busy(aiInfo.configured ? `Sorting with ${aiInfo.label}` : 'Reading your info');
      const fd = new FormData();
      pendingFiles.forEach(f => fd.append('files', f));
      fd.append('text', [text, useNotes ? notes : ''].filter(Boolean).join('\n\n'));
      fd.append('ai', aiInfo.configured ? '1' : '0');
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ error: 'The server sent something unexpected.' }));
      if (!res.ok) throw new Error(data.error || 'Could not read that.');
      const totals = {};
      for (const r of data.results) for (const [k, n] of Object.entries(mergeParsed(r))) totals[k] = (totals[k] || 0) + n;
      errBox.innerHTML = (data.errors || []).map(e => `<div>${icon('alert', 16, 2.4)}<span>${esc(e)}</span></div>`).join('');
      parts = Object.entries(totals).map(([k, n]) => `${n} ${(ENTRY[k] || LISTS[k]).label.toLowerCase()}`);
      sortedByAI = !!data.ai;
      if (useNotes) state.notesSorted = notes;
      pendingFiles = [];
      renderFiles();
      $('#pasteBox').value = '';
      renderInfo();
      save();
      renderPreview();
    }
    switchTab('info');
    let polished = false;
    if (aiInfo.configured && hasAnyInfo()) {
      busy(`Rewriting with ${aiInfo.label}`);
      polished = await aiPolish('all', { quiet: true });
      if (polished) state.notesSorted = state.profile.summary.trim();  // don't re-sort the AI's own summary next time
    }
    flashPage();
    const r = btn.getBoundingClientRect();
    if (parts.length || polished) confetti(r.left + r.width / 2, r.top, 160);
    const added = parts.length ? `Added ${humanList(parts.slice(0, 3))}${parts.length > 3 ? ' and more' : ''}. ` : '';
    const extra = polished?.added ? ` It added ${polished.added} typical dut${polished.added > 1 ? 'ies' : 'y'} for your roles, so check they're true.` : '';
    toast(polished ? `${added}Rewritten for ${MODES[state.target].label}.${extra} Fill in anything marked Needs info.`
      : aiInfo.configured ? `${added}Fill in anything marked Needs info.`
      : `${added || 'Sorted. '}Connect AI to also rewrite everything.`);
    if (!sortedByAI && !polished && !parts.length && hasNew) toast('Read it, but found nothing new to add');
  } catch (err) {
    errBox.innerHTML = `<div>${icon('alert', 16, 2.4)}<span>${esc(err.message)}</span></div>`;
    toast(err.message, true);
  } finally {
    btn.disabled = false;
    ic.innerHTML = icon('sparkle', 17, 2);
    label.textContent = 'Optimize my Resume';
    save();
  }
}

function hasAnyInfo() {
  const p = state.profile;
  return !!(p.name.trim() || p.email.trim() || p.phone.trim() || p.summary.trim()
    || ENTRY_KEYS.some(k => state[k].some(e => ENTRY[k].heading(e) || ENTRY[k].sub(e) || e.bullets.trim()))
    || LIST_KEYS.some(k => lines(state[k]).length));
}

const SAMPLE = `JORDAN RIVERA
Austin, TX | jordan.rivera@email.com | (512) 555-0147 | linkedin.com/in/jordanrivera

EDUCATION
Westlake High School, Austin, TX
High School Diploma, Expected May 2026
GPA: 3.92/4.0 (unweighted)
Relevant Coursework: AP Computer Science A, AP Calculus BC, AP Statistics, Physics

EXPERIENCE
Sales Associate | H-E-B | Austin, TX | Jun 2024 - Present
• Responsible for helping 80+ customers per shift find products and check out
• Trained 4 new team members on register and returns procedures
• Worked on reorganizing the seasonal aisle, cutting restock time by 20%

Coding Instructor (Part-time) | theCoderSchool | Summer 2023
• Taught Python and Scratch to groups of 6 to 8 students ages 8 to 12
• Helped with building a 10-week curriculum now used by 3 instructors

ACTIVITIES
President, Robotics Club | Grades 10-12
• Led a 15-member team to the 2025 FIRST Tech Challenge state semifinals
• Raised $3,200 from local sponsors for parts and travel
Varsity Cross Country, Team Member | Grades 9-12
• Ran 25+ miles weekly; earned Academic All-District honors twice

VOLUNTEER
Volunteer Tutor | Austin Public Library | 2022 - Present
• Tutor middle school students in math every Saturday (120+ hours)

PROJECTS
Budget Buddy | React, Firebase | 2024
• Built a budgeting web app used by 150+ students at my school

AWARDS
National Merit Commended Student (2025)
AP Scholar with Distinction (2024)
1st Place, Regional Science Fair, Computer Science (2023)

SKILLS
Programming: Python, Java, JavaScript, React
Tools: Excel, Google Sheets, Canva, Git
Languages: English (native), Spanish (fluent)

TEST SCORES
SAT 1510 (Math 780, EBRW 730)`;

// ------------------------------------------------------------------ exports

function fileBase() {
  const name = (state.profile.name || 'My').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_');
  return `${name}_Resume_${MODES[state.target].label.replace(/\W+/g, '')}`;
}

function fillPrintRoot() {
  renderPreview();
  const rz = $('#page .rz');
  $('#printRoot').innerHTML = rz ? rz.outerHTML : '';
}

function printPdf() {
  fillPrintRoot();
  const old = document.title;
  document.title = fileBase();
  toast('Pick “Save as PDF” as the printer');
  setTimeout(() => { window.print(); document.title = old; }, 60);
}

async function downloadDocx() {
  renderPreview();
  const btn = $('#docxBtn');
  btn.disabled = true;
  try {
    const res = await fetch('/api/docx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: lastModel, filename: fileBase(), design: { ...state.design, size: lastFit.size, gap: lastFit.gap } }),
    });
    if (!res.ok) throw new Error('Word export failed. Is the app still running?');
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: fileBase() + '.docx' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Word file downloaded');
  } catch (err) {
    toast(err.message, true);
  } finally {
    btn.disabled = false;
  }
}

// ------------------------------------------------------------------ AI

let aiInfo = { configured: false, label: 'AI', providers: {} };
let aiBusy = false;
let aiChoice = 'gemini';

async function loadAI() {
  try {
    const res = await fetch('/api/ai/status');
    if (res.ok) aiInfo = await res.json();
  } catch { /* server unreachable: AI just stays off */ }
  renderAIBits();
}

function renderAIBits() {
  $('#aiBtn').classList.toggle('on', aiInfo.configured);
  $('#aiBtn').hidden = !!aiInfo.locked;  // hosted: the owner's key is used, visitors have nothing to set up
  $('#aiBtnLabel').textContent = aiInfo.configured ? `${aiInfo.label} on` : 'Connect AI';
  $('#optimizeNote').textContent = aiInfo.configured
    ? `Sorts everything into the right sections and rewrites it for your target with ${aiInfo.label}.`
    : aiInfo.locked ? 'Sorts your info into the right sections.' : 'Sorts your info into the right sections. Connect AI to also rewrite it.';
  const card = $('#infoPanel .ai-card'), html = aiCardHTML();
  if (card && html) card.outerHTML = html;
  else if (card) card.remove();
  else if (html) $('#infoPanel').insertAdjacentHTML('afterbegin', html);
}

function renderProviderBits() {
  const providers = aiInfo.providers || {};
  $('#providerGrid').innerHTML = Object.entries(providers).map(([k, p]) => `
    <button type="button" class="provider ${aiChoice === k ? 'active' : ''}" data-provider="${k}">
      <strong>${esc(p.label)}${k === 'gemini' ? '<span class="tag">Recommended</span>' : ''}</strong>
      <small>${k === 'gemini' ? 'Free, best writing quality' : 'Free, extremely fast'}</small>
    </button>`).join('');
  const p = providers[aiChoice];
  if (!p) return;
  const host = p.key_url.replace(/^https?:\/\//, '');
  $('#aiSteps').innerHTML = aiChoice === 'gemini'
    ? `<li>Open <a href="${p.key_url}" target="_blank" rel="noopener">${host}</a> and sign in with Google.</li><li>Click <b>Create API key</b> and copy it.</li><li>Paste it below and hit Test and save.</li>`
    : `<li>Open <a href="${p.key_url}" target="_blank" rel="noopener">${host}</a> and make a free account.</li><li>Click <b>Create API Key</b> and copy it.</li><li>Paste it below and hit Test and save.</li>`;
  $('#aiNote').textContent = p.note;
  $('#aiModel').placeholder = p.models[0];
  const same = aiInfo.configured && aiInfo.provider === aiChoice;
  $('#aiKey').placeholder = same ? `Saved key ${aiInfo.key_hint}. Paste a new one to replace it.` : 'Paste your key';
  $('#aiRemove').hidden = !aiInfo.configured;
}

function openAI() {
  if (aiInfo.locked) return;
  aiChoice = aiInfo.provider || 'gemini';
  $('#aiKey').value = '';
  $('#aiModel').value = aiInfo.configured && aiInfo.model !== (aiInfo.providers[aiChoice] || {}).models?.[0] ? aiInfo.model : '';
  $('#aiError').innerHTML = '';
  renderProviderBits();
  $('#aiDialog').showModal();
  setTimeout(() => $('#aiKey').focus(), 50);
}

async function postAISettings(body) {
  const res = await fetch('/api/ai/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({ error: 'The server sent something unexpected.' }));
  if (!res.ok) throw new Error(data.error || 'Could not save that.');
  return data;
}

async function saveAI() {
  const btn = $('#aiSave'), label = $('.btn-label', btn);
  btn.disabled = true;
  label.textContent = 'Testing';
  btn.insertAdjacentHTML('afterbegin', '<i class="spin"></i>');
  $('#aiError').innerHTML = '';
  try {
    aiInfo = await postAISettings({ provider: aiChoice, key: $('#aiKey').value.trim(), model: $('#aiModel').value.trim() });
    renderAIBits();
    $('#aiDialog').close();
    toast(`${aiInfo.label} connected. Try Polish in Your info.`);
    const r = $('#aiBtn').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.bottom, 80);
  } catch (err) {
    $('#aiError').innerHTML = `<div>${icon('alert', 16, 2.4)}<span>${esc(err.message)}</span></div>`;
  } finally {
    btn.disabled = false;
    $('.spin', btn)?.remove();
    label.textContent = 'Test and save';
  }
}

function aiPayload(scope) {
  const sections = {};
  for (const sec of ENTRY_KEYS.filter(k => k !== 'education')) {
    sections[sec] = state[sec].map((e, i) => ({ id: `${sec}:${i}`, title: e.title, org: e.org, dates: e.dates, location: e.location, bullets: lines(e.bullets) }))
      .filter(x => x.title || x.org || x.bullets.length);
  }
  return {
    scope, target_key: state.target, role: state.role, summary: state.profile.summary,
    education: state.education.map((e, i) => ({ id: `education:${i}`, school: e.school, degree: e.degree, dates: e.dates, gpa: e.gpa, details: lines(e.bullets) })),
    sections, ...Object.fromEntries(LIST_KEYS.map(k => [k, lines(k === 'coursework' ? state[k].replace(/[,;]/g, '\n') : state[k])])),
  };
}

// Returns the AI's result on success (falsy on failure). quiet: the caller shows its own toast.
async function aiPolish(scope, { quiet = false } = {}) {
  if (!aiInfo.configured) return openAI();
  if (aiBusy) return null;
  aiBusy = true;
  renderAIBits();
  const draftBtn = $('[data-draft]');
  if (draftBtn) { draftBtn.disabled = true; draftBtn.innerHTML = '<i class="spin" style="border-color:rgba(46,91,255,.25);border-top-color:var(--blue);width:12px;height:12px"></i>Writing'; }
  try {
    const res = await fetch('/api/ai/polish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aiPayload(scope)) });
    const data = await res.json().catch(() => ({ error: 'The server sent something unexpected.' }));
    if (!res.ok) throw new Error(data.error || 'AI polish failed.');

    state.aiUndo = JSON.stringify({ summary: state.profile.summary, aiTips: state.aiTips || [],
      ...Object.fromEntries([...ENTRY_KEYS, ...LIST_KEYS].map(k => [k, state[k]])) });
    if (data.summary) state.profile.summary = data.summary;
    for (const r of data.education || []) {
      const e = state.education[+String(r.id).split(':')[1]];
      if (e && r.bullets) e.bullets = r.bullets.join('\n');
    }
    for (const k of LIST_KEYS) if (data[k]?.length) state[k] = (k === 'coursework' ? [data[k].join(', ')] : data[k]).join('\n');
    if (scope !== 'summary') state.aiTips = data.tips || [];
    for (const [sec, rows] of Object.entries(data.sections || {})) {
      const arr = state[sec], used = new Set(), next = [];
      for (const r of rows) {
        const i = +String(r.id).split(':')[1];
        if (!arr[i] || used.has(i)) continue;
        used.add(i);
        if (r.bullets.length) arr[i].bullets = r.bullets.join('\n');
        next.push(arr[i]);
      }
      arr.forEach((e, i) => { if (!used.has(i)) next.push(e); });
      state[sec] = next;
    }
    aiBusy = false;
    renderInfo();
    save();
    renderPreview();
    if (quiet) return data;
    flashPage();
    const r = ($('#infoPanel .ai-card') || $('#page')).getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + 20, 110);
    toast(scope === 'summary' ? 'AI wrote your summary from your whole resume. Tweak it so it sounds like you.'
      : `Rewritten for ${MODES[state.target].label}. Undo brings back your version.`);
    return data;
  } catch (err) {
    aiBusy = false;
    renderInfo();
    toast(err.message, true);
    return null;
  }
}

function aiUndo() {
  if (!state.aiUndo) return;
  const snap = JSON.parse(state.aiUndo);
  state.profile.summary = snap.summary;
  state.aiTips = snap.aiTips;
  [...ENTRY_KEYS, ...LIST_KEYS].forEach(k => { if (snap[k] !== undefined) state[k] = snap[k]; });
  state.aiUndo = null;
  renderInfo();
  save();
  renderPreview();
  toast('Restored your previous version');
}

$('#aiBtn').addEventListener('click', openAI);
$('#aiSave').addEventListener('click', saveAI);
$('#aiKey').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveAI(); } });
$('#providerGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-provider]');
  if (!b) return;
  aiChoice = b.dataset.provider;
  $('#aiModel').value = '';
  renderProviderBits();
});
$('#aiRemove').addEventListener('click', async () => {
  if (!confirm('Disconnect AI and delete the saved key from this computer?')) return;
  try {
    aiInfo = await postAISettings({ remove: true });
    renderAIBits();
    $('#aiDialog').close();
    toast('AI disconnected');
  } catch (err) { toast(err.message, true); }
});

// ------------------------------------------------------------------ misc UI

let toastTimer;
function toast(msg, warn = false) {
  const t = $('#toast');
  t.innerHTML = `${icon(warn ? 'alert' : 'check', 17, 3)}<span>${esc(msg)}</span>`;
  t.classList.toggle('warn', warn);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3800);
}

function switchTab(name) {
  const tabs = $$('.tab');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $('#tabs').style.setProperty('--i', tabs.findIndex(t => t.dataset.tab === name));
  $$('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
}

function setPath(path, value) {
  const parts = path.split('.');
  let obj = state;
  for (const k of parts.slice(0, -1)) obj = obj[k];
  obj[parts[parts.length - 1]] = value;
}

function moveEntry(sec, from, to) {
  const arr = state[sec];
  if (to < 0 || to >= arr.length || from === to) return false;
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
  return true;
}

const ROLE_EXAMPLES = ['Marketing intern at Spotify', 'Pre-med at UT Austin', 'Barista at Blue Bottle', 'Software engineer, new grad',
  'Gates Scholarship', 'Summer lab assistant, neuroscience', 'Lifeguard at the city pool', 'Film school, NYU Tisch'];
function typePlaceholder() {
  const el = $('#role');
  if (calm) return;
  let i = 0, j = 0, deleting = false;
  const tick = () => {
    if (el.value || document.activeElement === el) return setTimeout(tick, 1200);
    const word = ROLE_EXAMPLES[i];
    j += deleting ? -1 : 1;
    el.placeholder = 'e.g. ' + word.slice(0, j) + '|';
    if (!deleting && j === word.length) { deleting = true; return setTimeout(tick, 1700); }
    if (deleting && j === 0) { deleting = false; i = (i + 1) % ROLE_EXAMPLES.length; }
    setTimeout(tick, deleting ? 28 : 65);
  };
  setTimeout(tick, 800);
}

// ------------------------------------------------------------------ events

$('#targetGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-target]');
  if (!b || b.dataset.target === state.target) return;
  state.target = b.dataset.target;
  renderTargets();
  renderDesign();
  save();
  renderPreview();
  flashPage();
});

$('#role').addEventListener('input', e => { state.role = e.target.value; save(); });

$$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

const dz = $('#dropzone');
$('#fileInput').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));
window.addEventListener('dragover', e => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); });
window.addEventListener('drop', e => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); });
$('#fileList').addEventListener('click', e => {
  const b = e.target.closest('[data-rm]');
  if (b) { pendingFiles.splice(+b.dataset.rm, 1); renderFiles(); }
});
$('#optimizeBtn').addEventListener('click', runOptimize);
$('#pasteBox').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runOptimize(); } });
$('#sampleBtn').addEventListener('click', () => {
  $('#pasteBox').value = SAMPLE;
  $('#pasteBox').focus();
  toast('Sample pasted. Hit “Optimize my Resume”.');
});

const info = $('#infoPanel');
info.addEventListener('input', e => {
  const path = e.target.dataset.path;
  if (!path) return;
  setPath(path, e.target.value);
  const need = e.target.closest('.fld')?.querySelector('.need');
  if (need) need.hidden = !!e.target.value.trim();
  const card = e.target.closest('.entry');
  if (card) {
    const sec = card.dataset.sec;
    const t = entryTitle(sec, state[sec][+card.dataset.i]);
    const el = $('.entry-title', card);
    el.textContent = t || `New ${ENTRY[sec].noun}`;
    el.classList.toggle('empty', !t);
  }
  save();
  schedulePreview();
});
info.addEventListener('click', e => {
  if (e.target.closest('[data-ai-connect]')) return openAI();
  if (e.target.closest('[data-ai-polish]')) return aiPolish('all');
  if (e.target.closest('[data-ai-undo]')) return aiUndo();
  if (e.target.closest('[data-draft]')) {
    e.preventDefault();
    const p = state.profile;
    if (p.summary.trim() && !confirm('Replace your current summary with a fresh draft?')) return;
    if (aiInfo.configured) return aiPolish('summary');
    p.summary = draftSummary();
    $('[data-path="profile.summary"]').value = p.summary;
    save();
    renderPreview();
    toast(`Drafted a ${MODES[state.target].label} summary. Edit it so it sounds like you.`);
    return;
  }
  const add = e.target.closest('[data-add]');
  if (add) {
    const sec = add.dataset.add;
    state[sec].push(blankEntry(sec));
    renderInfo();
    const cards = $$(`.entry[data-sec="${sec}"]`);
    $('input', cards[cards.length - 1])?.focus();
    save();
    renderPreview();
    return;
  }
  const act = e.target.closest('[data-act]');
  if (!act) return;
  const card = act.closest('.entry'), sec = card.dataset.sec, i = +card.dataset.i, arr = state[sec];
  const action = act.dataset.act;
  if (action === 'del') {
    if ((entryTitle(sec, arr[i]) || arr[i].bullets.trim()) && !confirm(`Delete “${entryTitle(sec, arr[i]) || 'this entry'}”?`)) return;
    arr.splice(i, 1);
  } else if (action === 'toggle') arr[i].hidden = !arr[i].hidden;
  else if (action === 'up') moveEntry(sec, i, i - 1);
  else if (action === 'down') moveEntry(sec, i, i + 1);
  renderInfo();
  save();
  renderPreview();
});

// drag to reorder: only the grip starts a drag, so text inside fields stays selectable
let drag = null;
info.addEventListener('pointerdown', e => {
  const grip = e.target.closest('.grip');
  if (grip) grip.closest('.entry').draggable = true;
});
info.addEventListener('dragstart', e => {
  const card = e.target.closest('.entry');
  if (!card || !card.draggable) return;
  drag = { sec: card.dataset.sec, i: +card.dataset.i };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');
  requestAnimationFrame(() => card.classList.add('dragging'));
});
info.addEventListener('dragover', e => {
  const card = e.target.closest('.entry');
  if (!drag || !card || card.dataset.sec !== drag.sec) return;
  e.preventDefault();
  const r = card.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
  $$('.drop-before, .drop-after', info).forEach(x => x.classList.remove('drop-before', 'drop-after'));
  card.classList.add(after ? 'drop-after' : 'drop-before');
});
info.addEventListener('drop', e => {
  const card = e.target.closest('.entry');
  if (!drag || !card || card.dataset.sec !== drag.sec) return;
  e.preventDefault();
  const r = card.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
  let to = +card.dataset.i + (after ? 1 : 0);
  if (to > drag.i) to--;
  if (moveEntry(drag.sec, drag.i, to)) { renderInfo(); save(); renderPreview(); }
});
info.addEventListener('dragend', () => {
  drag = null;
  $$('.entry', info).forEach(x => { x.draggable = false; x.classList.remove('dragging', 'drop-before', 'drop-after'); });
});

const design = $('#designPanel');
design.addEventListener('click', e => {
  const b = e.target.closest('[data-set]');
  if (!b) return;
  state.design[b.dataset.set] = b.dataset.val;
  if (b.dataset.set === 'accent') state.design.accentChosen = true;
  renderDesign();
  save();
  renderPreview();
});
design.addEventListener('input', e => {
  if (e.target.id === 'sizeRange') {
    state.design.size = +e.target.value;
    $('#sizeOut').textContent = state.design.size + 'pt';
  } else if (e.target.dataset.toggle) {
    state.design[e.target.dataset.toggle] = e.target.checked;
  } else return;
  save();
  schedulePreview();
});

$('#insights').addEventListener('click', e => {
  if (!e.target.closest('#insToggle')) return;
  insightsOpen = !insightsOpen;
  renderInsights();
});

$('#zoom').addEventListener('click', e => {
  const b = e.target.closest('[data-zoom]');
  if (!b) return;
  zoomMode = b.dataset.zoom;
  $$('#zoom button').forEach(x => x.classList.toggle('active', x === b));
  scalePreview();
});

$('#pdfBtn').addEventListener('click', printPdf);
$('#docxBtn').addEventListener('click', downloadDocx);
window.addEventListener('beforeprint', fillPrintRoot);
$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Clear everything and start a new resume? This can’t be undone.')) return;
  state = blank();
  renderAll();
  save();
  switchTab('import');
  toast('Fresh start');
});

// ------------------------------------------------------------------ boot

$$('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, +(el.dataset.size || 16), 2)));
const onScroll = () => $('#topbar').classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

new ResizeObserver(() => requestAnimationFrame(scalePreview)).observe($('#previewWrap'));
document.fonts?.ready.then(() => renderPreview());

let booted = false;
function renderAll() {
  $('#role').value = state.role;
  renderTargets();
  renderInfo();
  renderDesign();
  renderPreview();
}
renderAll();
booted = true;
typePlaceholder();
loadAI();
