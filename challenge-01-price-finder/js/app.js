// Challenge 1 ka entry point — data load karo, Price Finder start karo.

const App = {
  products: [],
  productMap: new Map(),

  init() {
    this.products = flattenProducts(typeof storeData !== "undefined" ? storeData : null);
    this.products.forEach((p) => this.productMap.set(p.id, p));
    document.getElementById("storeName").textContent =
      (typeof storeData !== "undefined" && storeData.storeName) || "Store";

    PriceFinder.init(this.products);
    this.bindEvents();
  },

  bindEvents() {
    // result cards ke "View Product" buttons — ek hi listener
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if (!btn) return;
      const p = this.productMap.get(btn.dataset.view);
      if (p) UI.openProductModal(p);
    });

    document.addEventListener("keydown", (e) => {
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
