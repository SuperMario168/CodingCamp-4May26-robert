# Project Structure

> This project is in early setup. Update this file as the codebase grows.

## Current Layout

```
/
├── .kiro/
│   ├── specs/
│   │   └── todo-life-dashboard/   # Feature spec (requirements, design, tasks)
│   ├── steering/                  # AI steering rules (this file lives here)
│   └── skills/                    # Kiro skills (currently empty)
└── README.md
```

## Expected Structure (to be confirmed after scaffolding)

```
/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page-level views or routes
│   ├── hooks/         # Custom React hooks (if using React)
│   ├── store/         # State management
│   ├── utils/         # Helper functions and utilities
│   └── types/         # TypeScript types/interfaces (if using TS)
├── public/            # Static assets
├── tests/             # Test files, mirroring src/ structure
├── .kiro/             # Kiro specs and steering
└── README.md
```

## Conventions
- Keep components small and focused on a single responsibility
- Co-locate tests with the code they test, or mirror the `src/` structure under `tests/`
- Update this file whenever new top-level directories are added
