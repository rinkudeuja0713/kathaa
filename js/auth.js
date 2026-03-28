(function() {
  const ANON_ID_KEY = 'kathaa_anonymous_id';
  const USER_EMAIL_KEY = 'kathaa.user.email';
  const LOGGED_IN_KEY = 'kathaa.user.loggedIn';
  const API_BASE = 'http://127.0.0.1:5000/api/auth';

  function getOrCreateAnonId() {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = 'anon_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  }

  async function signup(email, password, role = 'storyteller', mentor_profile = null) {
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, mentor_profile })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Server error: ' + e.message };
    }
  }

  async function login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(USER_EMAIL_KEY, email);
        localStorage.setItem(LOGGED_IN_KEY, 'true');
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Server error: ' + e.message };
    }
  }

  async function getProfile() {
    const email = localStorage.getItem(USER_EMAIL_KEY);
    if (!email) return null;
    try {
      const res = await fetch(`${API_BASE}/profile?email=${email}`);
      if (res.ok) return await res.json();
    } catch (e) { console.warn('Profile fetch failed:', e); }
    return null;
  }

  async function switchPersona(persona) {
    const email = localStorage.getItem(USER_EMAIL_KEY);
    try {
      const res = await fetch(`${API_BASE}/switch-persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, persona })
      });
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
  }

  function logout() {
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
  }

  function isLoggedIn() {
    return localStorage.getItem(LOGGED_IN_KEY) === 'true';
  }

  window.kathaaAuth = {
    getUserId: getOrCreateAnonId,
    signup,
    login,
    logout,
    isLoggedIn,
    getProfile,
    switchPersona
  };
})();