/*
 * Challenge 4 — Undo / Redo Cart
 * -------------------------------
 * Har cart action ek "operation" object hai: { type, id, from, to }
 *   from = pehle kitni quantity thi, to = baad me kitni.
 * Isse undo karna simple ho jaata hai — bas quantity wapas `from` pe set kar do.
 *
 * Do stacks:
 *   undoStack → jo ho chuka hai (latest upar)
 *   redoStack → jo undo kiya gaya hai
 * A → B → C ke baad undo pehle C ko reverse karega (LIFO), isliye stack.
 * Naya action aaya to redoStack khaali — purana "future" ab valid nahi raha.
 *
 * Initial Approach:
 *   Har action ke baad poore cart ki copy (snapshot) save karo. Undo = pichla snapshot.
 *   Time Complexity:  O(c) per action (copy banani padti hai), c = cart items
 *   Space Complexity: O(h * c), h = history length
 *
 * Optimized Approach (ye wala implement kiya hai):
 *   Sirf badlaav (diff) save karo, poora cart nahi.
 *   Time Complexity:  add / remove / undo / redo sab O(1)
 *                     total nikaalna O(c) — render pe hi hota hai
 *   Space Complexity: O(h) operations + O(c) cart
 */

const Cart = {
  items: new Map(), // productId -> qty
  undoStack: [],
  redoStack: [],
  MAX_HISTORY: 50, // bohot lamba history rakhne ka fayda nahi
  productMap: null,

  init(productMap) {
    this.productMap = productMap;

    this.els = {
      drawer: document.getElementById("cartDrawer"),
      overlay: document.getElementById("cartOverlay"),
      list: document.getElementById("cartItems"),
      count: document.getElementById("cartCount"),
      total: document.getElementById("cartTotal"),
      badge: document.getElementById("cartBadge"),
      undo: document.getElementById("undoBtn"),
      redo: document.getElementById("redoBtn"),
      history: document.getElementById("opHistory"),
    };

    document.getElementById("openCart").addEventListener("click", () => this.open());
    document.getElementById("closeCart").addEventListener("click", () => this.close());
    this.els.overlay.addEventListener("click", () => this.close());

    this.els.undo.addEventListener("click", () => this.undo());
    this.els.redo.addEventListener("click", () => this.redo());

    // cart ke andar ke +/-/remove buttons — ek hi listener (event delegation)
    this.els.list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === "inc") this.increase(id);
      if (btn.dataset.action === "dec") this.decrease(id);
      if (btn.dataset.action === "remove") this.remove(id);
    });

    // Ctrl+Z / Ctrl+Y — input me type karte waqt nahi chalana
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        this.redo();
      }
    });

    this.render();
  },

  qty(id) {
    return this.items.get(id) || 0;
  },

  // ---------- actions ----------

  add(id) {
    const p = this.productMap.get(id);
    if (!p) return;
    const current = this.qty(id);

    if (current >= p.stock) {
      UI.toast(p.stock === 0 ? `${p.name} is out of stock` : `Only ${p.stock} left in stock`);
      return;
    }
    this.execute({ type: current === 0 ? "ADD" : "INC", id, from: current, to: current + 1 });
    UI.toast(`${p.name} added to cart`);
  },

  increase(id) {
    const p = this.productMap.get(id);
    const current = this.qty(id);
    if (!p || current === 0) return;
    if (current >= p.stock) {
      UI.toast(`Only ${p.stock} left in stock`);
      return;
    }
    this.execute({ type: "INC", id, from: current, to: current + 1 });
  },

  decrease(id) {
    const current = this.qty(id);
    if (current === 0) return;
    // 1 se 0 hua matlab product hi hat gaya
    const type = current === 1 ? "REMOVE" : "DEC";
    this.execute({ type, id, from: current, to: current - 1 });
  },

  remove(id) {
    const current = this.qty(id);
    if (current === 0) return;
    this.execute({ type: "REMOVE", id, from: current, to: 0 });
  },

  // ---------- core ----------

  execute(op) {
    op.time = Date.now();
    this.setQty(op.id, op.to);
    this.undoStack.push(op);
    if (this.undoStack.length > this.MAX_HISTORY) this.undoStack.shift();
    this.redoStack.length = 0; // naya kaam hua, redo wali history ab bekaar
    this.render();
  },

  undo() {
    const op = this.undoStack.pop();
    if (!op) return;
    this.setQty(op.id, op.from);
    this.redoStack.push(op);
    this.render();
    UI.toast(`Undo: ${this.describe(op)}`);
  },

  redo() {
    const op = this.redoStack.pop();
    if (!op) return;
    this.setQty(op.id, op.to);
    this.undoStack.push(op);
    this.render();
    UI.toast(`Redo: ${this.describe(op)}`);
  },

  setQty(id, qty) {
    if (qty <= 0) this.items.delete(id);
    else this.items.set(id, qty);
  },

  describe(op) {
    const name = this.productMap.get(op.id)?.name || op.id;
    switch (op.type) {
      case "ADD":
        return `Added ${name}`;
      case "REMOVE":
        return `Removed ${name}`;
      case "INC":
        return `${name} qty ${op.from} → ${op.to}`;
      case "DEC":
        return `${name} qty ${op.from} → ${op.to}`;
      default:
        return name;
    }
  },

  totals() {
    let count = 0;
    let amount = 0;
    for (const [id, qty] of this.items) {
      const p = this.productMap.get(id);
      if (!p) continue;
      count += qty;
      amount += p.price * qty;
    }
    return { count, amount };
  },

  // ---------- drawer ----------

  open() {
    this.els.drawer.classList.add("open");
    this.els.drawer.setAttribute("aria-hidden", "false");
    this.els.overlay.hidden = false;
    document.body.classList.add("no-scroll");
  },

  close() {
    this.els.drawer.classList.remove("open");
    this.els.drawer.setAttribute("aria-hidden", "true");
    this.els.overlay.hidden = true;
    document.body.classList.remove("no-scroll");
  },

  isOpen() {
    return this.els.drawer.classList.contains("open");
  },

  // ---------- render ----------

  render() {
    const { list, count, total, badge, undo, redo } = this.els;
    const t = this.totals();

    count.textContent = t.count;
    total.textContent = UI.price(t.amount);
    badge.textContent = t.count;
    badge.classList.toggle("pop", t.count > 0);

    undo.disabled = this.undoStack.length === 0;
    redo.disabled = this.redoStack.length === 0;

    if (this.items.size === 0) {
      list.innerHTML = UI.emptyState("🛒", "Your cart is empty", "Add some products and they will show up here.");
    } else {
      list.innerHTML = [...this.items]
        .map(([id, qty]) => {
          const p = this.productMap.get(id);
          const atMax = qty >= p.stock;
          return `
            <div class="cart-row">
              <div class="cart-info">
                <b>${UI.esc(p.name)}</b>
                <span class="muted small">${UI.price(p.price)} each</span>
              </div>
              <div class="qty">
                <button data-action="dec" data-id="${UI.esc(id)}" aria-label="Decrease">−</button>
                <span>${qty}</span>
                <button data-action="inc" data-id="${UI.esc(id)}" aria-label="Increase" ${atMax ? "disabled" : ""}>+</button>
              </div>
              <b class="line-total">${UI.price(p.price * qty)}</b>
              <button class="icon-btn danger" data-action="remove" data-id="${UI.esc(id)}" aria-label="Remove">🗑</button>
            </div>`;
        })
        .join("");
    }

    this.renderHistory();
  },

  // follow-up: operation history
  renderHistory() {
    const done = [...this.undoStack].reverse().slice(0, 8);
    const undone = [...this.redoStack].reverse().slice(0, 4);

    if (done.length === 0 && undone.length === 0) {
      this.els.history.innerHTML = `<li class="muted small">No operations yet</li>`;
      return;
    }

    // undone waale upar grey me — taaki pata chale redo se kya wapas aayega
    this.els.history.innerHTML =
      undone.map((op) => `<li class="undone">↺ ${UI.esc(this.describe(op))}</li>`).join("") +
      done.map((op) => `<li>✓ ${UI.esc(this.describe(op))}</li>`).join("");
  },
};
