import { login, signup, getProfile, switchPersona } from './api.js';

export const AUTH_USER_KEY = 'kathaa_user';
export const ANON_NAME_KEY = 'kathaa_anonymous_username';

export function getUserId() {
  const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY));
  return user ? user.email : null;
}

export function getUserRole() {
  const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY));
  return user ? user.role : 'storyteller';
}

export function isVerified() {
  const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY));
  return user ? user.is_verified : false;
}

export function getActivePersona() {
  const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY));
  return user ? user.active_persona : 'storyteller';
}

export async function handleLogin(email, password) {
  try {
    const data = await login(email, password);
    if (data.success) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return { success: true };
    }
    return { success: false, message: data.message };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, message: 'Connection error. Is the backend running?' };
  }
}

export async function handleSignup(userData) {
  try {
    const data = await signup(userData);
    return data;
  } catch (err) {
    console.error('Signup error:', err);
    return { success: false, message: 'Connection error. Is the backend running?' };
  }
}

/** Landing page URL from current path (same idea as auth-check `appHref` — avoids broken `/index.html` off site root). */
function landingPageHref() {
  const pathname = (window.location.pathname || '').replace(/\\/g, '/');
  if (pathname.includes('/pages/')) {
    return '../index.html';
  }
  return 'index.html';
}

export function logout() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(ANON_NAME_KEY);
  window.location.replace(landingPageHref());
}

export async function refreshProfile() {
  const email = getUserId();
  if (!email) return;

  try {
    const profile = await getProfile(email);
    if (profile && !profile.error) {
      const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY));
      const updatedUser = { ...user, ...profile };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    }
  } catch (err) {
    console.error('Profile refresh error:', err);
  }
}
