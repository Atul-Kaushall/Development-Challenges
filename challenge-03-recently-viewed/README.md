# Challenge 3 — Recently Viewed

Plain HTML + CSS + JavaScript. Koi framework ya library nahi. Data `js/data.js` se aata hai.

## Kaise chalayein

`index.html` browser me khol do. Ya local server:

```bash
python3 -m http.server 8000
```

## Files

```
challenge-03-recently-viewed/
├── index.html
├── css/style.css
└── js/
    ├── app.js
    ├── data.js
    ├── products.js
    ├── ui.js
    ├── utils.js
    └── features/recentlyViewed.js   ← main logic yahan hai
```

## Complexity Analysis

**Initial Approach:** array + `indexOf` + `splice` + `unshift`.
- Time Complexity: `O(k)` per view
- Space Complexity: `O(k)`

**Optimized Approach:** JS `Map` (insertion order maintain karta hai) — LRU cache jaisa.
Dobara view → `delete` + `set` se product end (latest) pe chala jaata hai.
6th product aaya → `map.keys().next().value` sabse purana hai, usko hata do.
- Time Complexity: `O(1)` per view, render `O(k)`
- Space Complexity: `O(k)` (k = 5)

History `localStorage` me save hoti hai, refresh ke baad bhi rehti hai.

## Branch

`feature/challenge-03`
