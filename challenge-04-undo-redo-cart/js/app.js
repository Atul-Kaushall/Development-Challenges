// Challenge 4 ka entry point — products + cart drawer.

const App = {
  products: [],
  productMap: new Map(),

  init() {
    this.products = flattenProducts(typeof storeData !== "undefined" ? storeData : null);
    this.products.forEach((p) => this.productMap.set(p.id, p));
    document.getElementById("storeName").textContent =
      (typeof storeData !== "undefined" && storeData.storeName) || "Store";

    UI.cartEnabled = true; // is page pe "Add to cart" buttons chahiye
    Cart.init(this.productMap);
    UI.renderCatalog(document.getElementById("catTabs"), document.getElementById("catalogGrid"), this.products);
    this.bindEvents();
  },

  bindEvents() {
    document.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn && !addBtn.disabled) {
        Cart.add(addBtn.dataset.add);
        return;
      }
      const viewBtn = e.target.closest("[data-view]");
      if (viewBtn) {
        const p = this.productMap.get(viewBtn.dataset.view);
        if (p) UI.openProductModal(p);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!document.getElementById("productModal").hidden) UI.closeProductModal();
      else if (Cart.isOpen()) Cart.close();
    });

    const modal = document.getElementById("productModal");
    document.getElementById("closeModal").addEventListener("click", () => UI.closeProductModal());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) UI.closeProductModal(); // bahar click = band
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
