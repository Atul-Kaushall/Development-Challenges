# Challenge 1 — Smart Price Finder

Plain HTML + CSS + JavaScript. Koi framework ya library nahi. Data `js/data.js` se aata hai.

## Kaise chalayein

`index.html` browser me khol do. Ya local server:

```bash
python3 -m http.server 8000
```

## Files

```
challenge-01-price-finder/
├── index.html
├── css/style.css
└── js/
    ├── app.js
    ├── data.js
    ├── products.js
    ├── ui.js
    ├── utils.js
    └── features/priceFinder.js   ← main logic yahan hai
```

## Complexity Analysis

**Initial Approach:** har search pe saare products ka `|price - target|` nikaalo, sort karo, top k lo.
- Time Complexity: `O(n log n)` per search
- Space Complexity: `O(n)`

**Optimized Approach:** products ko ek baar price se sort karke rakha. Search pe binary search
(lower bound) se target ki position nikaali, phir left/right do pointer se k closest uthaye.
- Time Complexity: `O(n log n)` ek baar preprocessing, fir har search `O(log n + k)`
- Space Complexity: `O(n)`

**Range follow-up:** `lowerBound(min)` se `upperBound(max)` tak ka slice.
- Time: `O(log n + m)`, Space: `O(m)`

## Branch

`feature/challenge-01`
