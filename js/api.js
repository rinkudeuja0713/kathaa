// js/api.js
const API_BASE = 'http://localhost:5000/api';

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
  const res = await fetch(`${API_BASE}/posts/user/${userId}`);
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
  const res = await fetch(`${API_BASE}/moods/user/${userId}`);
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