/*
 * Challenge 8 — Smart Delivery Route
 * -----------------------------------
 * Location = Node, Road = Edge, Distance = Weight  →  weighted undirected graph.
 *
 * Initial Approach:
 *   DFS se source se destination tak ke saare possible paths nikaalo, sabse chhota lo.
 *   Time Complexity:  O(V!) worst case — paths exponential ho jaate hain
 *   Space Complexity: O(V) recursion stack
 *   8 nodes pe chal jaayega, par real city map pe bilkul nahi.
 *
 * Optimized Approach — Dijkstra + Min Heap:
 *   Har step pe wo location uthao jiska ab tak ka known cost sabse kam hai
 *   (min-heap isi kaam ke liye), uske neighbours ko relax karo.
 *   Destination heap se nikla → answer final, wahin ruk jao (early exit).
 *   `prev` map se path ulta chalke bana lete hain.
 *   Time Complexity:  O((V + E) log V)
 *   Space Complexity: O(V + E) — adjacency list + dist/prev + heap
 *
 * Follow-up — Traffic:
 *   data.js me traffic nahi hai, isliye TRAFFIC niche alag se rakha hai (data file ko touch nahi kiya).
 *   Time per road = distance × traffic × (minutes per km).
 *   "Fastest" mode me Dijkstra ka weight distance ki jagah ye time ban jaata hai —
 *   algorithm same, sirf weight function badla.
 */

// ---------- Min Heap (library allowed nahi thi, to khud likha) ----------
class MinHeap {
  constructor() {
    this.data = []; // [priority, value]
  }
  get size() {
    return this.data.length;
  }
  push(priority, value) {
    this.data.push([priority, value]);
    this._up(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return null;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._down(0);
    }
    return top;
  }
  _up(i) {
    const d = this.data;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (d[parent][0] <= d[i][0]) break;
      [d[parent], d[i]] = [d[i], d[parent]];
      i = parent;
    }
  }
  _down(i) {
    const d = this.data;
    const n = d.length;
    while (true) {
      const l = 2 * i + 1;
      const r = l + 1;
      let small = i;
      if (l < n && d[l][0] < d[small][0]) small = l;
      if (r < n && d[r][0] < d[small][0]) small = r;
      if (small === i) break;
      [d[small], d[i]] = [d[i], d[small]];
      i = small;
    }
  }
}

// 1.0 = khaali road, 3.0 = matlab 3 guna time (Pari Chowk wala jam 😅)
const TRAFFIC = {
  "L1-L2": 1.0,
  "L1-L3": 1.2,
  "L2-L3": 1.5,
  "L2-L4": 1.1,
  "L3-L4": 3.0,
  "L3-L5": 1.3,
  "L4-L5": 1.8,
  "L4-L6": 1.2,
  "L5-L6": 1.4,
  "L5-L7": 1.0,
  "L6-L8": 2.0,
  "L7-L8": 1.1,
};

// map drawing ke liye positions — sirf UI ke liye hai
const NODE_POS = {
  L1: [60, 170],
  L2: [180, 60],
  L3: [180, 280],
  L4: [310, 170],
  L5: [430, 280],
  L6: [430, 60],
  L7: [560, 280],
  L8: [560, 60],
};

const Delivery = {
  MIN_PER_KM: 2, // ~30 km/h average city speed maan ke chal rahe hain
  HANDLING_MIN: 10, // packing + handover

  graph: new Map(), // id -> [{ to, distance, traffic }]
  names: new Map(), // id -> name
  roads: [],

  init(network) {
    this.buildGraph(network);

    this.els = {
      form: document.getElementById("routeForm"),
      from: document.getElementById("routeFrom"),
      to: document.getElementById("routeTo"),
      swap: document.getElementById("swapRoute"),
      result: document.getElementById("routeResult"),
      map: document.getElementById("routeMap"),
    };

    const options = [...this.names]
      .map(([id, name]) => `<option value="${UI.esc(id)}">${UI.esc(name)}</option>`)
      .join("");
    this.els.from.innerHTML = options;
    this.els.to.innerHTML = options;

    // default: Main Warehouse → Knowledge Park (challenge wala example)
    if (this.names.has("L1")) this.els.from.value = "L1";
    if (this.names.has("L4")) this.els.to.value = "L4";

    this.els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.run();
    });
    this.els.from.addEventListener("change", () => this.run());
    this.els.to.addEventListener("change", () => this.run());
    this.els.swap.addEventListener("click", () => {
      const f = this.els.from.value;
      this.els.from.value = this.els.to.value;
      this.els.to.value = f;
      this.run();
    });
    document.querySelectorAll('input[name="routeMode"]').forEach((r) => r.addEventListener("change", () => this.run()));

    this.run();
  },

  buildGraph(network) {
    const locations = (network && network.locations) || [];
    const roads = (network && network.roads) || [];

    locations.forEach((loc) => {
      if (!loc || !loc.id) return;
      this.names.set(loc.id, loc.name || loc.id);
      this.graph.set(loc.id, []);
    });

    roads.forEach((road) => {
      const { from, to, distance } = road || {};
      // galat road data ko chupchaap skip karo
      if (!this.graph.has(from) || !this.graph.has(to) || !(distance > 0)) return;
      const traffic = this.trafficFor(from, to);
      // two-way roads hain
      this.graph.get(from).push({ to, distance, traffic });
      this.graph.get(to).push({ to: from, distance, traffic });
      this.roads.push({ from, to, distance, traffic });
    });
  },

  trafficFor(a, b) {
    return TRAFFIC[`${a}-${b}`] ?? TRAFFIC[`${b}-${a}`] ?? 1;
  },

  roadMinutes(edge) {
    return edge.distance * edge.traffic * this.MIN_PER_KM;
  },

  /**
   * Dijkstra. weightFn decide karta hai "cost" kya hai (km ya minutes).
   * return: { path: [ids], cost } ya null agar pahunch hi nahi sakte
   */
  shortestPath(source, target, weightFn) {
    if (!this.graph.has(source) || !this.graph.has(target)) return null;
    if (source === target) return { path: [source], cost: 0 };

    const dist = new Map([[source, 0]]);
    const prev = new Map();
    const visited = new Set();
    const heap = new MinHeap();
    heap.push(0, source);

    while (heap.size) {
      const [d, node] = heap.pop();
      if (visited.has(node)) continue; // purani (stale) entry, skip
      visited.add(node);
      if (node === target) break; // mil gaya, aage dekhne ki zarurat nahi

      for (const edge of this.graph.get(node)) {
        if (visited.has(edge.to)) continue;
        const nd = d + weightFn(edge);
        if (nd < (dist.get(edge.to) ?? Infinity)) {
          dist.set(edge.to, nd);
          prev.set(edge.to, node);
          heap.push(nd, edge.to);
        }
      }
    }

    if (!dist.has(target)) return null;

    const path = [];
    for (let cur = target; cur !== undefined; cur = prev.get(cur)) path.push(cur);
    path.reverse();
    return { path, cost: dist.get(target) };
  },

  edgeBetween(a, b) {
    return this.graph.get(a).find((e) => e.to === b);
  },

  // path mil gaya, ab uski detail — har leg ki km aur time
  describe(path) {
    const legs = [];
    let km = 0;
    let min = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const e = this.edgeBetween(path[i], path[i + 1]);
      const t = this.roadMinutes(e);
      legs.push({ from: path[i], to: path[i + 1], km: e.distance, min: t, traffic: e.traffic });
      km += e.distance;
      min += t;
    }
    return { legs, km, min };
  },

  mode() {
    return document.querySelector('input[name="routeMode"]:checked')?.value || "distance";
  },

  run() {
    const from = this.els.from.value;
    const to = this.els.to.value;
    const mode = this.mode();

    if (from === to) {
      this.els.result.innerHTML = UI.emptyState("📍", "Pickup and drop are the same", "No delivery needed — you are already there!");
      this.drawMap([], mode);
      return;
    }

    const weight = mode === "time" ? (e) => this.roadMinutes(e) : (e) => e.distance;
    const res = this.shortestPath(from, to, weight);

    if (!res) {
      this.els.result.innerHTML = UI.emptyState("🚫", "No route found", "These two locations are not connected by any road.");
      this.drawMap([], mode);
      return;
    }

    const info = this.describe(res.path);

    // compare ke liye dusre mode ka answer bhi nikaal lete hain
    const otherWeight = mode === "time" ? (e) => e.distance : (e) => this.roadMinutes(e);
    const other = this.shortestPath(from, to, otherWeight);
    const differs = other && other.path.join() !== res.path.join();

    this.renderResult(res.path, info, mode, differs ? this.describe(other.path) : null);
    this.drawMap(res.path, mode);
  },

  fmtMin(m) {
    const total = Math.round(m);
    if (total < 60) return `${total} min`;
    return `${Math.floor(total / 60)} hr ${total % 60} min`;
  },

  trafficLabel(t) {
    if (t >= 2) return ["high", "Heavy"];
    if (t >= 1.3) return ["mid", "Moderate"];
    return ["low", "Free"];
  },

  renderResult(path, info, mode, alt) {
    const stops = Math.max(0, path.length - 2);
    const eta = info.min + this.HANDLING_MIN;

    const chain = path
      .map((id, i) => {
        const cls = i === 0 ? "start" : i === path.length - 1 ? "end" : "";
        const pill = `<span class="route-node ${cls}">${UI.esc(this.names.get(id))}</span>`;
        if (i === path.length - 1) return pill;
        const leg = info.legs[i];
        return `${pill}<span class="route-arrow"><span>↓</span><small>${leg.km} km</small></span>`;
      })
      .join("");

    const steps = info.legs
      .map((l, i) => {
        const [cls, label] = this.trafficLabel(l.traffic);
        return `
          <li>
            <span class="step-no">${i + 1}</span>
            <div>
              <b>${UI.esc(this.names.get(l.from))} → ${UI.esc(this.names.get(l.to))}</b>
              <div class="muted small">${l.km} km · ~${this.fmtMin(l.min)} · <span class="traffic ${cls}">${label} traffic</span></div>
            </div>
          </li>`;
      })
      .join("");

    let altNote = "";
    if (alt) {
      altNote =
        mode === "time"
          ? `<p class="hint">💡 The shortest-distance route is ${alt.km} km but would take ~${this.fmtMin(alt.min)} because of traffic, so a slightly longer road was chosen.</p>`
          : `<p class="hint">💡 With traffic, the fastest route takes ~${this.fmtMin(alt.min)} (${alt.km} km). Try the "Fastest" mode.</p>`;
    }

    this.els.result.innerHTML = `
      <h3>${mode === "time" ? "Fastest Delivery Route" : "Best Delivery Route"}</h3>
      <div class="route-chain">${chain}</div>

      <div class="stats compact">
        <div class="stat"><span>Total distance</span><b>${info.km} km</b></div>
        <div class="stat"><span>Stops in between</span><b>${stops}</b></div>
        <div class="stat accent"><span>Est. delivery</span><b>${this.fmtMin(eta)}</b></div>
      </div>
      <p class="muted small">ETA = road time (~${this.fmtMin(info.min)}) + ${this.HANDLING_MIN} min packing/handover. Assumes an average speed of 30 km/h.</p>

      ${altNote}

      <h4>Route steps</h4>
      <ol class="steps">${steps}</ol>`;
  },

  // chhota sa SVG map — route highlight hota hai
  drawMap(path, mode) {
    const svg = this.els.map;
    const onPath = new Set();
    for (let i = 0; i < path.length - 1; i++) {
      onPath.add(`${path[i]}|${path[i + 1]}`);
      onPath.add(`${path[i + 1]}|${path[i]}`);
    }
    const nodesOnPath = new Set(path);

    let edges = "";
    let labels = "";
    this.roads.forEach((r) => {
      const a = NODE_POS[r.from];
      const b = NODE_POS[r.to];
      if (!a || !b) return;
      const active = onPath.has(`${r.from}|${r.to}`);
      const [tcls] = this.trafficLabel(r.traffic);
      const cls = ["edge", active ? "active" : "", mode === "time" ? `t-${tcls}` : ""].join(" ");
      edges += `<line class="${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" />`;
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      labels += `<g class="edge-label ${active ? "active" : ""}"><rect x="${mx - 17}" y="${my - 10}" width="34" height="20" rx="10" /><text x="${mx}" y="${my + 4}">${r.distance}km</text></g>`;
    });

    let nodes = "";
    for (const [id, name] of this.names) {
      const pos = NODE_POS[id];
      if (!pos) continue;
      const [x, y] = pos;
      let cls = "node";
      if (id === path[0]) cls += " start";
      else if (id === path[path.length - 1]) cls += " end";
      else if (nodesOnPath.has(id)) cls += " active";
      const ly = y < 170 ? y - 18 : y + 28; // upar waale nodes ka label upar, neeche waalon ka neeche
      nodes += `<g class="${cls}"><circle cx="${x}" cy="${y}" r="10" /><text x="${x}" y="${id === "L1" ? y + 28 : ly}">${UI.esc(name)}</text></g>`;
    }

    svg.innerHTML = edges + labels + nodes;
  },
};
