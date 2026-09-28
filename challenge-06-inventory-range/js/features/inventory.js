/*
 * Challenge 6 — Inventory Range Dashboard
 * ----------------------------------------
 * Inventory value = price × stock
 *
 * Initial Approach:
 *   Har query pe saare products loop karo, range me hai to value add karo.
 *   Time Complexity:  O(n) per query
 *   Space Complexity: O(1)
 *   Slider drag karte waqt ye har pixel pe chalega — n bada hua to lag karega.
 *
 * Optimized Approach (Sorting + Prefix Sum):
 *   Preprocess (sirf ek baar):
 *     1. products ko price se sort karo              → O(n log n)
 *     2. prefixValue[i+1] = prefixValue[i] + price*stock
 *        prefixUnits[i+1] = prefixUnits[i] + stock   → O(n)
 *   Query [min, max]:
 *     lo = lowerBound(min), hi = upperBound(max)      → O(log n)
 *     count = hi - lo
 *     value = prefixValue[hi] - prefixValue[lo]       → O(1)
 *   Time Complexity:  O(log n) per query (summary ke liye)
 *                     list dikhani ho to + O(m), m = matching products
 *   Space Complexity: O(n) prefix arrays
 *
 * Note: agar stock/price baar baar badalte (live updates) to prefix sum har baar
 * rebuild karna padega — tab Fenwick tree / segment tree better hoga. Yahan data
 * static hai isliye prefix sum kaafi hai.
 */

const Inventory = {
  sorted: [],
  prefixValue: [0],
  prefixUnits: [0],
  STEP: 500,

  init(products) {
    this.build(products);

    this.els = {
      form: document.getElementById("invForm"),
      min: document.getElementById("invMin"),
      max: document.getElementById("invMax"),
      sMin: document.getElementById("sliderMin"),
      sMax: document.getElementById("sliderMax"),
      fill: document.getElementById("dualFill"),
      sMinLabel: document.getElementById("sliderMinLabel"),
      sMaxLabel: document.getElementById("sliderMaxLabel"),
      error: document.getElementById("invError"),
      count: document.getElementById("invCount"),
      units: document.getElementById("invUnits"),
      value: document.getElementById("invValue"),
      table: document.getElementById("invTable"),
    };

    // slider ki max limit = sabse mehenga product, 5000 ke multiple tak round up
    const top = this.sorted.length ? this.sorted[this.sorted.length - 1].price : 0;
    this.sliderMax = Math.max(5000, Math.ceil(top / 5000) * 5000);

    [this.els.sMin, this.els.sMax].forEach((s) => {
      s.min = 0;
      s.max = this.sliderMax;
      s.step = this.STEP;
    });

    this.els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.fromInputs();
    });

    // slider move → turant result (rAF se throttle, warna har event pe render hota)
    let pending = false;
    const onSlide = (which) => {
      let a = Number(this.els.sMin.value);
      let b = Number(this.els.sMax.value);
      // thumbs ek dusre ko cross na kare
      if (a > b) {
        if (which === "min") a = b;
        else b = a;
        this.els.sMin.value = a;
        this.els.sMax.value = b;
      }
      this.els.min.value = a;
      this.els.max.value = b;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        this.update(Number(this.els.sMin.value), Number(this.els.sMax.value));
      });
    };
    this.els.sMin.addEventListener("input", () => onSlide("min"));
    this.els.sMax.addEventListener("input", () => onSlide("max"));

    this.fromInputs(); // default 5000–20000 dikhado
  },

  build(products) {
    this.sorted = [...products].sort((a, b) => a.price - b.price);
    this.prefixValue = [0];
    this.prefixUnits = [0];
    for (let i = 0; i < this.sorted.length; i++) {
      const p = this.sorted[i];
      const stock = Math.max(0, p.stock || 0);
      this.prefixValue.push(this.prefixValue[i] + p.price * stock);
      this.prefixUnits.push(this.prefixUnits[i] + stock);
    }
  },

  // pure function — sirf numbers, DOM nahi
  query(min, max) {
    const lo = lowerBound(this.sorted, min, (p) => p.price);
    const hi = upperBound(this.sorted, max, (p) => p.price);
    if (hi <= lo) return { lo, hi, count: 0, units: 0, value: 0 };
    return {
      lo,
      hi,
      count: hi - lo,
      units: this.prefixUnits[hi] - this.prefixUnits[lo],
      value: this.prefixValue[hi] - this.prefixValue[lo],
    };
  },

  fromInputs() {
    const { min, max, error } = this.els;
    error.textContent = "";
    const a = readNumber(min);
    const b = readNumber(max);

    if (a === null || b === null) {
      error.textContent = "Please enter both a minimum and a maximum price.";
      return;
    }
    if (a < 0 || b < 0) {
      error.textContent = "Price cannot be negative.";
      return;
    }
    if (a > b) {
      error.textContent = "Minimum price cannot be greater than maximum price.";
      return;
    }

    // slider ko bhi sync karo (range ke bahar ho to clamp ho jaayega, query pe asar nahi)
    this.els.sMin.value = Math.min(a, this.sliderMax);
    this.els.sMax.value = Math.min(b, this.sliderMax);
    this.update(a, b);
  },

  update(min, max) {
    const r = this.query(min, max);

    this.els.count.textContent = r.count;
    this.els.units.textContent = r.units.toLocaleString("en-IN");
    this.els.value.textContent = UI.price(r.value);
    this.els.error.textContent = "";

    this.paintSlider(min, max);

    if (r.count === 0) {
      this.els.table.innerHTML = `<tr><td colspan="4">${UI.emptyState("📭", "No products in this range")}</td></tr>`;
      return;
    }

    // yahan O(m) lagta hai, par wo to dikhane ki cost hai
    const rows = [];
    for (let i = r.lo; i < r.hi; i++) {
      const p = this.sorted[i];
      const low = p.stock <= 5;
      rows.push(`
        <tr>
          <td>
            <button class="link-btn" data-view="${UI.esc(p.id)}">${UI.esc(p.name)}</button>
            <div class="muted small">${UI.esc(p.subcategory)}</div>
          </td>
          <td class="num">${UI.price(p.price)}</td>
          <td class="num ${low ? "warn" : ""}">${p.stock}${low ? " ⚠" : ""}</td>
          <td class="num">${UI.price(p.price * p.stock)}</td>
        </tr>`);
    }
    this.els.table.innerHTML = rows.join("");
  },

  paintSlider(min, max) {
    const clamp = (v) => Math.max(0, Math.min(this.sliderMax, v));
    const left = (clamp(min) / this.sliderMax) * 100;
    const right = (clamp(max) / this.sliderMax) * 100;
    this.els.fill.style.left = left + "%";
    this.els.fill.style.width = Math.max(0, right - left) + "%";
    this.els.sMinLabel.textContent = UI.price(min);
    this.els.sMaxLabel.textContent = UI.price(max);
  },
};
