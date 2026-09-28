// localStorage kabhi kabhi throw karta hai (private mode etc.), isliye wrap kar diya
const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* koi baat nahi, bas save nahi hoga */
    }
  },
};
