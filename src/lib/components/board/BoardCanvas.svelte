<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { visibleNodes } from '$lib/stores/filters.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { openPanel, closePanel } from '$lib/stores/panel.js';
  import { board, panTarget, resetSignal } from '$lib/stores/board.js';
  import {
    NODE_W, NODE_H, STATUS_LABEL,
    LANE_LABELS, LANE_COLORS,
    priorityConfig, formatDueDate, getDepth,
    computeDefaultPositions, buildPortMaps,
    connectedIds, nodeKind
  } from '$lib/helpers.js';

  let canvasEl, boardEl, svgEl;
  let curEdges = [];
  let dragState = null;
  let lastDragMoved = false;
  let panState = null;
  let lastPanMoved = false;

  const LAYOUT_VERSION = '3';

  function loadPositions() {
    try {
      if (localStorage.getItem('aura-layout-v') !== LAYOUT_VERSION) return;
      const raw = localStorage.getItem('aura-positions');
      if (raw) board.update(b => ({ ...b, positions: { ...b.positions, ...JSON.parse(raw) } }));
    } catch {}
  }

  function savePositions() {
    localStorage.setItem('aura-positions', JSON.stringify(get(board).positions));
    localStorage.setItem('aura-layout-v', LAYOUT_VERSION);
  }

  function applyTransform() {
    if (!boardEl) return;
    const { zoom } = get(board);
    boardEl.style.transform = `translate(${zoom.x}px,${zoom.y}px) scale(${zoom.scale})`;
  }

  function render(visible) {
    if (!boardEl || !svgEl) return;
    const { tasks, devs, agents, subAgents, edges, taskColor } = visible;
    curEdges = edges;

    const allNodes = [...tasks, ...devs, ...agents, ...subAgents];
    const { positions } = get(board);
    const missing = allNodes.filter(n => !positions[n.id]);
    if (missing.length) {
      const defaults = computeDefaultPositions(tasks, devs, agents, subAgents);
      board.update(b => {
        const p = { ...b.positions };
        missing.forEach(n => { if (defaults[n.id]) p[n.id] = defaults[n.id]; });
        return { ...b, positions: p };
      });
    }

    boardEl.querySelectorAll('.node, .swimlane').forEach(el => el.remove());

    const maxDepth = allNodes.reduce((m, n) => Math.max(m, getDepth(n.id)), 2);
    renderSwimlanes(maxDepth, allNodes);

    const pos = get(board).positions;

    tasks.forEach(t => {
      const pc = priorityConfig(t.priority);
      const dd = formatDueDate(t.dueDate);
      const priorityPill = pc ? `<span class="tag" style="background:${pc.bg};color:${pc.color}">● ${pc.label}</span>` : '';
      const duePill = dd ? `<span class="tag" style="background:${dd.bg};color:${dd.color};border:1px solid ${dd.border}">${dd.text}</span>` : '';
      addNode(t, 'task-node',
        `<div class="node-title">${t.title}</div><div class="node-sub">${t.desc}</div><div class="node-tags"><span class="tag tag-${t.status}">${STATUS_LABEL[t.status]}</span>${priorityPill}${duePill}</div>`,
        taskColor[t.id], pos);
    });

    devs.forEach(d => {
      addNode(d, 'dev-node',
        `<div class="node-row"><span class="avatar" style="background:#1a3d4a;color:#1dd4ef">${d.initials}</span><div class="node-title" style="margin:0">${d.name}</div></div><div class="node-sub" style="margin-top:4px">${d.role}</div>`,
        null, pos);
    });

    agents.forEach(a => addNode(a, 'agent-node',
      `<div class="node-title">${a.name}</div><div class="node-sub">${a.type}</div>`,
      null, pos));

    subAgents.forEach(sa => addNode(sa, 'sub-node',
      `<div class="node-title">${sa.name}</div><div class="node-sub">${sa.type}</div>`,
      null, pos));

    requestAnimationFrame(() => drawConnections(edges));
  }

  function addNode(item, className, innerHTML, accent, pos) {
    const BADGE = { 'task-node':'TASK', 'dev-node':'DEV', 'agent-node':'AGENT', 'sub-node':'SUB' };
    const el = document.createElement('div');
    el.id = `node-${item.id}`;
    el.className = `node ${className}`;
    el.dataset.nid = item.id;
    el.innerHTML = innerHTML;
    if (accent) {
      el.insertAdjacentHTML('afterbegin',
        `<style>#node-${item.id}::before{background:${accent}}#node-${item.id}.lit{box-shadow:0 0 24px ${accent}33,inset 0 0 28px ${accent}08}</style>`);
    }
    if (BADGE[className]) {
      el.insertAdjacentHTML('beforeend', `<span class="node-type-badge">${BADGE[className]}</span>`);
    }
    const p = pos[item.id] || { x:0, y:0 };
    el.style.left = p.x + 'px';
    el.style.top  = p.y + 'px';
    boardEl.appendChild(el);
    initDrag(el, item.id);
    el.addEventListener('click', e => {
      if (lastDragMoved) { lastDragMoved = false; return; }
      e.stopPropagation();
      const $activeId = get(activeId);
      if ($activeId === item.id) { activeId.set(null); closePanel(); }
      else { activeId.set(item.id); openPanel({ mode:'agent', id:item.id }); }
      applyHighlight();
    });
  }

  function renderSwimlanes(maxDepth, allNodes) {
    const PAD = 20;
    const pos = get(board).positions;
    for (let depth = 0; depth <= maxDepth; depth++) {
      const xs = allNodes.filter(n => getDepth(n.id) === depth).map(n => pos[n.id]?.x).filter(x => x != null);
      if (!xs.length) continue;
      const minX = Math.min(...xs) - PAD;
      const laneW = Math.max(...xs) + NODE_W + PAD - minX;
      const lane = document.createElement('div');
      lane.className = 'swimlane';
      lane.style.cssText = `left:${minX}px;width:${laneW}px;background:${LANE_COLORS[depth % LANE_COLORS.length]}`;
      lane.innerHTML = `<span class="lane-label">${LANE_LABELS[depth] || 'Level ' + depth}</span>`;
      boardEl.appendChild(lane);
    }
  }

  function initDrag(el, nodeId) {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const pos = get(board).positions[nodeId] || { x:0, y:0 };
      const scale = get(board).zoom.scale;
      dragState = { nodeId, startX:e.clientX, startY:e.clientY, origX:pos.x, origY:pos.y, scale, moved:false };
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!dragState || dragState.nodeId !== nodeId) return;
      const dx = (e.clientX - dragState.startX) / dragState.scale;
      const dy = (e.clientY - dragState.startY) / dragState.scale;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;
      const newPos = { x: dragState.origX + dx, y: dragState.origY + dy };
      board.update(b => ({ ...b, positions: { ...b.positions, [nodeId]: newPos } }));
      el.style.left = newPos.x + 'px';
      el.style.top  = newPos.y + 'px';
      requestAnimationFrame(() => drawConnections(curEdges));
    });
    el.addEventListener('pointerup', e => {
      if (!dragState || dragState.nodeId !== nodeId) return;
      el.releasePointerCapture(e.pointerId);
      el.classList.remove('dragging');
      lastDragMoved = dragState.moved;
      if (dragState.moved) savePositions();
      dragState = null;
    });
  }

  function zoomAround(delta, cx, cy) {
    board.update(b => {
      const bx = (cx - b.zoom.x) / b.zoom.scale;
      const by = (cy - b.zoom.y) / b.zoom.scale;
      const scale = Math.min(2, Math.max(0.2, b.zoom.scale * delta));
      return { ...b, zoom: { scale, x: cx - bx * scale, y: cy - by * scale } };
    });
    applyTransform();
  }

  function fitToScreen() {
    if (!boardEl || !canvasEl) return;
    const allEls = boardEl.querySelectorAll('.node');
    if (!allEls.length) return;
    const pos = get(board).positions;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allEls.forEach(el => {
      const p = pos[el.dataset.nid];
      if (!p) return;
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + el.offsetWidth); maxY = Math.max(maxY, p.y + el.offsetHeight);
    });
    const PAD = 60, bw = maxX - minX + PAD * 2, bh = maxY - minY + PAD * 2;
    let s = Math.min(canvasEl.clientWidth / bw, canvasEl.clientHeight / bh, 2);
    s = Math.max(s, 0.2);
    board.update(b => ({ ...b, zoom: { scale:s, x:(canvasEl.clientWidth-bw*s)/2-(minX-PAD)*s, y:(canvasEl.clientHeight-bh*s)/2-(minY-PAD)*s } }));
    applyTransform();
  }

  function ensureMarker(svg, defs, color) {
    const mid = 'mk' + color.replace(/[^a-z0-9]/gi,'');
    if (!defs.querySelector('#'+mid)) {
      const m = document.createElementNS('http://www.w3.org/2000/svg','marker');
      m.setAttribute('id',mid); m.setAttribute('markerWidth','7'); m.setAttribute('markerHeight','7');
      m.setAttribute('refX','6'); m.setAttribute('refY','3.5'); m.setAttribute('orient','auto');
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d','M0,0.5 L6,3.5 L0,6.5 Z'); p.setAttribute('fill',color); p.setAttribute('opacity','0.85');
      m.appendChild(p); defs.appendChild(m);
    }
    return 'url(#'+mid+')';
  }

  function drawConnections(edges) {
    if (!svgEl || !boardEl) return;
    svgEl.innerHTML = '';
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    svgEl.appendChild(defs);
    const portMaps = buildPortMaps(edges);
    const pos = get(board).positions;
    edges.forEach(edge => {
      const fromEl = boardEl.querySelector(`#node-${edge.from}`);
      const toEl   = boardEl.querySelector(`#node-${edge.to}`);
      if (!fromEl || !toEl) return;
      const fp = pos[edge.from], tp = pos[edge.to];
      if (!fp || !tp) return;
      const fw = fromEl.offsetWidth, fh = fromEl.offsetHeight, th = toEl.offsetHeight;
      const fromList = portMaps.R[edge.from]||[], toList = portMaps.L[edge.to]||[];
      const fi = fromList.indexOf(edge.to), ft = fromList.length;
      const ti = toList.indexOf(edge.from), tt = toList.length;
      const fFrac = ft===1?0.5:(fi+1)/(ft+1);
      const tFrac = tt===1?0.5:(ti+1)/(tt+1);
      const x1=fp.x+fw, y1=fp.y+fh*fFrac, x2=tp.x, y2=tp.y+th*tFrac;
      const dx = Math.max(36,(x2-x1)*0.48);
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${x1} ${y1} C ${x1+dx} ${y1} ${x2-dx} ${y2} ${x2} ${y2}`);
      path.setAttribute('stroke',edge.color); path.setAttribute('stroke-width','1.5');
      path.setAttribute('marker-end',ensureMarker(svgEl,defs,edge.color));
      path.classList.add('conn');
      path.dataset.from=edge.from; path.dataset.to=edge.to; path.dataset.taskid=edge.taskId||'';
      path.style.opacity='0.38';
      svgEl.appendChild(path);
    });
    applyHighlight();
  }

  function applyHighlight() {
    if (!boardEl) return;
    const $activeId = get(activeId);
    const nodes = boardEl.querySelectorAll('.node');
    const conns = svgEl?.querySelectorAll('.conn') || [];
    if (!$activeId) {
      nodes.forEach(n => n.classList.remove('dimmed','lit'));
      conns.forEach(c => { c.classList.remove('litpath','dimpath'); c.style.opacity='0.38'; });
      return;
    }
    const lit = connectedIds($activeId, curEdges);
    nodes.forEach(n => {
      n.classList.toggle('dimmed', !lit.has(n.dataset.nid));
      n.classList.toggle('lit',     lit.has(n.dataset.nid));
    });
    conns.forEach(c => {
      const inLit = lit.has(c.dataset.from) && lit.has(c.dataset.to);
      c.classList.toggle('litpath', inLit);
      c.classList.toggle('dimpath', !inLit);
      c.style.opacity='';
    });
  }

  let unsubs = [];

  onMount(() => {
    loadPositions();

    // Canvas pan
    canvasEl.addEventListener('pointerdown', e => {
      if (e.button!==0 || e.target.closest('.node')) return;
      canvasEl.setPointerCapture(e.pointerId);
      const z = get(board).zoom;
      panState = { startX:e.clientX, startY:e.clientY, origX:z.x, origY:z.y, moved:false };
      canvasEl.classList.add('panning');
    });
    canvasEl.addEventListener('pointermove', e => {
      if (!panState) return;
      const dx = e.clientX-panState.startX, dy = e.clientY-panState.startY;
      if (Math.abs(dx)>3||Math.abs(dy)>3) panState.moved=true;
      board.update(b => ({ ...b, zoom:{...b.zoom,x:panState.origX+dx,y:panState.origY+dy} }));
      applyTransform();
    });
    canvasEl.addEventListener('pointerup', () => {
      if (!panState) return;
      lastPanMoved = panState.moved;
      panState = null;
      canvasEl.classList.remove('panning');
    });
    canvasEl.addEventListener('click', () => {
      if (lastPanMoved) { lastPanMoved=false; return; }
      activeId.set(null); closePanel(); applyHighlight();
    });
    canvasEl.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = canvasEl.getBoundingClientRect();
      zoomAround(e.deltaY>0?0.9:1.1, e.clientX-rect.left, e.clientY-rect.top);
    }, { passive:false });

    const onResize = () => drawConnections(curEdges);
    window.addEventListener('resize', onResize);

    // Store subscriptions
    unsubs.push(visibleNodes.subscribe(v => render(v)));
    unsubs.push(activeId.subscribe(() => applyHighlight()));
    unsubs.push(panTarget.subscribe(id => {
      if (!id) return;
      const pos = get(board).positions[id];
      if (!pos) { panTarget.set(null); return; }
      const scale = get(board).zoom.scale;
      board.update(b => ({ ...b, zoom:{...b.zoom, x:canvasEl.clientWidth/2-(pos.x+NODE_W/2)*scale, y:canvasEl.clientHeight/2-(pos.y+NODE_H/2)*scale} }));
      applyTransform();
      requestAnimationFrame(() => drawConnections(curEdges));
      panTarget.set(null);
    }));

    // resetSignal: skip first emission (initial subscription call)
    let resetFirst = true;
    unsubs.push(resetSignal.subscribe(() => {
      if (resetFirst) { resetFirst = false; return; }
      const visible = get(visibleNodes);
      const defaults = computeDefaultPositions(visible.tasks, visible.devs, visible.agents, visible.subAgents);
      board.update(b => ({ ...b, positions:defaults, zoom:{x:0,y:0,scale:1} }));
      localStorage.removeItem('aura-positions');
      applyTransform();
      render(visible);
    }));

    unsubs.push(() => window.removeEventListener('resize', onResize));

    applyTransform();
    requestAnimationFrame(fitToScreen);
  });

  onDestroy(() => {
    unsubs.forEach(u => u());
  });

  export function zoomIn()  { zoomAround(1.25, canvasEl.clientWidth/2, canvasEl.clientHeight/2); }
  export function zoomOut() { zoomAround(0.8,  canvasEl.clientWidth/2, canvasEl.clientHeight/2); }
  export function zoomFit() { fitToScreen(); }
</script>

<div bind:this={canvasEl} id="canvas" class="flex-1 relative overflow-hidden min-w-0">
  <div bind:this={boardEl} id="board" class="absolute" style="width:6000px;height:4000px;transform-origin:0 0">
    <svg bind:this={svgEl} xmlns="http://www.w3.org/2000/svg"
         class="absolute top-0 left-0 pointer-events-none"
         style="width:6000px;height:6000px;z-index:1"></svg>
  </div>
</div>
