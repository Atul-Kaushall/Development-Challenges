// UI helpers — sirf DOM / HTML banane ka kaam. Koi business logic yahan nahi.

const UI = {
  // cart sirf Challenge 4 me hai — baaki pages pe "Add to cart" button dikhana hi nahi
  cartEnabled: false,

  // ₹1,14,999 wala Indian format
  price(n) {
    return "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
  },

  // data file se aa raha hai phir bhi escape kar dete hain, safe side
  esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  stars(rating) {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.round(r);
    return "★".repeat(full) + "☆".repeat(5 - full);
  },

  discount(p) {
    if (!p.originalPrice || p.originalPrice <= p.price) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  },

  emptyState(icon, title, sub = "") {
    return `
      <div class="empty">
        <div class="empty-icon">${icon}</div>
        <p><b>${this.esc(title)}</b></p>
        ${sub ? `<p class="muted small">${this.esc(sub)}</p>` : ""}
      </div>`;
  },

  /**
   * Product card — price finder aur baaki jagah same card use hota hai.
   * opts.badge => card ke upar chhota label (jaise "Best match")
   * opts.note  => price ke niche extra line
   */
  productCard(p, opts = {}) {
    const off = this.discount(p);
    return `
      <article class="card">
        <div class="card-top">
          <span class="chip">${this.esc(p.subcategory || p.category)}</span>
          ${opts.badge ? `<span class="chip chip-accent">${this.esc(opts.badge)}</span>` : ""}
        </div>
        <h3 class="card-title">${this.esc(p.name)}</h3>
        <p class="muted small">${this.esc(p.brand || "Unknown brand")}</p>
        <div class="rating">
          <span class="stars">${this.stars(p.rating)}</span>
          <span>${p.rating || "–"}</span>
          <span class="muted small">(${(p.reviews || 0).toLocaleString("en-IN")})</span>
        </div>
        <div class="price-row">
          <b class="price">${this.price(p.price)}</b>
          ${off ? `<s class="muted small">${this.price(p.originalPrice)}</s><span class="off">${off}% off</span>` : ""}
        </div>
        ${opts.note ? `<p class="small note">${this.esc(opts.note)}</p>` : ""}
        <div class="card-actions">
          <button class="btn btn-outline btn-sm" data-view="${this.esc(p.id)}">View Product</button>
          ${this.addButton(p, "btn-sm")}
        </div>
      </article>`;
  },

  addButton(p, extraClass = "") {
    if (!this.cartEnabled) return "";
    return `<button class="btn ${extraClass}" data-add="${this.esc(p.id)}" ${p.stock > 0 ? "" : "disabled"}>
      ${p.stock > 0 ? "Add to cart" : "Out of stock"}
    </button>`;
  },

  /**
   * Catalog — category tabs + product grid.
   * Challenge 3 aur 4 me products dikhane ke liye (wahan search wala section nahi hai).
   */
  renderCatalog(tabsEl, gridEl, products) {
    const cats = ["All", ...new Set(products.map((p) => p.category))];
    let active = "All";

    const draw = () => {
      tabsEl.innerHTML = cats
        .map((c) => `<button type="button" class="${c === active ? "active" : ""}" data-cat="${this.esc(c)}">${this.esc(c)}</button>`)
        .join("");
      const list = active === "All" ? products : products.filter((p) => p.category === active);
      gridEl.innerHTML = list.length
        ? list.map((p) => this.productCard(p)).join("")
        : this.emptyState("📦", "No products available");
    };

    tabsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      active = btn.dataset.cat;
      draw();
    });
    draw();
  },

  // ---------- modal ----------
  openProductModal(p) {
    const modal = document.getElementById("productModal");
    const body = document.getElementById("modalBody");
    const specs = Object.entries(p.specifications || {});
    const off = this.discount(p);

    body.innerHTML = `
      <span class="chip">${this.esc(p.category)} / ${this.esc(p.subcategory)}</span>
      <h2 id="modalTitle">${this.esc(p.name)}</h2>
      <p class="muted">by ${this.esc(p.brand || "Unknown")}</p>

      <div class="rating">
        <span class="stars">${this.stars(p.rating)}</span>
        <span>${p.rating || "–"}</span>
        <span class="muted small">${(p.reviews || 0).toLocaleString("en-IN")} reviews</span>
      </div>

      <div class="price-row big">
        <b class="price">${this.price(p.price)}</b>
        ${off ? `<s class="muted">${this.price(p.originalPrice)}</s><span class="off">${off}% off</span>` : ""}
      </div>

      <p class="small ${p.stock > 5 ? "ok" : "warn"}">
        ${p.stock > 0 ? `${p.stock} in stock${p.stock <= 5 ? " — only a few left!" : ""}` : "Out of stock"}
      </p>

      ${
        specs.length
          ? `<table class="spec-table">${specs
              .map(([k, v]) => `<tr><th>${this.esc(this.prettyKey(k))}</th><td>${this.esc(v)}</td></tr>`)
              .join("")}</table>`
          : ""
      }

      <div class="tags">${(p.tags || []).map((t) => `<span>#${this.esc(t)}</span>`).join("")}</div>

      ${this.addButton(p, "btn-block")}`;

    modal.hidden = false;
    document.body.classList.add("no-scroll");
    document.getElementById("closeModal").focus();
  },

  closeProductModal() {
    document.getElementById("productModal").hidden = true;
    document.body.classList.remove("no-scroll");
  },

  // operatingSystem -> Operating System
  prettyKey(k) {
    return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  },

  // ---------- toast ----------
  _toastTimer: null,
  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  },
};
