# Design Document: Todo Life Dashboard

## Overview

The Todo Life Dashboard is a single-page personal productivity application built entirely with plain HTML, CSS, and Vanilla JavaScript. It runs in the browser with zero dependencies, no build step, and no backend — all data is persisted via the browser's `localStorage` API.

The application is structured as a single `index.html` file that loads one CSS file (`css/style.css`) and one JavaScript file (`js/app.js`). It can be opened directly as a local file or set as a browser extension new-tab page.

The dashboard presents four widgets simultaneously on a single viewport:

1. **Greeting Widget** — live clock (HH:MM:SS), full date, time-of-day greeting
2. **Focus Timer** — 25-minute Pomodoro countdown with Start / Stop / Reset
3. **To-Do List** — add, edit, complete, and delete tasks with Local Storage persistence
4. **Quick Links** — add and delete URL shortcut buttons with Local Storage persistence

The design prioritises simplicity: no module bundler, no transpiler, no external fonts or icon libraries are required. All logic lives in a single, well-structured `app.js` file organised into clearly separated sections.

---

## Architecture

The application follows a **module-pattern, event-driven architecture** entirely within a single JavaScript file. There is no virtual DOM, no reactive framework, and no component lifecycle — the DOM is manipulated directly.

### High-Level Structure

```
index.html
├── <link> css/style.css
└── <script> js/app.js
    ├── StorageService       — read/write/parse localStorage
    ├── GreetingWidget       — clock interval, greeting logic
    ├── TimerWidget          — countdown interval, control state
    ├── TaskListWidget       — task CRUD, render, persistence
    ├── QuickLinksWidget     — link CRUD, render, persistence
    └── App.init()           — bootstraps all widgets on DOMContentLoaded
```

### Data Flow

```
User Interaction
      │
      ▼
DOM Event Handler (in Widget module)
      │
      ├─► Mutate in-memory state array / object
      │
      ├─► StorageService.save(key, data)   ──► localStorage
      │
      └─► render()   ──► DOM update
```

Reads on startup:

```
DOMContentLoaded
      │
      └─► StorageService.load(key)   ──► JSON.parse   ──► in-memory state
                                                              │
                                                              └─► render()
```

### Key Design Decisions

- **No framework**: The feature set is small and well-bounded. A framework would add complexity without benefit.
- **Single JS file**: Keeps the project deployable as a plain file drop. Internal organisation uses IIFE-wrapped module objects (`const GreetingWidget = (() => { ... })()`) to avoid global namespace pollution.
- **Interval-based clock and timer**: `setInterval` at 1-second resolution is sufficient for both the live clock and the Pomodoro countdown.
- **Re-render on every mutation**: Each widget has a `render()` function that rebuilds its DOM subtree from the current in-memory state. This is simple and correct for the data sizes involved (tasks and links are small arrays).
- **Audible alert via Web Audio API**: The timer completion alert uses a short beep synthesised with the Web Audio API (`AudioContext`) rather than an external audio file, keeping the project self-contained.

---

## Components and Interfaces

### 1. StorageService

Responsible for all `localStorage` interactions. Centralises JSON serialisation/deserialisation and error handling.

```js
const StorageService = (() => {
  const KEYS = {
    TASKS: 'tdl_tasks',
    LINKS: 'tdl_links',
  };

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;  // malformed JSON → fall back to null
    }
  }

  return { KEYS, save, load };
})();
```

### 2. GreetingWidget

Manages the clock interval and greeting text. Reads the system clock every second and updates three DOM elements.

**Interface:**
```js
GreetingWidget.init()   // starts setInterval, performs first render immediately
```

**Internal logic:**
- `formatTime(date)` → `"HH:MM:SS"` (zero-padded)
- `formatDate(date)` → `"Wednesday, May 7, 2025"` (using `toLocaleDateString`)
- `getGreeting(hour)` → one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, `"Good Night"` based on hour boundaries (5, 12, 18, 21)

**DOM targets:** `#clock`, `#date`, `#greeting`

### 3. TimerWidget

Manages the Pomodoro countdown. Uses a single `setInterval` reference stored in a closure variable.

**Interface:**
```js
TimerWidget.init()   // binds button event listeners, renders initial state
```

**Internal state:**
```js
let totalSeconds = 25 * 60;   // remaining seconds
let intervalId   = null;       // null when stopped
```

**Control logic:**
- `start()` — creates interval, updates button states
- `stop()` — clears interval, updates button states
- `reset()` — clears interval, resets `totalSeconds` to 1500, renders
- `tick()` — decrements `totalSeconds`, renders; if 0, calls `stop()` + `alert()`
- `updateControls()` — enables/disables Start, Stop, Reset buttons based on `intervalId`

**Alert:** `playBeep()` uses `AudioContext` to synthesise a 440 Hz tone for 0.5 s. Falls back silently if `AudioContext` is unavailable.

**DOM targets:** `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`

### 4. TaskListWidget

Manages the full task CRUD lifecycle. In-memory state is an array of Task objects.

**Interface:**
```js
TaskListWidget.init()   // loads from storage, renders, binds add-form listener
```

**Internal state:**
```js
let tasks = [];   // Task[]
```

**Operations:**
- `addTask(title)` — validates non-empty/non-whitespace, creates Task, saves, renders
- `toggleTask(id)` — flips `completed`, saves, renders
- `editTask(id, newTitle)` — validates, updates title, saves, renders
- `deleteTask(id)` — filters array, saves, renders
- `render()` — rebuilds `#task-list` innerHTML from `tasks` array
- `save()` — calls `StorageService.save(KEYS.TASKS, tasks)`
- `load()` — calls `StorageService.load(KEYS.TASKS)`, falls back to `[]`

**DOM targets:** `#task-input`, `#btn-add-task`, `#task-list`

### 5. QuickLinksWidget

Manages the link collection. In-memory state is an array of Link objects.

**Interface:**
```js
QuickLinksWidget.init()   // loads from storage, renders, binds add-form listener
```

**Internal state:**
```js
let links = [];   // Link[]
```

**Operations:**
- `addLink(label, url)` — validates both fields non-empty, creates Link, saves, renders
- `deleteLink(id)` — filters array, saves, renders
- `render()` — rebuilds `#links-list` innerHTML from `links` array
- `save()` — calls `StorageService.save(KEYS.LINKS, links)`
- `load()` — calls `StorageService.load(KEYS.LINKS)`, falls back to `[]`

**DOM targets:** `#link-label-input`, `#link-url-input`, `#btn-add-link`, `#links-list`

### 6. App (bootstrap)

```js
const App = {
  init() {
    GreetingWidget.init();
    TimerWidget.init();
    TaskListWidget.init();
    QuickLinksWidget.init();
  }
};

document.addEventListener('DOMContentLoaded', App.init);
```

---

## Data Models

### Task

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  title:     string,   // non-empty, trimmed
  completed: boolean   // false on creation
}
```

Stored in `localStorage` under key `"tdl_tasks"` as a JSON array:
```json
[
  { "id": "1715000000000", "title": "Buy groceries", "completed": false },
  { "id": "1715000001000", "title": "Read chapter 3", "completed": true }
]
```

### Link

```js
{
  id:    string,   // crypto.randomUUID() or Date.now().toString()
  label: string,   // non-empty, trimmed — displayed as button text
  url:   string    // non-empty — opened in new tab on click
}
```

Stored in `localStorage` under key `"tdl_links"` as a JSON array:
```json
[
  { "id": "1715000002000", "label": "GitHub", "url": "https://github.com" },
  { "id": "1715000003000", "label": "MDN",    "url": "https://developer.mozilla.org" }
]
```

### Storage Keys

| Key | Widget | Content |
|---|---|---|
| `tdl_tasks` | TaskListWidget | `Task[]` serialised as JSON |
| `tdl_links` | QuickLinksWidget | `Link[]` serialised as JSON |

### Layout Structure (HTML skeleton)

```html
<body>
  <div id="app">
    <section id="greeting-widget">
      <h1 id="greeting"></h1>
      <p id="clock"></p>
      <p id="date"></p>
    </section>

    <section id="timer-widget">
      <div id="timer-display">25:00</div>
      <div id="timer-controls">
        <button id="btn-start">Start</button>
        <button id="btn-stop" disabled>Stop</button>
        <button id="btn-reset">Reset</button>
      </div>
    </section>

    <section id="task-widget">
      <div id="task-input-row">
        <input id="task-input" type="text" placeholder="Add a task…" />
        <button id="btn-add-task">Add</button>
      </div>
      <ul id="task-list"></ul>
    </section>

    <section id="links-widget">
      <div id="link-input-row">
        <input id="link-label-input" type="text" placeholder="Label" />
        <input id="link-url-input"   type="url"  placeholder="https://…" />
        <button id="btn-add-link">Add</button>
      </div>
      <div id="links-list"></div>
    </section>
  </div>
</body>
```

### CSS Layout Strategy

The four widgets are arranged using **CSS Grid** on desktop and a single-column flex stack on mobile.

```css
/* Desktop: 2×2 grid */
@media (min-width: 1024px) {
  #app {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    height: 100vh;
    overflow: hidden;
  }
}

/* Mobile: stacked */
@media (max-width: 767px) {
  #app {
    display: flex;
    flex-direction: column;
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting boundary correctness

*For any* hour value (0–23), `getGreeting(hour)` SHALL return exactly one of the four defined greeting strings, and the returned string SHALL correspond to the correct time-of-day boundary for that hour.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Clock format invariant

*For any* `Date` object, `formatTime(date)` SHALL return a string matching the pattern `HH:MM:SS` where each component is zero-padded to two digits.

**Validates: Requirements 1.1**

---

### Property 3: Task addition round-trip

*For any* non-empty, non-whitespace task title, adding it to the task list and then reading back from `localStorage` SHALL produce a collection that contains a task with that exact trimmed title and `completed: false`.

**Validates: Requirements 3.2, 3.11, 3.12, 6.2, 6.4**

---

### Property 4: Whitespace task rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), attempting to add it as a task title SHALL leave the task list unchanged.

**Validates: Requirements 3.3**

---

### Property 5: Task toggle round-trip

*For any* task in the list, toggling its completion state twice SHALL return the task to its original completion state.

**Validates: Requirements 3.5**

---

### Property 6: Task edit preserves identity

*For any* task and any non-empty replacement title, editing the task SHALL update only the `title` field while leaving `id` and `completed` unchanged.

**Validates: Requirements 3.8**

---

### Property 7: Task deletion removes exactly one

*For any* task list and any task id present in that list, deleting by that id SHALL produce a list that does not contain the deleted id and retains all other tasks unchanged.

**Validates: Requirements 3.10**

---

### Property 8: Link addition round-trip

*For any* non-empty label and non-empty URL, adding a link and then reading back from `localStorage` SHALL produce a collection that contains a link with that exact label and URL.

**Validates: Requirements 4.2, 4.7, 4.8, 6.3, 6.4**

---

### Property 9: Link deletion removes exactly one

*For any* link list and any link id present in that list, deleting by that id SHALL produce a list that does not contain the deleted id and retains all other links unchanged.

**Validates: Requirements 4.6**

---

### Property 10: Storage serialisation round-trip

*For any* array of Task objects or Link objects, serialising to JSON and then deserialising SHALL produce a structurally equivalent array with all field values preserved.

**Validates: Requirements 6.2, 6.3, 6.4**

---

### Property 11: Malformed storage falls back gracefully

*For any* malformed or non-JSON string stored under a storage key, calling `StorageService.load(key)` SHALL return `null` (never throw), and the widget SHALL initialise with an empty collection.

**Validates: Requirements 6.5**

---

### Property 12: Timer display format invariant

*For any* remaining-seconds value in the range [0, 1500], the timer display SHALL render a string matching `MM:SS` where minutes and seconds are each zero-padded to two digits and the total equals the input seconds.

**Validates: Requirements 2.1, 2.3, 2.7**

---

## Error Handling

### localStorage Unavailability

`localStorage` can be unavailable (e.g., private browsing with storage blocked, or quota exceeded). `StorageService.save` wraps `setItem` in a `try/catch` and silently ignores write failures — the in-memory state remains correct for the current session. `StorageService.load` already catches `JSON.parse` errors and returns `null`.

### Malformed Stored Data

If a stored value is not valid JSON, `StorageService.load` returns `null`. Each widget treats a `null` load result as an empty collection (`[]`), so the dashboard starts clean rather than crashing.

### AudioContext Unavailability

`playBeep()` wraps `AudioContext` construction in a `try/catch`. If the Web Audio API is unavailable or blocked, the timer still stops at 00:00 — only the audible alert is silently skipped.

### Invalid URL in Quick Links

The `<input type="url">` HTML attribute provides basic browser-level URL validation. The widget additionally trims the value and rejects empty strings. No deep URL validation is performed — the user is responsible for entering a valid URL.

### Edit Cancellation

When a task enters edit mode, the original title is stored in a `data-original` attribute on the input element. If the user presses Escape or blurs without confirming, the widget restores the original title and exits edit mode without saving.

---

## Testing Strategy

> **Note:** Per project constraints, no test files are generated as part of the task implementation. This section documents the intended testing approach for reference.

### Dual Testing Approach

The testing strategy combines **example-based unit tests** for specific scenarios and **property-based tests** for universal correctness guarantees.

### Unit Tests (Example-Based)

Focus on concrete scenarios and integration points:

- `GreetingWidget`: verify each greeting string is returned for a representative hour in each boundary range (e.g., hour 6 → "Good Morning", hour 14 → "Good Afternoon")
- `TimerWidget`: verify Start enables countdown, Stop pauses it, Reset restores 25:00; verify button enable/disable states
- `TaskListWidget`: verify add, toggle, edit, delete operations produce correct DOM and storage state with concrete examples
- `QuickLinksWidget`: verify add and delete operations; verify link opens in new tab
- `StorageService`: verify `load` returns `null` for missing key, `null` for malformed JSON, and correct object for valid JSON

### Property-Based Tests

If a property-based testing library is introduced (e.g., [fast-check](https://github.com/dubzzz/fast-check) for JavaScript), each correctness property above maps to one property test:

| Property | Generator | Assertion |
|---|---|---|
| 1 — Greeting boundary | `fc.integer({ min: 0, max: 23 })` | Returns one of four strings; correct for hour |
| 2 — Clock format | `fc.date()` | Output matches `/^\d{2}:\d{2}:\d{2}$/` |
| 3 — Task add round-trip | `fc.string().filter(s => s.trim().length > 0)` | Storage contains task with trimmed title |
| 4 — Whitespace rejection | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` | Task list length unchanged |
| 5 — Toggle round-trip | `fc.boolean()` (initial state) | Double-toggle restores original state |
| 6 — Edit preserves identity | `fc.record({ id, title, completed })` + new title | Only `title` changes |
| 7 — Delete removes exactly one | `fc.array(taskArb)` + random id | Deleted id absent; others intact |
| 8 — Link add round-trip | `fc.string()` × 2 (non-empty) | Storage contains link with label + url |
| 9 — Link delete removes exactly one | `fc.array(linkArb)` + random id | Deleted id absent; others intact |
| 10 — Storage round-trip | `fc.array(taskArb \| linkArb)` | `JSON.parse(JSON.stringify(x))` deep-equals `x` |
| 11 — Malformed storage fallback | `fc.string()` (arbitrary) | `load()` returns `null`, no throw |
| 12 — Timer display format | `fc.integer({ min: 0, max: 1500 })` | Output matches `/^\d{2}:\d{2}$/`; correct value |

Each property test should run a minimum of **100 iterations**.

Tag format for each test: `Feature: todo-life-dashboard, Property {N}: {property_text}`

### Edge Cases to Cover

- Task title that is exactly one non-whitespace character
- Task title with leading/trailing whitespace (should be trimmed)
- Timer at exactly 00:00 (boundary — should not go negative)
- Timer reset while actively counting down
- Quick link with a URL that has no protocol prefix (browser handles as relative — acceptable)
- `localStorage` quota exceeded (write silently fails; in-memory state still correct)
- Dashboard loaded with zero tasks and zero links (empty state renders without error)
