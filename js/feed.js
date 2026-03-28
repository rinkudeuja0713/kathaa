import { apiGet, apiPost } from './api.js';

const feedEl = document.getElementById('feed');

export async function renderFeed() {
  if (!feedEl) return;
  feedEl.innerHTML = '<p>Loading posts…</p>';
  try {
    const posts = await apiGet('/posts/');
    if (!posts || posts.length === 0) {
      feedEl.innerHTML = '<p>No posts yet — be the first to share.</p>';
      return;
    }
    const html = posts
      .map(p => `\n      <article class="post">\n        <p>${escapeHtml(p.text)}</p>\n        <small>mood: ${escapeHtml(p.mood || '–')}</small>\n      </article>`) // simple
      .join('\n');
    feedEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    feedEl.innerHTML = '<p>Error loading posts.</p>';
  }
}

export async function submitPost(text, mood){
  return apiPost('/posts/', { text, mood });
}

function escapeHtml(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// auto-render if #feed exists on page
if(document.readyState === 'complete' || document.readyState === 'interactive'){
  renderFeed().catch(()=>{});
} else {
  window.addEventListener('DOMContentLoaded', ()=>{ renderFeed().catch(()=>{}); });
}
