// ─── StorageService ──────────────────────────────────────────────────────────
const StorageService = (() => {
  const KEYS = {
    TASKS: 'tdl_tasks',
    LINKS: 'tdl_links',
  };

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // silently ignore write failures (e.g. quota exceeded, private browsing)
    }
  }

  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null; // malformed JSON → fall back to null
    }
  }

  return { KEYS, save, load };
})();

// ─── GreetingWidget ──────────────────────────────────────────────────────────
const GreetingWidget = (() => {
  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function formatDate(date) {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 20) return 'Good Evening';
    return 'Good Night'; // 21–23 and 0–4
  }

  function render() {
    const now = new Date();
    document.getElementById('clock').textContent = formatTime(now);
    document.getElementById('date').textContent = formatDate(now);
    document.getElementById('greeting').textContent = getGreeting(now.getHours());
  }

  function init() {
    render();
    setInterval(render, 1000);
  }

  return { init };
})();

// ─── TimerWidget ─────────────────────────────────────────────────────────────
const TimerWidget = (() => {
  let totalSeconds = 25 * 60;
  let intervalId = null;

  function formatDisplay(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function render() {
    document.getElementById('timer-display').textContent = formatDisplay(totalSeconds);
  }

  function updateControls() {
    const btnStart = document.getElementById('btn-start');
    const btnStop  = document.getElementById('btn-stop');
    const btnReset = document.getElementById('btn-reset');

    if (intervalId !== null) {
      // running
      btnStart.disabled = true;
      btnStop.disabled  = false;
      btnReset.disabled = false;
    } else {
      // stopped
      btnStart.disabled = false;
      btnStop.disabled  = true;
      btnReset.disabled = false;
    }
  }

  function playBeep() {
    try {
      const ctx  = new AudioContext();
      const osc  = ctx.createOscillator();
      osc.type   = 'sine';
      osc.frequency.value = 440;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // AudioContext unavailable — fail silently
    }
  }

  function stop() {
    clearInterval(intervalId);
    intervalId = null;
    updateControls();
  }

  function tick() {
    totalSeconds -= 1;
    render();
    if (totalSeconds === 0) {
      stop();
      playBeep();
    }
  }

  function start() {
    if (intervalId !== null) return; // guard against double-start
    intervalId = setInterval(tick, 1000);
    updateControls();
  }

  function reset() {
    stop();
    totalSeconds = 25 * 60;
    render();
  }

  function init() {
    render();
    updateControls();
    document.getElementById('btn-start').addEventListener('click', start);
    document.getElementById('btn-stop').addEventListener('click', stop);
    document.getElementById('btn-reset').addEventListener('click', reset);
  }

  return { init };
})();

// ─── TaskListWidget ──────────────────────────────────────────────────────────
const TaskListWidget = (() => {
  let tasks = [];

  function generateId() {
    return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Date.now().toString();
  }

  function save() {
    StorageService.save(StorageService.KEYS.TASKS, tasks);
  }

  function load() {
    const result = StorageService.load(StorageService.KEYS.TASKS);
    return result !== null ? result : [];
  }

  function render() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    tasks.forEach((task) => {
      const li = document.createElement('li');

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => toggleTask(task.id));

      // Title span
      const span = document.createElement('span');
      span.textContent = task.title;
      if (task.completed) {
        span.classList.add('completed');
      }

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.classList.add('btn-edit');
      editBtn.addEventListener('click', () => {
        // Replace span with an input for inline editing
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = task.title;
        editInput.dataset.original = task.title;

        let editHandled = false;

        function confirmEdit() {
          if (editHandled) return;
          editHandled = true;
          editTask(task.id, editInput.value);
        }

        function cancelEdit() {
          if (editHandled) return;
          editHandled = true;
          // Restore original title — re-render will handle it
          render();
        }

        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirmEdit();
          } else if (e.key === 'Escape') {
            cancelEdit();
          }
        });

        editInput.addEventListener('blur', () => {
          confirmEdit();
        });

        li.replaceChild(editInput, span);
        editInput.focus();
        editInput.select();
      });

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.add('btn-delete');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }

  function addTask(title) {
    const trimmed = title.trim();
    if (!trimmed) {
      document.getElementById('task-input').focus();
      return;
    }
    tasks.push({ id: generateId(), title: trimmed, completed: false });
    save();
    render();
    document.getElementById('task-input').value = '';
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      save();
      render();
    }
  }

  function editTask(id, newTitle) {
    const trimmed = newTitle.trim();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (!trimmed) {
      // Empty title — restore original and exit edit mode without saving
      render();
      return;
    }

    task.title = trimmed;
    save();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function init() {
    tasks = load();
    render();

    document.getElementById('btn-add-task').addEventListener('click', () => {
      const input = document.getElementById('task-input');
      addTask(input.value);
    });

    document.getElementById('task-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const input = document.getElementById('task-input');
        addTask(input.value);
      }
    });
  }

  return { init };
})();

// ─── QuickLinksWidget ────────────────────────────────────────────────────────
const QuickLinksWidget = (() => {
  let links = [];

  function generateId() {
    return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Date.now().toString();
  }

  function save() {
    StorageService.save(StorageService.KEYS.LINKS, links);
  }

  function load() {
    const result = StorageService.load(StorageService.KEYS.LINKS);
    return result !== null ? result : [];
  }

  function render() {
    const list = document.getElementById('links-list');
    list.innerHTML = '';

    links.forEach((link) => {
      const wrapper = document.createElement('div');

      // Anchor styled as a button
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.add('btn-delete');
      deleteBtn.addEventListener('click', () => deleteLink(link.id));

      wrapper.appendChild(anchor);
      wrapper.appendChild(deleteBtn);
      list.appendChild(wrapper);
    });
  }

  function addLink(label, url) {
    const trimmedLabel = label.trim();
    const trimmedUrl   = url.trim();

    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');

    let hasError = false;

    if (!trimmedLabel) {
      labelInput.classList.add('error');
      hasError = true;
    }

    if (!trimmedUrl) {
      urlInput.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    links.push({ id: generateId(), label: trimmedLabel, url: trimmedUrl });
    save();
    render();

    labelInput.value = '';
    urlInput.value   = '';
  }

  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    save();
    render();
  }

  function init() {
    links = load();
    render();

    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');

    // Remove error class as soon as the user starts typing again
    labelInput.addEventListener('input', () => labelInput.classList.remove('error'));
    urlInput.addEventListener('input',   () => urlInput.classList.remove('error'));

    document.getElementById('btn-add-link').addEventListener('click', () => {
      addLink(labelInput.value, urlInput.value);
    });
  }

  return { init };
})();

// ─── App Bootstrap ───────────────────────────────────────────────────────────
const App = {
  init() {
    GreetingWidget.init();
    TimerWidget.init();
    TaskListWidget.init();
    QuickLinksWidget.init();
  }
};

document.addEventListener('DOMContentLoaded', App.init);
