# Implementation Plan: Todo Life Dashboard

## Overview

Build a single-page personal productivity dashboard using plain HTML, a single CSS file, and a single JavaScript file. No build tools, no frameworks, no dependencies. All data is persisted via `localStorage`. The implementation proceeds in eight incremental steps, each building on the last, finishing with full app bootstrap and wiring.

## Tasks

- [x] 1. Scaffold project files
  - Create `index.html` with the full HTML skeleton: `<head>` with charset, viewport meta, title, and `<link>` to `css/style.css`; `<body>` containing `<div id="app">` with the four `<section>` elements (`#greeting-widget`, `#timer-widget`, `#task-widget`, `#links-widget`) and all inner elements matching the layout structure in the design (`#clock`, `#date`, `#greeting`, `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`, `#task-input`, `#btn-add-task`, `#task-list`, `#link-label-input`, `#link-url-input`, `#btn-add-link`, `#links-list`); add `<script src="js/app.js" defer>` at the end of `<head>`
  - Create `css/style.css` as an empty file (styles added in task 6)
  - Create `js/app.js` as an empty file (logic added in subsequent tasks)
  - _Requirements: 5.2, 5.3_

- [x] 2. Implement StorageService
  - In `js/app.js`, write the `StorageService` IIFE module
  - Define `KEYS` object with `TASKS: 'tdl_tasks'` and `LINKS: 'tdl_links'`
  - Implement `save(key, data)` — wraps `localStorage.setItem(key, JSON.stringify(data))` in a `try/catch` that silently ignores write failures
  - Implement `load(key)` — wraps `localStorage.getItem` and `JSON.parse` in a `try/catch`; returns `null` for missing keys or malformed JSON
  - Expose `{ KEYS, save, load }` as the module's public API
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 3. Implement GreetingWidget
  - In `js/app.js`, write the `GreetingWidget` IIFE module after `StorageService`
  - Implement `formatTime(date)` — returns `"HH:MM:SS"` with each component zero-padded to two digits using `String.prototype.padStart`
  - Implement `formatDate(date)` — returns the full date string (e.g. `"Wednesday, May 7, 2025"`) using `date.toLocaleDateString` with appropriate options
  - Implement `getGreeting(hour)` — returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for 21–23 and 0–4
  - Implement `render()` — reads `new Date()`, sets `#clock` text to `formatTime`, `#date` text to `formatDate`, `#greeting` text to `getGreeting(hour)`
  - Implement `init()` — calls `render()` immediately, then starts a `setInterval` at 1000 ms that calls `render()` on each tick
  - Expose `{ init }` as the module's public API
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 4. Implement TimerWidget
  - In `js/app.js`, write the `TimerWidget` IIFE module after `GreetingWidget`
  - Declare closure variables `let totalSeconds = 25 * 60` and `let intervalId = null`
  - Implement `formatDisplay(seconds)` — returns `"MM:SS"` with both components zero-padded to two digits
  - Implement `render()` — sets `#timer-display` text to `formatDisplay(totalSeconds)`
  - Implement `updateControls()` — when `intervalId` is non-null (running): disable `#btn-start`, enable `#btn-stop`, enable `#btn-reset`; when null (stopped): enable `#btn-start`, disable `#btn-stop`, enable `#btn-reset`
  - Implement `playBeep()` — constructs an `AudioContext`, creates an `OscillatorNode` at 440 Hz, connects it to `destination`, starts and stops it after 0.5 s; wrap entirely in `try/catch` so failure is silent
  - Implement `tick()` — decrements `totalSeconds` by 1, calls `render()`; if `totalSeconds` reaches 0, calls `stop()` then `playBeep()`
  - Implement `start()` — guards against double-start (return if `intervalId` is already set), creates `setInterval(tick, 1000)`, stores the id, calls `updateControls()`
  - Implement `stop()` — calls `clearInterval(intervalId)`, sets `intervalId = null`, calls `updateControls()`
  - Implement `reset()` — calls `stop()`, resets `totalSeconds = 25 * 60`, calls `render()`
  - Implement `init()` — calls `render()` and `updateControls()`, then attaches `click` listeners: `#btn-start` → `start`, `#btn-stop` → `stop`, `#btn-reset` → `reset`
  - Expose `{ init }` as the module's public API
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 5. Implement TaskListWidget
  - In `js/app.js`, write the `TaskListWidget` IIFE module after `TimerWidget`
  - Declare closure variable `let tasks = []`
  - Implement `generateId()` — returns `crypto.randomUUID()` if available, otherwise `Date.now().toString()`
  - Implement `save()` — calls `StorageService.save(StorageService.KEYS.TASKS, tasks)`
  - Implement `load()` — calls `StorageService.load(StorageService.KEYS.TASKS)`; returns the result or `[]` if null
  - Implement `addTask(title)` — trims title, rejects if empty/whitespace-only (refocus `#task-input`), otherwise pushes `{ id, title: trimmed, completed: false }` onto `tasks`, calls `save()` and `render()`, clears the input
  - Implement `toggleTask(id)` — finds the task by id, flips its `completed` boolean, calls `save()` and `render()`
  - Implement `editTask(id, newTitle)` — trims newTitle; if empty, restores original title and exits edit mode without saving; otherwise updates `title`, calls `save()` and `render()`
  - Implement `deleteTask(id)` — filters `tasks` to remove the matching id, calls `save()` and `render()`
  - Implement `render()` — clears `#task-list` innerHTML; for each task in `tasks`, creates an `<li>` containing: a checkbox input (checked if `completed`, with a `change` listener calling `toggleTask`), a `<span>` with the title (applying a strikethrough/completed class when `completed`), an Edit button (clicking it replaces the span with an `<input>` pre-filled with the title; pressing Enter or blurring confirms via `editTask`; pressing Escape restores the original title), and a Delete button (calling `deleteTask`); appends each `<li>` to `#task-list`
  - Implement `init()` — sets `tasks = load()`, calls `render()`, attaches a `click` listener on `#btn-add-task` that reads `#task-input` value and calls `addTask`; also attaches a `keydown` listener on `#task-input` so pressing Enter triggers `addTask`
  - Expose `{ init }` as the module's public API
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 6.1, 6.2, 6.4, 6.5, 6.6_

- [x] 6. Implement QuickLinksWidget
  - In `js/app.js`, write the `QuickLinksWidget` IIFE module after `TaskListWidget`
  - Declare closure variable `let links = []`
  - Implement `generateId()` — same pattern as in TaskListWidget
  - Implement `save()` — calls `StorageService.save(StorageService.KEYS.LINKS, links)`
  - Implement `load()` — calls `StorageService.load(StorageService.KEYS.LINKS)`; returns the result or `[]` if null
  - Implement `addLink(label, url)` — trims both fields; if either is empty, highlight the offending input(s) with a visual error indicator and return without adding; otherwise push `{ id, label: trimmed, url: trimmed }` onto `links`, call `save()` and `render()`, clear both inputs
  - Implement `deleteLink(id)` — filters `links` to remove the matching id, calls `save()` and `render()`
  - Implement `render()` — clears `#links-list` innerHTML; for each link in `links`, creates a wrapper `<div>` containing: an `<a>` styled as a button with `href` set to the link's url, `target="_blank"`, `rel="noopener noreferrer"`, and text set to the link's label; and a Delete button (calling `deleteLink`); appends each wrapper to `#links-list`
  - Implement `init()` — sets `links = load()`, calls `render()`, attaches a `click` listener on `#btn-add-link` that reads `#link-label-input` and `#link-url-input` values and calls `addLink`
  - Expose `{ init }` as the module's public API
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 6.1, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Write CSS layout and visual styles
  - In `css/style.css`, add a CSS reset / box-sizing rule and base `body` styles (background colour, font family, margin 0)
  - Style `#app` for the desktop 2×2 grid layout: `display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; height: 100vh; overflow: hidden` inside a `@media (min-width: 1024px)` block
  - Add a `@media (max-width: 767px)` block that sets `#app` to `display: flex; flex-direction: column` so widgets stack vertically on mobile
  - Style each `<section>` widget with padding, a visible border or background to make it visually distinct, and `overflow-y: auto` so long task lists scroll within their cell
  - Style `#greeting-widget`: centre-align text; make `#greeting` the largest typographic element, `#clock` secondary, `#date` tertiary
  - Style `#timer-widget`: centre-align; make `#timer-display` large and monospaced; style the three control buttons with clear enabled/disabled visual states
  - Style `#task-widget`: style the input row as a flex row; style `<li>` task items with flex layout for checkbox, title span, and action buttons; apply `text-decoration: line-through` and reduced opacity to completed task titles via a `.completed` class
  - Style `#links-widget`: style the input row as a flex row; style link buttons and their delete controls
  - Ensure all interactive elements (buttons, inputs) meet minimum touch-target size and have legible font sizes at default browser zoom
  - _Requirements: 5.1, 5.4, 5.5, 5.6_

- [x] 8. Wire App bootstrap and final integration
  - At the end of `js/app.js`, define the `App` object with an `init()` method that calls `GreetingWidget.init()`, `TimerWidget.init()`, `TaskListWidget.init()`, and `QuickLinksWidget.init()` in that order
  - Register `document.addEventListener('DOMContentLoaded', App.init)` so the entire application initialises only after the DOM is ready
  - Verify that all module IIFE declarations appear before the `App` definition in the file so no forward-reference errors occur
  - Open `index.html` directly in a browser and confirm all four widgets render, the clock ticks, the timer controls respond, tasks and links can be added and persist across a page reload
  - _Requirements: 1.1, 2.1, 3.12, 4.8, 5.1, 5.3_

- [x] 9. Final checkpoint
  - Open `index.html` in Chrome, Firefox, and Edge (or Safari) and confirm the dashboard loads without console errors
  - Verify the 2×2 grid layout appears at ≥1024 px viewport width and the single-column stacked layout appears at ≤767 px
  - Confirm tasks and links survive a hard reload (Ctrl+Shift+R / Cmd+Shift+R)
  - Confirm the timer counts down, stops at 00:00, and plays the beep (or fails silently if AudioContext is blocked)
  - Ask the user if any adjustments are needed before considering the feature complete

## Notes

- Tasks marked with `*` are optional — none are present here because all test tasks have been excluded per project constraints
- Each task references specific requirements for traceability
- The implementation order ensures no orphaned code: StorageService is available before any widget that calls it, and App bootstrap is last
- All four widget modules use the IIFE pattern (`const Widget = (() => { ... })()`) to avoid polluting the global scope
- `crypto.randomUUID()` is available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+); the `Date.now()` fallback covers any edge cases
