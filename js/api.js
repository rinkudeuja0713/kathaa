// js/api.js
const API_BASE = 'http://127.0.0.1:5001/api';

export async function getPosts() {
  const res = await fetch(`${API_BASE}/posts`);
  return res.json();
}

export async function createPost(postData) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });
  return res.json();
}

export async function getPostsByTag(tag) {
  const res = await fetch(`${API_BASE}/posts/tag/${tag}`);
  return res.json();
}

export async function getUserPosts(userId) {
  const res = await fetch(`${API_BASE}/posts/user/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`getUserPosts failed: ${res.status}`);
  return res.json();
}

export async function getMoods() {
  const res = await fetch(`${API_BASE}/moods`);
  return res.json();
}

export async function createMood(moodData) {
  const res = await fetch(`${API_BASE}/moods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(moodData)
  });
  return res.json();
}

export async function getUserMoods(userId) {
  const res = await fetch(`${API_BASE}/moods/user/${encodeURIComponent(userId)}`);
  return res.json();
}

export async function getAISuggestion(text) {
  const res = await fetch(`${API_BASE}/ai/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return res.json();
}

/** Groups API **/
export async function getGroups() {
  const res = await fetch(`${API_BASE}/groups`);
  return res.json();
}

export async function getGroup(groupId) {
  const res = await fetch(`${API_BASE}/groups/${groupId}`);
  return res.json();
}

export async function joinGroup(groupId, userId) {
  const res = await fetch(`${API_BASE}/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId, userId })
  });
  return res.json();
}

/** Chautari API **/
export async function getChautariRooms(groupId) {
  const res = await fetch(`${API_BASE}/chautari/rooms/${groupId}`);
  return res.json();
}

export async function joinAudioRoom(roomId, userId, displayName) {
  const res = await fetch(`${API_BASE}/chautari/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, userId, displayName })
  });
  return res.json();
}

export async function rsvpMentorSession(sessionId, userId) {
  const res = await fetch(`${API_BASE}/chautari/sessions/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId })
  });
  return res.json();
}

/** Authentication API **/
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function signup(userData) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return res.json();
}

export async function getProfile(email) {
  const res = await fetch(`${API_BASE}/auth/profile?email=${encodeURIComponent(email)}`);
  return res.json();
}

export async function switchPersona(email, persona) {
  const res = await fetch(`${API_BASE}/auth/switch-persona`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, persona })
  });
  return res.json();
}

export async function verifyMentorAI(title, bio) {
  const res = await fetch(`${API_BASE}/ai/verify-mentor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, bio })
  });
  return res.json();
}