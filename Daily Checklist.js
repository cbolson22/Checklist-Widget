// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: calendar-check;
// Daily Checklist Widget — Scriptable
// ─────────────────────────────────────
// HOW TO USE:
//   1. Install Scriptable (free) from the App Store
//   2. Tap "+" and paste this entire script in
//   3. Name it "Daily Checklist"
//   4. Add a Small widget to your home screen, choose this script

const TASKS = ["Workout", "Cook", "Read", "Write", "Learn Topics"];

const TASK_ICONS = ["🏋️", "🍳", "📖", "✍️", "🧠"];

// COLORS
const COLOR_BG = new Color("#111318"); // deep dark background
const COLOR_CARD = new Color("#1E2028"); // row card background
const COLOR_TITLE = new Color("#FFFFFF");
const COLOR_DATE = new Color("#8E8E93"); // muted subtitle
const COLOR_TASK = new Color("#E5E5EA"); // task text
const COLOR_DONE = new Color("#48484A"); // completed task text
const COLOR_CHECK = new Color("#34C759"); // accent green
const COLOR_PROGRESS = new Color("#2C2C2E"); // progress bar track

// ─────────────────────────────────────
// DATA — stored per-day, auto-resets
// ─────────────────────────────────────

const fm = FileManager.local();
const dataPath = fm.joinPath(fm.documentsDirectory(), "checklist_data.json");
const today = new Date().toDateString();

function loadData() {
  if (fm.fileExists(dataPath)) {
    try {
      const raw = JSON.parse(fm.readString(dataPath));
      if (raw.date === today) return raw.checked;
    } catch (e) {}
  }
  return new Array(TASKS.length).fill(false);
}

function saveData(checked) {
  fm.writeString(dataPath, JSON.stringify({ date: today, checked }));
}

// ─────────────────────────────────────
// INTERACTIVE — runs when widget is tapped
// ─────────────────────────────────────

if (config.runsInApp || config.runsFromHomeScreen) {
  let checked = loadData();

  const alert = new Alert();
  alert.title = "Daily Checklist";
  alert.message = "Tap a task to toggle it";

  for (let i = 0; i < TASKS.length; i++) {
    const icon = checked[i] ? "✅ " : "⬜ ";
    alert.addAction(icon + TASK_ICONS[i] + "  " + TASKS[i]);
  }
  alert.addCancelAction("Done");

  const idx = await alert.presentSheet();
  if (idx >= 0 && idx < TASKS.length) {
    checked[idx] = !checked[idx];
    saveData(checked);
  }

  Script.complete();
}

// ─────────────────────────────────────
// WIDGET RENDERING
// ─────────────────────────────────────

const checked = loadData();
const doneCount = checked.filter(Boolean).length;
const total = TASKS.length;
const allDone = doneCount === total;

const widget = new ListWidget();
widget.backgroundColor = COLOR_BG;
widget.setPadding(14, 14, 14, 14);

// ── Header ──
const headerStack = widget.addStack();
headerStack.layoutHorizontally();
headerStack.centerAlignContent();

const titleText = headerStack.addText("Today");
titleText.font = Font.boldSystemFont(15);
titleText.textColor = COLOR_TITLE;

headerStack.addSpacer();

// Progress pill
const pillStack = headerStack.addStack();
pillStack.backgroundColor = allDone ? new Color("#1A3A27") : COLOR_PROGRESS;
pillStack.cornerRadius = 8;
pillStack.setPadding(3, 7, 3, 7);

const pillText = pillStack.addText(`${doneCount}/${total}`);
pillText.font = Font.boldSystemFont(11);
pillText.textColor = allDone ? COLOR_CHECK : new Color("#8E8E93");

widget.addSpacer(10);

// ── Task rows ──
for (let i = 0; i < TASKS.length; i++) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = 7;

  // Emoji icon
  const iconText = row.addText(TASK_ICONS[i]);
  iconText.font = Font.systemFont(12);

  // Task label
  const label = row.addText(TASKS[i]);
  label.font = checked[i] ? Font.systemFont(11) : Font.mediumSystemFont(11);
  label.textColor = checked[i] ? COLOR_DONE : COLOR_TASK;

  row.addSpacer();

  // Check indicator
  const checkText = row.addText(checked[i] ? "✓" : "");
  checkText.font = Font.boldSystemFont(11);
  checkText.textColor = COLOR_CHECK;

  if (i < TASKS.length - 1) widget.addSpacer(5);
}

// ── All done banner ──
if (allDone) {
  widget.addSpacer(8);
  const banner = widget.addText("All done! 🎉");
  banner.font = Font.mediumSystemFont(10);
  banner.textColor = COLOR_CHECK;
  banner.centerAlignText();
}

widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

Script.setWidget(widget);
widget.presentSmall();
Script.complete();
