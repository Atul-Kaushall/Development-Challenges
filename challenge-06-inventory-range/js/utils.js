// Binary search helpers — price wale queries ke liye.

/**
 * Pehla index jiska value >= target ho.
 * Agar sab chhote hain to arr.length return hoga.
 * O(log n)
 */
function lowerBound(arr, target, getValue = (x) => x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1; // >>> 1 = floor(/2), bas thoda shortcut
    if (getValue(arr[mid]) < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Pehla index jiska value > target ho (strictly greater).
 * Range [min, max] ke liye: lowerBound(min) ... upperBound(max) - 1
 */
function upperBound(arr, target, getValue = (x) => x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (getValue(arr[mid]) <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// input box se number nikaalna — khaali ya galat ho to null
function readNumber(input) {
  const raw = String(input.value).trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
