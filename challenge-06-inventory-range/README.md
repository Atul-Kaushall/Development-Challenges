# Challenge 6 — Inventory Range Dashboard

Plain HTML + CSS + JavaScript. Koi framework ya library nahi. Data `js/data.js` se aata hai.

## Kaise chalayein

`index.html` browser me khol do. Ya local server:

```bash
python3 -m http.server 8000
```

## Files

```
challenge-06-inventory-range/
├── index.html
├── css/style.css
└── js/
    ├── app.js
    ├── data.js
    ├── products.js
    ├── ui.js
    ├── utils.js
    └── features/inventory.js   ← main logic yahan hai
```

## Complexity Analysis

**Initial Approach:** har query pe saare products scan.
- Time Complexity: `O(n)` per query
- Space Complexity: `O(1)`

**Optimized Approach:** sort by price + **prefix sum** (value aur units dono ka).
Query me do binary search, fir `prefix[hi] - prefix[lo]`.
- Time Complexity: preprocessing `O(n log n)`, fir har query `O(log n)` (list dikhane ke liye `+ O(m)`)
- Space Complexity: `O(n)`

Slider drag karte waqt har movement pe query chalti hai, isliye ye optimization yahan sach me
kaam aata hai. `requestAnimationFrame` se render throttle bhi kiya hai.

> Agar stock baar baar update hota to Fenwick Tree better rehta (update bhi `O(log n)`).
> Yahan data static hai to prefix sum kaafi hai.

## Branch

`feature/challenge-06`
