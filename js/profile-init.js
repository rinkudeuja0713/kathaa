import { getUserId, refreshProfile } from './auth.js';
import { getProfile, switchPersona, getUserPosts } from './api.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function formatPostTime(ts) {
  if (ts == null) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

function moodEmojiForTags(tags) {
  if (!tags || !tags.length) return '🪔';
  if (tags.includes('anxious')) return '💢';
  if (tags.includes('homesick')) return '🏠';
  if (tags.includes('lonely')) return '🕯️';
  if (tags.includes('financial')) return '💰';
  if (tags.includes('culture-shock')) return '🇳🇵';
  return '🪔';
}

async function updatePostsSection() {
  const uid = getUserId();
  if (!uid) return;

  const container = document.getElementById('userPostsList');
  let userPosts = [];

  try {
    const apiPosts = await getUserPosts(uid);
    userPosts = Array.isArray(apiPosts) ? apiPosts : [];
  } catch (err) {
    console.warn('Profile: loading posts from server failed, using local cache if any', err);
    userPosts = window.kathaaPosts.getUserPosts(uid);
  }

  userPosts = [...userPosts].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return tb - ta;
  });

  document.getElementById('postCount').innerText = userPosts.length;

  const recentPosts = userPosts.slice(0, 5);
  if (recentPosts.length === 0) {
    container.innerHTML =
      '<div style="text-align: center; color: var(--muted-text);">✨ You haven’t shared any stories yet. Be the first.</div>';
    return;
  }

  container.innerHTML = recentPosts
    .map((post) => {
      const tags = post.tags || [];
      const emoji = post.moodEmoji || moodEmojiForTags(tags);
      return `
      <div style="border-bottom: 1px solid var(--border-soft); padding-bottom: 0.8rem;">
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.3rem;">
          <span style="font-size: 1.4rem;">${emoji}</span>
          <span style="font-size: 0.7rem; color: var(--muted-text);">${formatPostTime(post.timestamp)}</span>
        </div>
        <p style="font-size: 0.9rem; margin-bottom: 0.3rem;">${escapeHtml(post.text || '')}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
          ${tags.map((t) => `<span style="background:rgba(200,169,110,0.1); padding:0.2rem 0.6rem; border-radius:20px; font-size:0.7rem;">#${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>`;
    })
    .join('');
}

function updateMoodSection() {
  const uid = getUserId();
  if (!uid) return;

  const userMoods = window.kathaaMood.getUserMoods(uid);
  document.getElementById('moodCount').innerText = userMoods.length;

  const recentMoods = [...userMoods].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const container = document.getElementById('userMoodList');
  if (!container) return;
  if (recentMoods.length === 0) {
    container.innerHTML =
      '<div style="text-align: center; color: var(--muted-text);">🌱 No mood entries yet. Start tracking.</div>';
    return;
  }
  container.innerHTML = recentMoods
    .map(
      (entry) => `
      <div style="border-bottom: 1px solid var(--border-soft); padding-bottom: 0.6rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><span style="font-size: 1.2rem;">${entry.mood}</span> <strong style="color: var(--cream-heading);">${entry.mood}</strong></span>
          <span style="font-size: 0.7rem; color: var(--muted-text);">${entry.date}</span>
        </div>
      </div>`
    )
    .join('');
}

function renderMentorStats(profile) {
  const container = document.getElementById('mentor-section');
  container.innerHTML = `
      <h3 class="serif-heading" style="margin-bottom: 0.5rem;">🎗️ Mentor Dashboard</h3>
      <div style="background: rgba(212, 129, 58, 0.05); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(212, 129, 58, 0.2);">
        <p style="font-size: 0.95rem; margin-bottom: 1rem;">You are currently active as a <strong>${profile.is_verified ? 'Verified' : 'Pending'} Mentor</strong>.</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="stat-box" style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px;">
            <div style="font-size: 1.5rem;">📢</div>
            <div style="font-size: 0.75rem; color: var(--muted-text);">Rooms Hosted</div>
            <div style="font-weight: 600; color: var(--warm-gold);">0</div>
          </div>
          <div class="stat-box" style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px;">
            <div style="font-size: 1.5rem;">🤝</div>
            <div style="font-size: 0.75rem; color: var(--muted-text);">People Helped</div>
            <div style="font-weight: 600; color: var(--warm-gold);">0</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 1.5rem; text-align: center;">
        <a href="groups.html" class="btn-primary" style="font-size: 0.85rem;">Go to Chautari Stage</a>
      </div>
    `;
}

function renderMentorStatus(profile) {
  const mentorSection = document.getElementById('mentor-section');
  if (profile.role === 'mentor') {
    mentorSection.innerHTML = `
        <h3 class="serif-heading" style="margin-bottom: 0.5rem;">🎓 Mentor Status</h3>
        <div style="padding: 1.25rem; background: rgba(212, 129, 58, 0.1); border-radius: 16px; border: 1px dashed rgba(212, 129, 58, 0.4);">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.2rem;">${profile.is_verified ? '✅' : '⏳'}</span>
            <strong style="color: var(--warm-gold);">${profile.is_verified ? 'Verified Professional' : 'Verification Pending'}</strong>
          </div>
          <p style="font-size: 0.85rem; color: var(--muted-text);">
            ${profile.is_verified
        ? 'Your identity is verified. You can switch to Mentor Mode to host rooms.'
        : 'Our AI auditor is reviewing your credentials. You can still use the anonymous vents while waiting.'}
          </p>
        </div>
      `;
  } else {
    mentorSection.innerHTML = `
        <h3 class="serif-heading" style="margin-bottom: 0.5rem;">🎓 Become a Mentor</h3>
        <p style="font-size: 0.85rem; color: var(--muted-text); margin-bottom: 1.2rem;">Share your expertise and hold space for others. Verified mentors get distinct recognition.</p>
        <a href="mentor-portal.html" class="btn-outline" style="width: 100%; display: block; text-align: center;">Visit Mentor Portal →</a>
      `;
  }
}

async function initProfile() {
  if (!getUserId()) {
    window.location.href = 'login.html';
    return;
  }

  const uid = getUserId();
  const profile = await getProfile(uid);
  if (!profile || profile.error) {
    const list = document.getElementById('userPostsList');
    if (list) {
      list.innerHTML =
        '<div style="text-align: center; color: var(--muted-text);">Could not load your profile. Is the support service running?</div>';
    }
    return;
  }

  const isMentor = profile.role === 'mentor';
  const activePersona = profile.active_persona;

  const cardEmoji = activePersona === 'mentor' ? '🎗️' : (profile.anon_avatar || '🪔');
  const cardTitle =
    activePersona === 'mentor' ? (profile.mentor_profile?.name || 'Verified Mentor') : (profile.anon_name || 'anonymous soul');
  const cardSubtitle =
    activePersona === 'mentor'
      ? (profile.mentor_profile?.title || '')
      : `Your Kathaa ID · ${uid.slice(0, 12)}...`;

  document.querySelector('.warm-card .serif-heading').innerText = cardTitle;
  document.getElementById('userIdDisplay').innerText = cardSubtitle || '';
  document.querySelector('.warm-card span[style="font-size: 4rem;"]').innerText = cardEmoji;

  if (isMentor) {
    let switcher = document.getElementById('persona-switcher');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.id = 'persona-switcher';
      switcher.style.marginTop = '1rem';
      document.querySelector('.warm-card').appendChild(switcher);
    }

    const targetPersona = activePersona === 'mentor' ? 'storyteller' : 'mentor';
    const btnLabel =
      activePersona === 'mentor' ? '🕵️ Switch to Anonymous Mode' : '🎗️ Switch to Mentor Mode';

    switcher.innerHTML = `
        <button class="btn-outline" onclick="handlePersonaSwitch('${targetPersona}')" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
          ${btnLabel}
        </button>
      `;
  }

  const storytellerSection = document.getElementById('storyteller-stats');
  const mentorSection = document.getElementById('mentor-section');

  if (activePersona === 'mentor') {
    storytellerSection.style.display = 'none';
    mentorSection.style.display = 'block';
    renderMentorStats(profile);
  } else {
    storytellerSection.style.display = 'block';
    mentorSection.style.display = 'block';
    await updatePostsSection();
    updateMoodSection();
    renderMentorStatus(profile);
  }
}

window.handlePersonaSwitch = async function (newPersona) {
  const uid = getUserId();
  if (!uid) return;
  const res = await switchPersona(uid, newPersona);
  if (res.success) {
    await refreshProfile();
    location.reload();
  } else {
    alert(res.message || 'Could not switch persona');
  }
};

initProfile();

window.addEventListener('storage', function (e) {
  if (e.key === 'kathaa_posts') void updatePostsSection();
  if (e.key === 'kathaa_mood_logs') updateMoodSection();
});

document.addEventListener('visibilitychange', function () {
  if (!document.hidden) {
    void updatePostsSection();
    updateMoodSection();
  }
});
