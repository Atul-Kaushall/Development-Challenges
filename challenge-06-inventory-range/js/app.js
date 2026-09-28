// Challenge 6 ka entry point — data load karo, inventory dashboard start karo.

const App = {
  products: [],
  productMap: new Map(),

  init() {
    this.products = flattenProducts(typeof storeData !== "undefined" ? storeData : null);
    this.products.forEach((p) => this.productMap.set(p.id, p));
    document.getElementById("storeName").textContent =
      (typeof storeData !== "undefined" && storeData.storeName) || "Store";

    Inventory.init(this.products);
    this.bindEvents();
  },

  bindEvents() {
    // table me product naam pe click → details
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
