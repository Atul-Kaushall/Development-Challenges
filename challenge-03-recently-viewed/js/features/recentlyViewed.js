/*
 * Challenge 3 — Recently Viewed Products
 * ---------------------------------------
 * Basically ye ek chhota LRU cache hai.
 *
 * Initial Approach:
 *   Ek array rakho. Naya product view hua to indexOf se check karo already hai kya,
 *   hai to splice se nikaalo, phir unshift se aage daalo.
 *   Time Complexity:  O(k) per view (indexOf + splice + unshift sab linear hain)
 *   Space Complexity: O(k)
 *
 * Optimized Approach:
 *   JS ka Map insertion order yaad rakhta hai — yahi trick hai.
 *   - lookup:  map.has(id)                 → O(1)
 *   - "move to latest": map.delete + map.set → O(1), entry end me chali jaati hai
 *   - limit cross hua: map.keys().next()    → sabse purana, O(1) me delete
 *   Map ke end me latest hai, to render karte time ulta padhte hain.
 *   Time Complexity:  O(1) per view, render O(k)
 *   Space Complexity: O(k), yahan k = 5
 *
 * Follow-up: 6th product aaya to sabse purana (least recently viewed) nikal jaata hai.
 */

const RecentlyViewed = {
  LIMIT: 5,
  STORAGE_KEY: "pe_recently_viewed",
  history: new Map(), // productId -> viewedAt timestamp
  productMap: null,

  init(productMap) {
    this.productMap = productMap;
    this.listEl = document.getElementById("recentList");

    // refresh ke baad bhi history rahe
    const saved = storage.get(this.STORAGE_KEY, []);
    if (Array.isArray(saved)) {
      saved.forEach(([id, time]) => {
        // data.js se product hat gaya ho to ignore
        if (this.productMap.has(id)) this.history.set(id, time);
      });
      this.trim();
    }

    document.getElementById("clearHistory").addEventListener("click", () => this.clear());

    this.listEl.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-remove-recent]");
      if (rm) {
        e.stopPropagation();
        this.remove(rm.dataset.removeRecent);
      }
    });

    this.render();
  },

  add(id) {
    if (!this.productMap.has(id)) return;

    // already hai? to hata ke phir se daalo — automatically latest ban jaayega
    if (this.history.has(id)) this.history.delete(id);
    this.history.set(id, Date.now());

    this.trim();
    this.save();
    this.render();
  },

  // limit se zyada ho gaye to purane waale uda do
  trim() {
    while (this.history.size > this.LIMIT) {
      const oldest = this.history.keys().next().value;
      this.history.delete(oldest);
    }
  },

  remove(id) {
    this.history.delete(id);
    this.save();
    this.render();
  },

  clear() {
    if (this.history.size === 0) return;
    this.history.clear();
    this.save();
    this.render();
    UI.toast("History cleared");
  },

  save() {
    storage.set(this.STORAGE_KEY, [...this.history.entries()]);
  },

  // latest first
  getItems() {
    return [...this.history.entries()].reverse();
  },

  timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    return `${Math.floor(hr / 24)} day ago`;
  },

  render() {
    const items = this.getItems();
    document.getElementById("clearHistory").disabled = items.length === 0;

    if (items.length === 0) {
      this.listEl.innerHTML = UI.emptyState(
        "👀",
        "Nothing viewed yet",
        "Click \"View Product\" on any product and it will appear here."
      );
      return;
    }

    this.listEl.innerHTML = items
      .map(([id, ts], i) => {
        const p = this.productMap.get(id);
        return `
          <div class="mini-card" data-view="${UI.esc(id)}" role="button" tabindex="0">
            <button class="mini-remove" data-remove-recent="${UI.esc(id)}" aria-label="Remove ${UI.esc(p.name)}">✕</button>
            ${i === 0 ? `<span class="chip chip-accent">Latest</span>` : `<span class="chip">#${i + 1}</span>`}
            <b>${UI.esc(p.name)}</b>
            <span class="price">${UI.price(p.price)}</span>
            <span class="muted small">${this.timeAgo(ts)}</span>
          </div>`;
      })
      .join("");
  },
};
