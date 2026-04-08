## Project Configuration

- **Language**: None
- **Package Manager**: npm
- **Add-ons**: none

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Aura is a single-file (`index.html`) vanilla HTML/CSS/JS flow board that visualizes relationships between Tasks, Developers, Agents, and Sub-Agents. No build step, no dependencies, no package manager — open `index.html` directly in a browser.

## Architecture

Everything lives in `index.html` in three sections:

1. **`<style>`** — All CSS using CSS custom properties (`--bg`, `--surface`, `--c-dev`, `--c-agent`, `--c-sub`, etc.) for theming. Node states (`lit`, `dimmed`) and connection states (`litpath`, `dimpath`) are toggled via class names.

2. **`<body>`** — Static HTML scaffold: a header with filter dropdowns, a 4-column canvas (`#columns`), an SVG overlay (`#svg-layer`) for animated connections, and a slide-in detail panel (`#detail-panel`).

3. **`<script>`** — All application logic:
   - **Data**: `DEVELOPERS`, `AGENTS`, `SUB_AGENTS`, `TASKS` arrays are the source of truth. Relationships are expressed via foreign-key-style IDs (`developerId`, `agentId`, `parentAgentId`).
   - **`visibleNodes()`**: Filters all four entity types based on current filter state, then derives the edge list. Edges flow: Task → Developer → Agent → Sub-Agent.
   - **`render()`**: Rebuilds all DOM nodes from scratch on each filter change, then calls `drawConnections()`.
   - **`drawConnections()`**: Dynamically sizes the SVG overlay and draws animated dashed cubic-bezier paths between node elements using their bounding rects. `buildPortMaps()` / `portY()` distribute multiple connection attachment points vertically within a node.
   - **`onNodeClick()`**: Sets `activeId`, highlights connected nodes/edges (`lit`/`litpath`), dims everything else (`dimmed`/`dimpath`), and populates the detail panel.
   - **State**: `filters` object (dev/type/status), `checked` object (completion criteria checkbox state keyed by `nodeId:index`), `activeId` (currently selected node).

## Key Patterns

- Node elements are created with `makeNode()` and get `id="node-{entityId}"` for SVG targeting.
- Connection highlighting works by comparing `curEdges` against `activeId` to find connected node IDs, then toggling CSS classes.
- The detail panel renders a "chain" visualization showing the full Task → Dev → Agent → Sub-Agent path for the selected node.
- SVG connections are redrawn on `render()` and on window resize (debounced).
- No external JS dependencies — fonts are loaded from Google Fonts.
