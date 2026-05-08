# Requirements Document

## Introduction

The **Todo Life Dashboard** is a personal productivity web application built with plain HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend server, persisting all data via the browser's Local Storage API. The dashboard combines four core widgets — a contextual greeting with live clock, a Pomodoro-style focus timer, a full-featured to-do list, and a quick-links launcher — into a single, clean, minimal interface.

The application can be opened as a standalone HTML file or loaded as a browser extension start page. It must work in all modern browsers (Chrome, Firefox, Edge, Safari) without any build step or dependency installation.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-of-day greeting message.
- **Timer**: The Pomodoro-style focus countdown timer widget.
- **Task_List**: The to-do list widget that manages the user's tasks.
- **Task**: A single to-do item with a title, completion state, and a unique identifier.
- **Quick_Links**: The widget that displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Session**: The period from when the user opens the Dashboard to when they close or navigate away from it.

---

## Requirements

### Requirement 1: Live Greeting and Clock

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the Dashboard, so that I have immediate context about the time of day without checking another app.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS format, updated every second.
2. THE Greeting_Widget SHALL display the current full date (day of week, month, day, year).
3. WHEN the current local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the current local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the current local time is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the current local time is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. THE Greeting_Widget SHALL update the greeting message automatically when the time crosses a boundary without requiring a page reload.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00) on page load.
2. WHEN the user activates the Start control, THE Timer SHALL begin counting down one second at a time.
3. WHILE the Timer is counting down, THE Timer SHALL update the displayed MM:SS value every second.
4. WHEN the user activates the Stop control, THE Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Start control after a Stop, THE Timer SHALL resume the countdown from the retained remaining time.
6. WHEN the user activates the Reset control, THE Timer SHALL stop any active countdown and restore the display to 25:00.
7. WHEN the countdown reaches 00:00, THE Timer SHALL stop automatically and display 00:00.
8. IF the countdown reaches 00:00, THEN THE Timer SHALL produce an audible or visual alert to notify the user that the session has ended.
9. WHILE the Timer is counting down, THE Timer SHALL disable the Start control and enable the Stop and Reset controls.
10. WHILE the Timer is stopped or reset, THE Timer SHALL enable the Start control and disable the Stop control.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks in a persistent to-do list, so that I can track my daily activities and pick up where I left off after closing the browser.

#### Acceptance Criteria

1. THE Task_List SHALL provide an input field and an Add button for creating new Tasks.
2. WHEN the user submits a non-empty title via the input field, THE Task_List SHALL add a new Task with that title and an initial completion state of incomplete.
3. IF the user attempts to submit an empty or whitespace-only title, THEN THE Task_List SHALL reject the submission and retain focus on the input field.
4. THE Task_List SHALL display each Task with its title, a completion toggle control, an edit control, and a delete control.
5. WHEN the user activates the completion toggle on a Task, THE Task_List SHALL change that Task's completion state from incomplete to complete, or from complete to incomplete.
6. WHILE a Task is in the complete state, THE Task_List SHALL apply a visual distinction (such as strikethrough text) to differentiate it from incomplete Tasks.
7. WHEN the user activates the edit control on a Task, THE Task_List SHALL present the Task's current title in an editable field.
8. WHEN the user confirms an edit with a non-empty title, THE Task_List SHALL update the Task's title to the new value.
9. IF the user confirms an edit with an empty or whitespace-only title, THEN THE Task_List SHALL reject the update and retain the Task's original title.
10. WHEN the user activates the delete control on a Task, THE Task_List SHALL permanently remove that Task from the list.
11. WHEN any Task is added, edited, toggled, or deleted, THE Task_List SHALL persist the full updated Task collection to Local_Storage.
12. WHEN the Dashboard loads, THE Task_List SHALL read all previously saved Tasks from Local_Storage and render them in the list.
13. IF no Tasks are found in Local_Storage on load, THEN THE Task_List SHALL display an empty list with no error.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and launch shortcut buttons to my favorite websites, so that I can navigate to frequently visited URLs with a single click without typing them each time.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide an interface for the user to add a new Link by entering a label and a URL.
2. WHEN the user submits a new Link with both a non-empty label and a non-empty URL, THE Quick_Links widget SHALL add a button for that Link to the display.
3. IF the user attempts to submit a new Link with an empty label or an empty URL, THEN THE Quick_Links widget SHALL reject the submission and indicate which field is missing.
4. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab.
5. THE Quick_Links widget SHALL provide a delete control for each Link.
6. WHEN the user activates the delete control on a Link, THE Quick_Links widget SHALL permanently remove that Link from the display.
7. WHEN any Link is added or deleted, THE Quick_Links widget SHALL persist the full updated Link collection to Local_Storage.
8. WHEN the Dashboard loads, THE Quick_Links widget SHALL read all previously saved Links from Local_Storage and render them as buttons.
9. IF no Links are found in Local_Storage on load, THEN THE Quick_Links widget SHALL display an empty state with no error.

---

### Requirement 5: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organized dashboard, so that I can use all four widgets comfortably without cognitive overload.

#### Acceptance Criteria

1. THE Dashboard SHALL present all four widgets (Greeting_Widget, Timer, Task_List, Quick_Links) on a single page without requiring vertical scrolling on a standard desktop viewport (minimum 1024px wide).
2. THE Dashboard SHALL use a single CSS file located at `css/style.css` for all styling.
3. THE Dashboard SHALL use a single JavaScript file located at `js/app.js` for all behavior.
4. THE Dashboard SHALL apply a clear visual hierarchy so that each widget is visually distinct from the others.
5. THE Dashboard SHALL use typography that is legible at default browser font sizes.
6. WHEN the viewport width is below 768px, THE Dashboard SHALL reflow the layout so that widgets stack vertically and remain fully usable.

---

### Requirement 6: Data Persistence and Storage

**User Story:** As a user, I want my tasks and quick links to survive page reloads and browser restarts, so that I never lose my data between sessions.

#### Acceptance Criteria

1. THE Dashboard SHALL use only the browser Local_Storage API for all data persistence; no external server or database SHALL be required.
2. THE Task_List SHALL serialize the Task collection as a JSON string before writing to Local_Storage under a consistent key.
3. THE Quick_Links widget SHALL serialize the Link collection as a JSON string before writing to Local_Storage under a consistent key.
4. WHEN the Dashboard reads data from Local_Storage, THE Dashboard SHALL parse the JSON string back into the appropriate data structure before use.
5. IF Local_Storage data for Tasks or Links is malformed or unreadable, THEN THE Dashboard SHALL fall back to an empty collection and continue operating normally.
6. THE Dashboard SHALL NOT require the user to manually save data; all persistence SHALL occur automatically after each change.
