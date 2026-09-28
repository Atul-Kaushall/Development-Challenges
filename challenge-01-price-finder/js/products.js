// Nested data (categories → subcategories → products) ko ek flat list me badalna.

/**
 * storeData nested hai: categories → subcategories → products.
 * Features ko ek flat list chahiye, to yahan ek baar flatten kar dete hain.
 * Missing / kharab data waale products ko skip karte hain taaki aage crash na ho.
 * O(n)
 */
function flattenProducts(data) {
  const out = [];
  const seen = new Set();

  (data?.categories || []).forEach((cat) => {
    (cat?.subcategories || []).forEach((sub) => {
      (sub?.products || []).forEach((p) => {
        if (!p || !p.id || !p.name) return;
        if (seen.has(p.id)) return; // duplicate id — pehla wala rakho
        const price = Number(p.price);
        if (!Number.isFinite(price) || price < 0) {
          console.warn("Invalid price, skipping:", p.id);
          return;
        }
        seen.add(p.id);
        out.push({
          ...p,
          price,
          stock: Math.max(0, Number(p.stock) || 0),
          rating: Number(p.rating) || 0,
          reviews: Number(p.reviews) || 0,
          tags: Array.isArray(p.tags) ? p.tags : [],
          category: p.category || cat.name,
          subcategory: p.subcategory || sub.name,
        });
      });
    });
  });

  return out;
}
