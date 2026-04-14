# Symphony - Project Management Dashboard

A modern, interactive project management dashboard built with React, TypeScript, and Vite.

## Project Structure

```
.
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── .gitignore              # Git ignore rules
├── app/
│   ├── main.tsx            # React DOM render entry
│   ├── App.tsx             # Root component
│   ├── types.ts            # TypeScript type definitions
│   ├── routes.tsx          # Route configuration
│   ├── context/
│   │   └── AppContext.tsx  # Global app state management
│   ├── data/
│   │   ├── appData.ts      # Real data and helper functions
│   │   └── mockData.ts     # Legacy mock data (deprecated)
│   ├── components/
│   │   ├── Root.tsx        # Layout root
│   │   ├── Header.tsx      # Top header with filters
│   │   ├── Sidebar.tsx     # Left sidebar with tree
│   │   ├── BoardView.tsx   # Main board canvas
│   │   ├── TicketsView.tsx # Tickets grid view
│   │   ├── DetailPanel.tsx # Right side panel
│   │   ├── NodeCard.tsx    # Individual node component
│   │   ├── ConnectionLines.tsx # SVG edge rendering
│   │   ├── LoadingSplash.tsx   # Loading screen
│   │   ├── figma/          # Figma-specific components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts
│   └── utils/
│       └── nodeColors.ts   # Color utilities
└── styles/
    ├── index.css
    ├── fonts.css
    ├── theme.css
    ├── tailwind.css
```

## Features

### Board View
- Interactive visual board with draggable nodes
- Four-lane layout: Tasks, Developers, Agents, Sub-Agents
- Connected edges showing task → developer → agent → sub-agent flow
- Pan and zoom controls
- Automated node positioning with layout caching
- Real-time position saving to localStorage

### Tickets View
- Grid view of all tasks
- Click to open detail panel
- Responsive grid layout (1-3 columns)

### Filtering
- Filter by Developer name
- Filter by Agent type (Code Review, QA, DevOps, Design)
- Filter by Status (To Do, In Progress, Done, Blocked)
- Filter by Priority (Low, Medium, High, Critical)
- Real-time node count badge

### Detail Panel
- Task detail view with acceptance criteria
- Developer/Agent/Sub-Agent detail view
- Checklist with persistent state (localStorage)
- Drill-down navigation (Task → Agent)
- Back button for navigation stack

### Sidebar
- Hierarchical tree view of all nodes
- Collapsible sections
- Color-coded node types
- Click to select and open detail panel

## Real Data

The application uses real data from the SvelteKit app:

- **6 Tasks** with full details (title, description, status, priority, due date, acceptance criteria)
- **3 Developers** with roles and responsibilities
- **4 AI Agents** with types and outputs
- **5 Sub-Agents** with specific capabilities

## Global State Management

Using React Context (`AppContext.tsx`) for:
- Filters (dev, type, status, priority)
- Visible nodes (computed from filters)
- Panel stack (for detail view navigation)
- Selected node ID
- Board positions (with localStorage persistence)
- Checked criteria (with localStorage persistence)

## localStorage Keys

- `aura-positions` - Board node positions (JSON)
- `aura-layout-v` - Layout version ('3')
- `aura-checked` - Checked criteria (JSON)
- `aura-sidebar-visible` - Sidebar collapse state

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

## Key Technologies

- **React 19** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 6** - Build tool
- **TailwindCSS 4** - Styling
- **Framer Motion** - Animations
- **react-dnd** - Drag and drop
- **lucide-react** - Icons

## Design System

### Colors
- Task: Amber (#f59e0b)
- Developer: Cyan (#1dd4ef / #22d3ee)
- Agent: Purple (#a78bfa)
- Sub-Agent: Rose (#fb7185)

### Spacing
- Node width: 220px
- Node height: 68px
- Lane width: 244px (NODE_W + 24)
- Gap: 24px

### Typography
- Logo font: Syne
- Body font: Tailwind defaults (inter)
- Tracking: Extensive use of letter-spacing

## Component APIs

### useApp Hook
```typescript
const {
  filters,              // FilterState
  setFilters,           // (FilterState) => void
  visible,              // VisibleNodes
  selectedId,           // string | null
  setSelectedId,        // (string | null) => void
  panelStack,           // PanelEntry[]
  openPanel,            // (PanelEntry) => void
  closePanel,           // () => void
  drillPanel,           // (PanelEntry) => void
  panelBack,            // () => void
  checkedCriteria,      // Record<string, boolean>
  toggleCriterion,      // (key: string) => void
  positions,            // Record<string, BoardPosition>
  setPositions,         // (Record<string, BoardPosition>) => void
  resetLayout,          // () => void
  panTarget,            // string | null
  setPanTarget,         // (string | null) => void
} = useApp();
```

## Notes

- All node positions are persisted to localStorage
- Criteria checklist state is persisted per node
- Status uses 'progress' (not 'in-progress')
- Board height is fixed at 4000px
- Filters are computed in real-time using useMemo
- Tree data is built dynamically from visible nodes
