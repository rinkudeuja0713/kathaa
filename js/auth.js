import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBO2bzjwUo52rYAtAxqA04i3F_a_IDQejE",
  authDomain: "kathaa-385a3.firebaseapp.com",
  projectId: "kathaa-385a3",
  storageBucket: "kathaa-385a3.firebasestorage.app",
  messagingSenderId: "52566990780",
  appId: "1:52566990780:web:e64147c95474885acbd5b9",
  measurementId: "G-TFZG6F1VZR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const AUTH_USER_KEY = 'kathaa_user';

const ANON_AVATARS = ['🪔', '🪷', '🌸', '🕊️', '✨', '🌙', '🌿', '💫', '🏔️', '🌊'];
const ADJ = ['Quiet', 'Gentle', 'Brave', 'Soft', 'Warm', 'Kind', 'Calm', 'Silent'];
const NOUN = ['River', 'Lotus', 'Light', 'Harbor', 'Star', 'Cloud', 'Bloom', 'Path'];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

function generateAnonIdentity(uid) {
  const h = hashString(uid);
  return {
    anon_avatar: ANON_AVATARS[h % ANON_AVATARS.length],
    anon_name: `${ADJ[(h >> 4) % ADJ.length]} ${NOUN[(h >> 8) % NOUN.length]}`
  };
}

/** Call after Firebase login to persist user metadata in localStorage */
export function persistUser(firebaseUser, extraData = {}) {
  const existing = getStoredUser() || {};
  const identity = generateAnonIdentity(firebaseUser.uid);
  const user = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    anon_avatar: existing.anon_avatar || identity.anon_avatar,
    anon_name: existing.anon_name || identity.anon_name,
    role: existing.role || 'storyteller',
    is_verified: existing.is_verified || false,
    active_persona: existing.active_persona || 'storyteller',
    ...extraData
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return user;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getUserId() {
  const user = getStoredUser();
  return user ? user.uid : null;
}

export function getUserRole() {
  const user = getStoredUser();
  return user ? user.role : 'storyteller';
}

export function isVerified() {
  const user = getStoredUser();
  return user ? user.is_verified : false;
}

export function getActivePersona() {
  const user = getStoredUser();
  return user ? user.active_persona : 'storyteller';
}

export function setActivePersona(persona) {
  const user = getStoredUser();
  if (user) {
    user.active_persona = persona;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function isLoggedIn() {
  return !!auth.currentUser && !!getStoredUser();
}

export function logout() {
  localStorage.removeItem(AUTH_USER_KEY);
  signOut(auth).finally(() => {
    const inPages = (window.location.pathname || '').includes('/pages/');
    window.location.replace(inPages ? '../home.html' : 'home.html');
  });
}

export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
