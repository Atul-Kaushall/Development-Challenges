# Challenge 4 — Undo / Redo Cart

Plain HTML + CSS + JavaScript. Koi framework ya library nahi. Data `js/data.js` se aata hai.

## Kaise chalayein

`index.html` browser me khol do. Ya local server:

```bash
python3 -m http.server 8000
```

## Files

```
challenge-04-undo-redo-cart/
├── index.html
├── css/style.css
└── js/
    ├── app.js
    ├── data.js
    ├── products.js
    ├── ui.js
    └── features/cart.js   ← main logic yahan hai
```

## Complexity Analysis

**Initial Approach:** har action ke baad poore cart ka snapshot save karo.
- Time Complexity: `O(c)` per action (c = cart me items)
- Space Complexity: `O(h × c)` (h = history length)

**Optimized Approach:** sirf change save karo — `{ type, id, from, to }`.
Do stacks: `undoStack` aur `redoStack`. Undo = quantity `from` pe wapas, Redo = `to` pe.
Naya action aane pe redo stack clear.
- Time Complexity: add / remove / undo / redo sab `O(1)`
- Space Complexity: `O(h)` (max 50 operations rakhe hain)

Extra: Ctrl+Z / Ctrl+Y shortcuts, stock se zyada add nahi hota, buttons disable hote hain jab
undo/redo ke liye kuch na ho.

## Branch

`feature/challenge-04`
