# Challenge 8 — Smart Delivery Route

Plain HTML + CSS + JavaScript. Koi framework ya library nahi. Data `js/data.js` se aata hai.

## Kaise chalayein

`index.html` browser me khol do. Ya local server:

```bash
python3 -m http.server 8000
```

## Files

```
challenge-08-delivery-route/
├── index.html
├── css/style.css
└── js/
    ├── app.js
    ├── data.js
    ├── ui.js
    └── features/delivery.js   ← main logic yahan hai
```

## Complexity Analysis

**Initial Approach:** DFS se saare paths try karo, sabse chhota lo.
- Time Complexity: exponential (`O(V!)` worst case)
- Space Complexity: `O(V)`

**Optimized Approach:** Dijkstra + khud ka likha **Min Heap**, target milte hi early exit.
- Time Complexity: `O((V + E) log V)`
- Space Complexity: `O(V + E)`

**Traffic follow-up:** har road pe traffic factor (`delivery.js` me `TRAFFIC` object — data.js
ko change nahi kiya). "Fastest" mode me weight = `distance × traffic × 2 min/km`.
Algorithm wahi hai, bas weight function badla. Example: Main Warehouse → Knowledge Park
shortest route Pari Chowk se hai (8 km), par Pari Chowk pe jam hai to fastest route
Sector 18 se nikalta hai (14 km, phir bhi jaldi).

## Branch

`feature/challenge-08`
