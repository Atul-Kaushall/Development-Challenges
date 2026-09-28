/*
 * Challenge 1 — Smart Price Finder
 * ---------------------------------
 * Initial Approach:
 *   Har search pe saare products ghoomo, |price - target| nikaalo, us hisaab se sort karo,
 *   top k utha lo.
 *   Time Complexity:  O(n log n) per search
 *   Space Complexity: O(n)
 *
 * Optimized Approach:
 *   Products ko ek hi baar price se sort karke rakh lo (init me).
 *   Search pe binary search se wo jagah dhoondo jahan target fit hoga (lower bound).
 *   Closest products usi jagah ke aas-paas honge — to left aur right do pointer
 *   chalao, jo zyada paas ho usko lo, k baar.
 *   Time Complexity:  O(n log n) sirf ek baar, phir har search O(log n + k)
 *   Space Complexity: O(n) sorted copy ke liye
 *
 * Follow-up (range [min, max]):
 *   lowerBound(min) se start, upperBound(max) pe end. Beech ka slice hi answer hai.
 *   Time Complexity:  O(log n + m), m = matching products
 *   Space Complexity: O(m) result ke liye
 */

const PriceFinder = {
  sorted: [],

  init(products) {
    // original array ko mutate nahi karna, isliye copy
    this.sorted = [...products].sort((a, b) => a.price - b.price);

    this.els = {
      form: document.getElementById("priceForm"),
      target: document.getElementById("targetPrice"),
      count: document.getElementById("closestCount"),
      error: document.getElementById("priceError"),
      results: document.getElementById("closestResults"),
      chips: document.getElementById("priceChips"),
      rangeForm: document.getElementById("rangeForm"),
      min: document.getElementById("rangeMin"),
      max: document.getElementById("rangeMax"),
      rangeError: document.getElementById("rangeError"),
      rangeMeta: document.getElementById("rangeMeta"),
      rangeResults: document.getElementById("rangeResults"),
    };

    this.els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleClosestSearch();
    });

    // result dikh rahe hon to dropdown badalte hi refresh
    this.els.count.addEventListener("change", () => {
      if (this.els.target.value !== "") this.handleClosestSearch();
    });

    this.els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-price]");
      if (!btn) return;
      this.els.target.value = btn.dataset.price;
      this.handleClosestSearch();
    });

    this.els.rangeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleRangeSearch();
    });

    this.els.results.innerHTML = UI.emptyState("🔎", "Enter your budget", "e.g. 70000, then hit Search");
  },

  // ---------- pure logic (DOM se koi lena-dena nahi) ----------

  findClosest(target, k) {
    const arr = this.sorted;
    const n = arr.length;
    const result = [];
    if (n === 0 || k <= 0) return result;

    let right = lowerBound(arr, target, (p) => p.price); // pehla product jo >= target
    let left = right - 1; // uske just pehle wala (< target)

    while (result.length < k && (left >= 0 || right < n)) {
      if (left < 0) {
        result.push(arr[right++]);
      } else if (right >= n) {
        result.push(arr[left--]);
      } else {
        const leftGap = target - arr[left].price;
        const rightGap = arr[right].price - target;
        // tie ho to sasta wala pehle — customer khush rahega :)
        if (leftGap <= rightGap) result.push(arr[left--]);
        else result.push(arr[right++]);
      }
    }
    return result;
  },

  findInRange(min, max) {
    const start = lowerBound(this.sorted, min, (p) => p.price);
    const end = upperBound(this.sorted, max, (p) => p.price);
    return this.sorted.slice(start, end);
  },

  // ---------- UI handlers ----------

  handleClosestSearch() {
    const { target, count, error, results } = this.els;
    const value = readNumber(target);
    error.textContent = "";

    if (value === null) {
      error.textContent = "Please enter a valid price.";
      results.innerHTML = "";
      return;
    }
    if (value < 0) {
      error.textContent = "Price cannot be negative.";
      results.innerHTML = "";
      return;
    }

    const k = parseInt(count.value, 10) || 3;
    const found = this.findClosest(value, k);

    if (found.length === 0) {
      results.innerHTML = UI.emptyState("📦", "No products found");
      return;
    }

    const best = found[0];
    // dikhane ke liye price order me — padhne me easy lagta hai
    const display = [...found].sort((a, b) => a.price - b.price);

    results.innerHTML = display
      .map((p) => {
        const diff = p.price - value;
        let note;
        if (diff === 0) note = "Exact match!";
        else if (diff > 0) note = `${UI.price(diff)} above your budget`;
        else note = `${UI.price(-diff)} under your budget`;
        return UI.productCard(p, { badge: p === best ? "Best match" : "", note });
      })
      .join("");
  },

  handleRangeSearch() {
    const { min, max, rangeError, rangeMeta, rangeResults } = this.els;
    rangeError.textContent = "";
    rangeMeta.textContent = "";

    let lo = readNumber(min);
    let hi = readNumber(max);

    // ek khaali chhoda to usko open-ended maan lete hain
    if (lo === null && hi === null) {
      rangeError.textContent = "Please enter at least one value (min or max).";
      rangeResults.innerHTML = "";
      return;
    }
    if (lo === null) lo = 0;
    if (hi === null) hi = Infinity;

    if (lo < 0 || hi < 0) {
      rangeError.textContent = "Negative prices are not allowed.";
      rangeResults.innerHTML = "";
      return;
    }
    if (lo > hi) {
      rangeError.textContent = "Minimum price cannot be greater than maximum price.";
      rangeResults.innerHTML = "";
      return;
    }

    const list = this.findInRange(lo, hi);
    const hiLabel = hi === Infinity ? "∞" : UI.price(hi);
    rangeMeta.textContent = `${list.length} product${list.length === 1 ? "" : "s"} between ${UI.price(lo)} and ${hiLabel}`;

    rangeResults.innerHTML = list.length
      ? list.map((p) => UI.productCard(p)).join("")
      : UI.emptyState("🤷", "Nothing in this range", "Try widening the range");
  },
};
