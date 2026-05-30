# Frontend — React + Vite

## Setup
```bash
npm install
npm run dev
```

Runs on http://localhost:5173 with API proxied to http://localhost:5000

## Build
```bash
npm run build
```

## Folder Structure
```
src/
├── api/              # axios client + per-entity wrappers
├── components/       # Layout, Sidebar, Topbar
├── context/          # AuthContext, AppContext
├── pages/            # Page components per route
│   ├── auth/         # LoginPage
│   ├── dashboard/    # DashboardPage (role-based)
│   ├── leads/        # LeadsPage (reference CRUD)
│   ├── meetings/     # MeetingsPage (reference with multi-action)
│   └── PlaceholderPage.jsx  # for unconverted routes
├── styles/           # app.css (extracted from V8.html, preserved)
├── utils/            # helpers, nav definition
├── App.jsx           # Route definitions
└── main.jsx          # Entry
```

## What's Implemented
- ✅ Auth (login, logout, JWT, protected routes)
- ✅ Layout (Sidebar with role-based nav, Topbar, Modal, Toast)
- ✅ Dashboard with role variants (Admin/Manager/Sales/TMS/etc)
- ✅ Leads — full CRUD with bulk upload
- ✅ Meetings — list, schedule, complete, close deal, payment, reschedule

## What's Placeholder (developer to convert)
See `../CONVERSION_GUIDE.md` for step-by-step instructions.

All remaining pages have routes in `App.jsx` pointing to `PlaceholderPage`.
The original `r<Name>()` function from V8.html is referenced in each placeholder.
