// Challenge 3 ka entry point — catalog dikhao, jo product khule wo history me jaaye.

const App = {
  products: [],
  productMap: new Map(),

  init() {
    this.products = flattenProducts(typeof storeData !== "undefined" ? storeData : null);
    this.products.forEach((p) => this.productMap.set(p.id, p));
    document.getElementById("storeName").textContent =
      (typeof storeData !== "undefined" && storeData.storeName) || "Store";

    RecentlyViewed.init(this.productMap);
    UI.renderCatalog(document.getElementById("catTabs"), document.getElementById("catalogGrid"), this.products);
    this.bindEvents();
  },

  bindEvents() {
    // product kholna = history me daalna + modal dikhana
    const view = (id) => {
      const p = this.productMap.get(id);
      if (!p) return;
      RecentlyViewed.add(id);
      UI.openProductModal(p);
    };

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if (btn) view(btn.dataset.view);
    });

    // recently viewed cards div hain, keyboard se bhi khulne chahiye
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".mini-card[data-view]")) {
        e.preventDefault();
        view(e.target.dataset.view);
      }
      if (e.key === "Escape") UI.closeProductModal();
    });

    const modal = document.getElementById("productModal");
    document.getElementById("closeModal").addEventListener("click", () => UI.closeProductModal());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) UI.closeProductModal(); // bahar click = band
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
