# Scriptable iOS Widgets

Home screen widgets for the [Scriptable](https://scriptable.app) iOS app, synced via iCloud.

## Widgets

### Daily Checklist

A medium (4×2) home screen widget with a daily to-do checklist on the left and a 35-day GitHub-style completion history graph on the right.

**Features:**

- 5 configurable daily tasks with emoji icons
- Auto-resets each day at midnight
- Tracks completion history for 35 days
- Color-coded history graph (red → dark orange → orange → yellow → light green → dark green) based on how many tasks were completed
- Tap the widget to open a sheet and toggle tasks without leaving the home screen

**Setup:**

1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) (free) from the App Store
2. Open Scriptable, tap **+**, and paste in `Daily Checklist.js`
3. Name it `Daily Checklist`
4. Add a **Medium** Scriptable widget to your home screen and select this script

**Customization:**

Edit the arrays at the top of `Daily Checklist.js`:

```js
const TASKS = ["Workout", "Cardio", "Cook", "Read/Write", "Learn Topics"];
const TASK_ICONS = ["🏋️", "🏃", "🍳", "📖", "🧠"];
```

Icons and tasks must stay in the same order. Any number of tasks can be used (layout is designed for 5).

**History graph colors:**

| Dots         | Meaning       |
| ------------ | ------------- |
| Dark gray    | No data       |
| Red          | 0/5 completed |
| Dark orange  | 1/5 completed |
| Orange       | 2/5 completed |
| Yellow       | 3/5 completed |
| Light green  | 4/5 completed |
| Dark green   | 5/5 completed |

## How it works

State is stored in `checklist_data.json` alongside the script, synced via iCloud. On each new day, the previous day's completion count is archived into a history map before the checklist resets.

## Requirements

- iOS 14+
- [Scriptable](https://scriptable.app) app (free)
