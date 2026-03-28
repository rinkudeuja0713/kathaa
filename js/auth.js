(function() {
  const ANON_ID_KEY = 'kathaa_anonymous_id';
  const USER_KEY = 'kathaa_user';

  function getOrCreateAnonId() {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = 'anon_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  }

  // Mock user database (stored in localStorage)
  const USERS_KEY = 'kathaa_users';
  function getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  }
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function signup(email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Email already exists.' };
    }
    users.push({ email, password });
    saveUsers(users);
    localStorage.setItem(USER_KEY, JSON.stringify({ email }));
    return { success: true, message: 'Account created.' };
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }
    localStorage.setItem(USER_KEY, JSON.stringify({ email }));
    return { success: true, message: 'Logged in.' };
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return localStorage.getItem(USER_KEY) !== null;
  }

  function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  function resetPassword(email) {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      return { success: false, message: 'Email not found.' };
    }
    return { success: true, message: 'If the email exists, a reset link has been sent.' };
  }

  window.kathaaAuth = {
    getUserId: getOrCreateAnonId,    // <-- this is the function we need
    isAnonymous: true,
    signup,
    login,
    logout,
    isLoggedIn,
    getCurrentUser,
    resetPassword
  };
})();