// Challenge 8 ka entry point — sirf delivery network chahiye, products nahi.

const App = {
  init() {
    document.getElementById("storeName").textContent =
      (typeof storeData !== "undefined" && storeData.storeName) || "Store";

    Delivery.init(typeof deliveryNetwork !== "undefined" ? deliveryNetwork : null);
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
