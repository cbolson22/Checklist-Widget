// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: calendar-check;
// Daily Checklist Widget — Scriptable
// ─────────────────────────────────────
// HOW TO USE:
//   1. Install Scriptable (free) from the App Store
//   2. Tap "+" and paste this entire script in
//   3. Name it "Daily Checklist"
//   4. Add a Medium widget to your home screen, choose this script

const TASKS = ["AHW", "Workout / Cardio", "Cook", "Read/Write", "Learn Topics"];
const TASK_ICONS = ["🏠", "🏋️", "🍳", "📖", "🧠"];

// ── Colors ───────────────────────────────────────────────────────────────────
const COLOR_BG = new Color("#111318");
const COLOR_TITLE = new Color("#FFFFFF");
const COLOR_MUTED = new Color("#8E8E93");
const COLOR_TASK = new Color("#E5E5EA");
const COLOR_DONE_T = new Color("#48484A");
const COLOR_CHECK = new Color("#34C759");
const COLOR_PILL_BG = new Color("#2C2C2E");
const COLOR_SEP = new Color("#2C2C2E");
const COLOR_FUTURE = new Color("#0D0D0F");
const COLOR_NO_DATA = new Color("#1C1C1E");

const completionColors = {
  0: "#E8887A", // muted red (no tasks done)
  1: "#E0A856", // warm ochre
  2: "#E0A856", // warm ochre
  3: "#C9B84C", // yellow-green
  4: "#7FAD3A", // medium green
  5: "#3B7A2A", // dark green
};

function completionColor(count) {
  return new Color(completionColors[count] ?? completionColors[5]);
}

// ── Data ─────────────────────────────────────────────────────────────────────
const fm = FileManager.iCloud();
const dataPath = fm.joinPath(fm.documentsDirectory(), "checklist_data.json");
const TODAY = new Date().toDateString();

async function loadData() {
  let history = {};
  if (fm.fileExists(dataPath)) {
    if (!fm.isFileDownloaded(dataPath))
      await fm.downloadFileFromiCloud(dataPath);
    try {
      const raw = JSON.parse(fm.readString(dataPath));
      history = raw.history || {};
      if (raw.date === TODAY) {
        return { checked: raw.checked, history };
      }
      // New day — archive yesterday's checked array
      if (raw.date && Array.isArray(raw.checked)) {
        history[raw.date] = raw.checked;
      }
    } catch (e) {}
  }
  const checked = new Array(TASKS.length).fill(false);
  saveData(checked, history);
  return { checked, history };
}

function saveData(checked, history) {
  fm.writeString(dataPath, JSON.stringify({ date: TODAY, checked, history }));
}

// ── Interactive (tapped from home screen) ─────────────────────────────────────
if (config.runsInApp || config.runsFromHomeScreen) {
  let { checked, history } = await loadData();
  while (true) {
    const a = new Alert();
    a.title = "Daily Checklist";
    a.message = "Tap a task to toggle it";
    for (let i = 0; i < TASKS.length; i++) {
      a.addAction(
        (checked[i] ? "✅ " : "⬜ ") + TASK_ICONS[i] + "  " + TASKS[i],
      );
    }
    a.addCancelAction("Done");
    const idx = await a.presentSheet();
    if (idx < 0 || idx >= TASKS.length) break;
    checked[idx] = !checked[idx];
    saveData(checked, history);
  }
  Script.complete();
}

// ── Widget rendering ──────────────────────────────────────────────────────────
const { checked, history } = await loadData();
const doneCount = checked.filter(Boolean).length;
const total = TASKS.length;
const allDone = doneCount === total;

const widget = new ListWidget();
widget.backgroundColor = COLOR_BG;
widget.setPadding(13, 14, 13, 14);

// Outer horizontal split
const main = widget.addStack();
main.layoutHorizontally();
main.spacing = 0;

// ── LEFT: Checklist ───────────────────────────────────────────────────────────
const left = main.addStack();
left.layoutVertically();
left.size = new Size(150, 0);

// Header
const hdr = left.addStack();
hdr.layoutHorizontally();
hdr.centerAlignContent();

const ttl = hdr.addText("Today");
ttl.font = Font.boldSystemFont(14);
ttl.textColor = COLOR_TITLE;
hdr.addSpacer();

const pill = hdr.addStack();
pill.backgroundColor = allDone ? new Color("#1A3A27") : COLOR_PILL_BG;
pill.cornerRadius = 8;
pill.setPadding(2, 6, 2, 6);
const pillTxt = pill.addText(`${doneCount}/${total}`);
pillTxt.font = Font.boldSystemFont(10);
pillTxt.textColor = allDone ? COLOR_CHECK : COLOR_MUTED;

left.addSpacer(8);

// Task rows
for (let i = 0; i < TASKS.length; i++) {
  const row = left.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = 5;

  const ic = row.addText(TASK_ICONS[i]);
  ic.font = Font.systemFont(11);

  const lbl = row.addText(TASKS[i]);
  lbl.font = checked[i] ? Font.systemFont(10) : Font.mediumSystemFont(10);
  lbl.textColor = checked[i] ? COLOR_DONE_T : COLOR_TASK;
  lbl.lineLimit = 1;
  row.addSpacer();

  const chk = row.addText(checked[i] ? "✓" : "");
  chk.font = Font.boldSystemFont(10);
  chk.textColor = COLOR_CHECK;

  if (i < TASKS.length - 1) left.addSpacer(4);
}

left.addSpacer();
if (allDone) {
  const banner = left.addText("All done! 🎉");
  banner.font = Font.mediumSystemFont(9);
  banner.textColor = COLOR_CHECK;
}

// ── SEPARATOR ─────────────────────────────────────────────────────────────────
const sepWrap = main.addStack();
sepWrap.size = new Size(1, 0);
main.addSpacer(8);

const sep = sepWrap.addStack();
sep.size = new Size(1, 0);
sep.backgroundColor = COLOR_SEP;
sepWrap.addSpacer();

main.addSpacer(8);

// ── RIGHT: History graph ───────────────────────────────────────────────────────
const right = main.addStack();
right.layoutVertically();
right.size = new Size(115, 0);

const gLabel = right.addText("History");
gLabel.font = Font.boldSystemFont(10);
gLabel.textColor = COLOR_MUTED;
right.addSpacer(6);

// Date grid setup — 7 weeks × 7 days (GitHub-style contribution graph)
// Column 0 = oldest week, column 6 = current week
// Row 0 = Sunday, row 6 = Saturday
const todayDate = new Date();
todayDate.setHours(0, 0, 0, 0);
const dow = todayDate.getDay();

const startDate = new Date(todayDate);
startDate.setDate(todayDate.getDate() - dow - 42); // Sunday of 6 weeks ago

const DOT = 13;
const GAP = 3;

// Build grid: outer loop = row (day of week), inner loop = col (week)
const gridStack = right.addStack();
gridStack.layoutVertically();
gridStack.spacing = GAP;

for (let row = 0; row < 7; row++) {
  const rowStack = gridStack.addStack();
  rowStack.layoutHorizontally();
  rowStack.spacing = GAP;

  for (let col = 0; col < 7; col++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + col * 7 + row);

    const dot = rowStack.addStack();
    dot.size = new Size(DOT, DOT);
    dot.cornerRadius = DOT / 2;

    if (d > todayDate) {
      dot.backgroundColor = COLOR_FUTURE;
    } else {
      const key = d.toDateString();
      if (key === TODAY) {
        dot.backgroundColor = completionColor(doneCount);
      } else if (history.hasOwnProperty(key)) {
        const entry = history[key];
        const cnt = Array.isArray(entry) ? entry.filter(Boolean).length : entry;
        dot.backgroundColor = completionColor(cnt);
      } else {
        dot.backgroundColor = COLOR_NO_DATA;
      }
    }
  }
}

right.addSpacer();

// Mini legend: muted red → warm ochre → yellow-green → medium green → dark green
const leg = right.addStack();
leg.layoutHorizontally();
leg.spacing = 2;
leg.centerAlignContent();

const legendEntries = [0, 1, 3, 4, 5];
for (const c of legendEntries) {
  const ld = leg.addStack();
  ld.size = new Size(7, 7);
  ld.cornerRadius = 3.5;
  ld.backgroundColor = completionColor(c);
}

widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
Script.setWidget(widget);
widget.presentMedium();
Script.complete();
