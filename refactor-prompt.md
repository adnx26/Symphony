# Symphony PM — Refactor Prompt

You are refactoring **Symphony PM**, a React 19 + TypeScript + Vite + Tailwind CSS v4 project management app. The goal is to make the codebase significantly more efficient and prepare it for a Python FastAPI backend.

---

## 1. Split AppContext into focused stores using Zustand

`app/context/AppContext.tsx` is 735 lines and a single god context — every component re-renders on any state change. Replace it with focused Zustand stores:

- `useProjectStore` — projects, activeProjectId, createProject, switchProject, renameProject, deleteProject
- `useTaskStore` — tasks, addTask, updateTask, deleteTask, and all orchestration agent methods (updateTaskStatus, assignTaskToDeveloper, updateTaskPriority, updateTaskDueDate, getBlockedTasks, getOverdueTasks)
- `useBoardStore` — positions, setPositions, resetLayout, panTarget, setPanTarget, selectedId, setSelectedId
- `useUIStore` — panelStack, openPanel, closePanel, drillPanel, panelBack, filters, setFilters
- `useSprintStore` — sprints, sprintTaskIds, activeSprint, addSprint, updateSprint, deleteSprint, addTaskToSprint, removeTaskFromSprint, getSprintTasks
- `useBacklogStore` — epics, stories, addEpic, updateEpic, deleteEpic, addStory, updateStory, deleteStory

Each store should handle its own localStorage persistence using Zustand's `persist` middleware — remove all the manual `lsGet`/`lsSet` calls that are currently scattered through every callback.

Install Zustand:
```bash
npm install zustand
```

---

## 2. Remove dead dependencies

Remove these unused packages:
```bash
npm uninstall react-dnd react-dnd-html5-backend motion tw-animate-css
```

Remove any remaining imports of these in the codebase.

---

## 3. Split DetailPanel.tsx (826 lines)

`app/components/DetailPanel.tsx` is 826 lines rendering multiple different panel modes. Split it into:

- `DetailPanel.tsx` — thin shell, reads `panelStack` from `useUIStore`, renders the right sub-panel
- `TaskDetailPanel.tsx` — task detail view
- `AgentDetailPanel.tsx` — agent/developer detail view

---

## 4. Split large components

- `BoardView.tsx` (389 lines) — extract drag logic into a `useDrag` custom hook in `app/hooks/useDrag.ts`
- `Header.tsx` (246 lines) — extract filter dropdowns into a `FilterBar.tsx` component

---

## 5. Scaffold a Python FastAPI backend

Create a `backend/` directory with this structure:

```
backend/
  main.py           # FastAPI app, CORS, route registration
  models.py         # Pydantic v2 models mirroring app/types.ts
  routers/
    tasks.py        # GET/POST/PATCH/DELETE /tasks
    projects.py     # GET/POST/PATCH/DELETE /projects
    agent.py        # POST /agent/action — Anthropic SDK calls, future LangChain entry point
  db.py             # Supabase Python client (supabase-py)
  requirements.txt  # fastapi, uvicorn, supabase, anthropic, python-dotenv, pydantic
  .env.example      # SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
```

`main.py` should include CORS middleware allowing `http://localhost:5173`. The `agent.py` router should have a single `POST /agent/action` endpoint stubbed out and ready for LangChain integration — comment clearly where LangChain goes.

---

## 6. Update CLAUDE.md

After all changes, update `CLAUDE.md` to reflect:

- Zustand replaces AppContext
- New store file locations
- Python FastAPI backend structure and how to run it (`uvicorn backend.main:app --reload`)
- Removed dependencies

---

## Constraints

- Do not change any UI visuals — this is purely a refactor
- Do not re-add shadcn, react-dnd, or framer-motion
- Keep `app/types.ts` as the TypeScript source of truth on the frontend; Pydantic models in `backend/models.py` should mirror it
- `symphony-layout-v` localStorage key must be bumped to `'6'` after the Zustand migration so users get fresh positions
- All TypeScript must compile cleanly with `tsc -b`
