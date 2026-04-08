# Aura

A flow board for visualizing relationships between Tasks, Developers, Agents, and Sub-Agents. Built with SvelteKit.

## Views

- **Board** (`/`) — Interactive node graph with animated SVG connections. Click any node to highlight its connected chain and view details in the side panel.
- **Tickets** (`/tickets`) — Jira-style grid view of all tasks with status, priority, and assignee info.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) — framework
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [Vite](https://vite.dev) — build tool
