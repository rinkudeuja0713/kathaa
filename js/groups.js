import { getGroups, getGroup, joinGroup, getClubhouseRooms, joinAudioRoom, rsvpMentorSession } from './api.js';

const groupsList = document.getElementById('groupsList');
const groupListView = document.getElementById('groupListView');
const groupDetailView = document.getElementById('groupDetailView');
const groupDetailHeader = document.getElementById('groupDetailHeader');
const activeRooms = document.getElementById('activeRooms');
const mentorSessionsList = document.getElementById('mentorSessionsList');

let currentGroupId = null;

async function initGroups() {
  const groups = await getGroups();
  renderGroups(groups);
}

function renderGroups(groups) {
  groupsList.innerHTML = '';
  groups.forEach(group => {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
      <div class="group-header">
        <div>
          <span class="group-category">${group.category}</span>
          <h2 class="serif-heading" style="margin: 0.2rem 0;">${group.name}</h2>
          <p style="font-size: 0.9rem; color: #666;">${group.description}</p>
        </div>
        <button class="btn-primary" onclick="window.enterGroup('${group.id}')">Enter Space</button>
      </div>
    `;
    groupsList.appendChild(card);
  });
}

window.enterGroup = async function(groupId) {
  currentGroupId = groupId;
  const group = await getGroup(groupId);
  renderGroupDetail(group);
  groupListView.style.display = 'none';
  groupDetailView.style.display = 'block';
  
  // Load Clubhouse data
  loadClubhouse(groupId);
  // Load Discussion board
  loadDiscussion(groupId);
};

window.showGroupList = function() {
  groupListView.style.display = 'block';
  groupDetailView.style.display = 'none';
};

function renderGroupDetail(group) {
  groupDetailHeader.innerHTML = `
    <span class="group-category">${group.category}</span>
    <h1 class="serif-heading" style="margin-top: 0.2rem;">${group.name}</h1>
    <p>${group.description}</p>
    <div style="margin-top: 1rem;">
      <span style="font-size: 0.85rem; color: #888;">${group.members.length} hearts sharing this space</span>
    </div>
  `;
}

async function loadClubhouse(groupId) {
  const data = await getClubhouseRooms(groupId);
  renderRooms(data.rooms);
  renderSessions(data.sessions);
}

function renderRooms(rooms) {
  activeRooms.innerHTML = '';
  if (rooms.length === 0) {
    activeRooms.innerHTML = '<p>No active rooms right now. Be the first to start a conversation?</p>';
    return;
  }
  
  rooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <span class="room-status ${room.status}">${room.status}</span>
      <h3 class="room-title">${room.name}</h3>
      <div class="participant-grid" id="participants-${room.id}">
        ${renderSkeletonParticipants()}
      </div>
      <button class="btn-primary" style="width: 100%; margin-top: 1rem;" 
              onclick="window.joinRoom('${room.id}')">
        ${room.status === 'empty' ? '🏠 Open Room' : '🎙️ Join Room'}
      </button>
    `;
    activeRooms.appendChild(card);
  });
}

function renderSkeletonParticipants() {
  return `
    <div class="participant-avatar" title="Reeya" data-user-id="u1">👤</div>
    <div class="participant-avatar" title="Guest 1" data-user-id="u2">👤</div>
    <div class="participant-avatar" title="Speaker" data-user-id="u3">👤</div>
  `;
}

function simulateSpeaking() {
  setInterval(() => {
    const avatars = document.querySelectorAll('.participant-avatar');
    if (avatars.length > 0) {
      avatars.forEach(a => a.classList.remove('speaking'));
      const randomIdx = Math.floor(Math.random() * avatars.length);
      avatars[randomIdx].classList.add('speaking');
    }
  }, 3000);
}

function renderSessions(sessions) {
  mentorSessionsList.innerHTML = '';
  if (sessions.length === 0) {
    mentorSessionsList.innerHTML = '<p>No scheduled sessions this week.</p>';
    return;
  }
  
  sessions.forEach(session => {
    const date = new Date(session.scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const alreadyRsvped = (session.rsvps || []).includes('test_user');
    const card = document.createElement('div');
    card.className = 'mentor-card';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="mentor-tag">MENTOR SESSION</span>
          <h3 class="room-title">${session.topic}</h3>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; color: #f2a65a;">${date}</p>
          <p style="font-size: 0.8rem; color: #888;">Duration: ${session.duration}</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; margin-top: 0.75rem; cursor: pointer;" 
           onclick="window.showMentorProfile('${session.mentorName}', '${session.mentorTitle}', '')">
        <div class="participant-avatar" style="margin-right: 0.5rem; background: #fdf2f2;">🎓</div>
        <div>
          <p style="font-weight: 500; margin: 0;">${session.mentorName} 🔗</p>
          <p style="font-size: 0.8rem; color: #666; margin: 0;">${session.mentorTitle}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid #ffe4bc; padding-top: 0.75rem;">
        <span style="font-size: 0.8rem; color: #d68735;">${session.rsvpCount} people attending</span>
        <button class="btn-outline ${alreadyRsvped ? 'rsvped' : ''}" 
                id="rsvp-btn-${session.id}"
                onclick="window.rsvp('${session.id}')"
                ${alreadyRsvped ? 'disabled' : ''}
                style="${alreadyRsvped ? 'opacity: 0.7; cursor: default; border-color: #10b981; color: #10b981;' : ''}">
          ${alreadyRsvped ? '✅ Attending' : '📅 RSVP & Remind Me'}
        </button>
      </div>
    `;
    mentorSessionsList.appendChild(card);
  });
}

// ========================
// DISCUSSION BOARD
// ========================
async function loadDiscussion(groupId) {
  const feedEl = document.getElementById('tab-feed');
  if (!feedEl) return;
  
  // Load posts from the backend
  let posts = [];
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/groups/${groupId}/posts`);
    if (res.ok) posts = await res.json();
  } catch(e) {
    console.warn('Could not load discussion posts:', e);
  }

  feedEl.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <div style="background: white; border-radius: 12px; padding: 1.25rem; border: 1px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        <textarea id="discussion-input" placeholder="Share a thought, question, or encouragement with the group..." 
          style="width: 100%; min-height: 80px; border: 1px solid #e5e5e5; border-radius: 8px; padding: 0.75rem; 
          font-family: inherit; font-size: 0.95rem; resize: vertical; outline: none; transition: border-color 0.2s;
          background: #fafafa;"
          onfocus="this.style.borderColor='#f2a65a'; this.style.background='#fff';"
          onblur="this.style.borderColor='#e5e5e5'; this.style.background='#fafafa';"></textarea>
        <div style="display: flex; justify-content: flex-end; margin-top: 0.75rem;">
          <button class="btn-primary" onclick="window.postDiscussion()" style="font-size: 0.85rem; padding: 0.5rem 1.5rem;">
            💬 Post to Discussion
          </button>
        </div>
      </div>
    </div>
    <div id="discussion-posts">
      ${posts.length === 0 ? `
        <div style="text-align: center; padding: 3rem 1rem; color: #999;">
          <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌿</p>
          <p style="font-style: italic; font-size: 0.95rem;">This space is waiting for voices. Be the first to share a thought.</p>
        </div>
      ` : posts.map(p => renderDiscussionPost(p)).join('')}
    </div>
  `;
}

function renderDiscussionPost(post) {
  const timeAgo = getTimeAgo(new Date(post.timestamp));
  return `
    <div class="discussion-post" style="background: white; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; border: 1px solid #f0f0f0; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #f2a65a, #e8873a); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: white;">🪔</div>
          <span style="font-weight: 500; font-size: 0.85rem; color: #555;">Anonymous</span>
        </div>
        <span style="font-size: 0.75rem; color: #aaa;">${timeAgo}</span>
      </div>
      <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #333;">${escapeHtml(post.text)}</p>
      <div style="display: flex; gap: 1rem; margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #f5f5f5;">
        <button onclick="window.reactToPost('${post.id}', '❤️')" style="background: none; border: none; cursor: pointer; font-size: 0.8rem; color: #999; transition: color 0.2s;" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#999'">
          ❤️ ${post.reactions?.heart || ''}
        </button>
        <button onclick="window.reactToPost('${post.id}', '🤗')" style="background: none; border: none; cursor: pointer; font-size: 0.8rem; color: #999; transition: color 0.2s;" onmouseover="this.style.color='#f39c12'" onmouseout="this.style.color='#999'">
          🤗 ${post.reactions?.hug || ''}
        </button>
        <button onclick="window.reactToPost('${post.id}', '💪')" style="background: none; border: none; cursor: pointer; font-size: 0.8rem; color: #999; transition: color 0.2s;" onmouseover="this.style.color='#27ae60'" onmouseout="this.style.color='#999'">
          💪 ${post.reactions?.strength || ''}
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

window.postDiscussion = async function() {
  const input = document.getElementById('discussion-input');
  const text = input?.value?.trim();
  if (!text) {
    showToast('Write something to share first 🖊️');
    return;
  }
  
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/groups/${currentGroupId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, authorId: 'test_user' })
    });
    if (res.ok) {
      input.value = '';
      showToast('✨ Shared with the group');
      loadDiscussion(currentGroupId);
    } else {
      showToast('Could not post — try again');
    }
  } catch(e) {
    showToast('Server error — is the backend running?');
  }
};

window.reactToPost = async function(postId, emoji) {
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/groups/${currentGroupId}/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, userId: 'test_user' })
    });
    if (res.ok) {
      loadDiscussion(currentGroupId);
    }
  } catch(e) {
    console.warn('React failed:', e);
  }
};

window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.clubhouse-section').forEach(sec => sec.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
};

window.joinRoom = async function(roomId) {
  console.log('Joining room:', roomId);
  const user = { id: 'test_user', name: 'User' };

  // Show loading state on the button
  event.target.disabled = true;
  event.target.textContent = '⏳ Connecting...';

  try {
    const data = await joinAudioRoom(roomId, user.id, user.name);

    if (data.error) {
      alert(`⚠️ Could not join room:\n${data.error}\n\n${data.hint || ''}`);
      event.target.disabled = false;
      event.target.textContent = '🎙️ Join Room';
      return;
    }

    if (data.roomUrl) {
      initDaily(data.roomUrl);
    }
  } catch (err) {
    alert('Failed to connect to the server. Is the backend running?');
    event.target.disabled = false;
    event.target.textContent = '🎙️ Join Room';
  }
};

// ========================
// VOICE CHANGER ENGINE
// ========================
const VOICE_PRESETS = {
  normal:    { label: '🎤 Normal',    modFreq: 0,   filterType: null,  filterFreq: 0,    distort: false },
  deep:      { label: '🔊 Deep',      modFreq: 0,   filterType: 'lowpass',  filterFreq: 900,  distort: false },  
  anonymous: { label: '🎭 Anonymous', modFreq: 50,  filterType: 'bandpass', filterFreq: 1500, distort: false },
  robot:     { label: '🤖 Robot',     modFreq: 200, filterType: 'bandpass', filterFreq: 2000, distort: true  },
  whisper:   { label: '🌙 Whisper',   modFreq: 0,   filterType: 'highpass', filterFreq: 2500, distort: false },
};

let voiceState = {
  audioCtx: null,
  micStream: null,
  source: null,
  oscillator: null,
  modGain: null,
  biquad: null,
  waveshaper: null,
  dryGain: null,
  destination: null,
  currentPreset: 'normal',
};

function createWaveShaperCurve(amount) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

async function initVoiceChanger() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const source = audioCtx.createMediaStreamSource(stream);
    const destination = audioCtx.createMediaStreamDestination();

    const biquad = audioCtx.createBiquadFilter();
    biquad.type = 'allpass';
    biquad.frequency.value = 1000;

    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 0;
    const modGain = audioCtx.createGain();
    modGain.gain.value = 1;
    oscillator.connect(modGain.gain);
    oscillator.start();

    const waveshaper = audioCtx.createWaveShaper();
    waveshaper.curve = null;
    waveshaper.oversample = '4x';

    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 1.0;

    source.connect(biquad);
    biquad.connect(modGain);
    modGain.connect(waveshaper);
    waveshaper.connect(dryGain);
    dryGain.connect(destination);

    voiceState = {
      audioCtx, micStream: stream, source, oscillator,
      modGain, biquad, waveshaper, dryGain, destination,
      currentPreset: 'normal',
    };

    return destination.stream;
  } catch (err) {
    console.error('Voice changer init failed:', err);
    return null;
  }
}

function applyVoicePreset(presetName) {
  const preset = VOICE_PRESETS[presetName];
  if (!preset || !voiceState.audioCtx) return;

  voiceState.currentPreset = presetName;

  voiceState.oscillator.frequency.setValueAtTime(
    preset.modFreq, voiceState.audioCtx.currentTime
  );

  if (preset.filterType) {
    voiceState.biquad.type = preset.filterType;
    voiceState.biquad.frequency.setValueAtTime(
      preset.filterFreq, voiceState.audioCtx.currentTime
    );
    voiceState.biquad.Q.setValueAtTime(1.5, voiceState.audioCtx.currentTime);
  } else {
    voiceState.biquad.type = 'allpass';
  }

  voiceState.waveshaper.curve = preset.distort ? createWaveShaperCurve(50) : null;

  document.querySelectorAll('.voice-preset-btn').forEach(btn => {
    btn.style.background = btn.dataset.preset === presetName
      ? 'linear-gradient(135deg, #d4813a, #c06828)' : 'rgba(200,169,110,0.1)';
    btn.style.color = btn.dataset.preset === presetName ? 'white' : '#c8a96e';
  });
}

function cleanupVoiceChanger() {
  if (voiceState.micStream) {
    voiceState.micStream.getTracks().forEach(t => t.stop());
  }
  if (voiceState.oscillator) {
    try { voiceState.oscillator.stop(); } catch(e) {}
  }
  if (voiceState.audioCtx) {
    voiceState.audioCtx.close();
  }
  voiceState = { audioCtx: null, micStream: null, source: null, oscillator: null,
    modGain: null, biquad: null, waveshaper: null, dryGain: null,
    destination: null, currentPreset: 'normal' };
}

// ========================
// ROOM STATE
// ========================
const SPEAK_TIME_LIMIT = 90;
let roomState = {
  handQueue: [],
  currentSpeaker: null,
  speakTimer: null,
  speakTimeLeft: 0,
  reportVotes: {},
  kickedUsers: new Set(),
  localSessionId: null,
  callFrame: null,
};

// ========================
// DAILY.CO CALL WITH VOICE CHANGER
// ========================
async function initDaily(url) {
  const existing = document.getElementById('daily-call-overlay');
  if (existing) existing.remove();

  // Reset room state completely
  roomState = {
    handQueue: [], currentSpeaker: null, speakTimer: null, speakTimeLeft: 0,
    reportVotes: {}, kickedUsers: new Set(), localSessionId: null, callFrame: null,
  };

  // --- Build Overlay ---
  const overlay = document.createElement('div');
  overlay.id = 'daily-call-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 1500; background: #0e0b08;
    display: flex; flex-direction: column;
  `;

  // Top bar
  const topBar = document.createElement('div');
  topBar.style.cssText = `
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.6rem 1.5rem; background: rgba(14,11,8,0.97);
    border-bottom: 1px solid rgba(200,169,110,0.15);
  `;
  topBar.innerHTML = `
    <span style="color: #c8a96e; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem;">🪔 Kathaa Clubhouse</span>
    <div style="display: flex; gap: 0.75rem; align-items: center;">
      <span id="room-participant-count" style="color: #7a6e60; font-size: 0.8rem;">0 in room</span>
      <button id="leave-room-btn" style="
        background: linear-gradient(135deg, #d4813a, #c06828); color: white;
        border: none; padding: 0.45rem 1.2rem; border-radius: 999px;
        cursor: pointer; font-family: inherit; font-weight: 500; font-size: 0.85rem;
      ">🚪 Leave</button>
    </div>
  `;
  overlay.appendChild(topBar);

  // Voice changer bar
  const voiceBar = document.createElement('div');
  voiceBar.style.cssText = `
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 1.5rem; background: rgba(24,20,16,0.95);
    border-bottom: 1px solid rgba(200,169,110,0.08);
    overflow-x: auto;
  `;
  voiceBar.innerHTML = `
    <span style="color: #7a6e60; font-size: 0.75rem; margin-right: 0.3rem; white-space: nowrap;">Voice:</span>
    ${Object.entries(VOICE_PRESETS).map(([key, preset]) => `
      <button class="voice-preset-btn" data-preset="${key}" style="
        background: ${key === 'normal' ? 'linear-gradient(135deg, #d4813a, #c06828)' : 'rgba(200,169,110,0.08)'};
        color: ${key === 'normal' ? 'white' : '#c8a96e'};
        border: 1px solid rgba(200,169,110,0.15); padding: 0.3rem 0.7rem;
        border-radius: 999px; cursor: pointer; font-size: 0.75rem;
        font-family: inherit; white-space: nowrap; transition: all 0.2s;
      ">${preset.label}</button>
    `).join('')}
  `;
  overlay.appendChild(voiceBar);

  // Main room body
  const roomBody = document.createElement('div');
  roomBody.style.cssText = 'flex: 1; overflow-y: auto; display: flex; flex-direction: column;';
  roomBody.innerHTML = `
    <!-- STAGE: Current Speaker -->
    <div id="stage-area" style="
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2rem 1rem 1rem; min-height: 220px;
    ">
      <div id="stage-empty" style="color: #7a6e60; font-size: 0.9rem;">
        Connecting to room...
      </div>
      <div id="stage-speaker" style="display: none; text-align: center;">
        <div style="position: relative; display: inline-block;">
          <svg id="timer-ring" width="130" height="130" style="position: absolute; top: -5px; left: -5px; transform: rotate(-90deg);">
            <circle cx="65" cy="65" r="60" fill="none" stroke="rgba(200,169,110,0.1)" stroke-width="4"/>
            <circle id="timer-progress" cx="65" cy="65" r="60" fill="none" stroke="#d4813a" stroke-width="4"
              stroke-dasharray="377" stroke-dashoffset="0" stroke-linecap="round"
              style="transition: stroke-dashoffset 1s linear;"/>
          </svg>
          <div id="speaker-avatar" style="
            width: 120px; height: 120px; border-radius: 50%;
            background: rgba(212,129,58,0.12); border: 3px solid #d4813a;
            display: flex; align-items: center; justify-content: center;
            font-size: 3rem; animation: pulse-ring 2s infinite;
          ">🪔</div>
        </div>
        <p id="speaker-name" style="color: #c8a96e; font-size: 1rem; margin-top: 0.75rem; font-weight: 500;">Speaking</p>
        <p id="speaker-timer" style="color: #d4813a; font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem;">1:30</p>
      </div>
    </div>

    <!-- HAND RAISE QUEUE -->
    <div id="queue-area" style="
      padding: 0 1.5rem; margin-bottom: 0.75rem;
    ">
      <div id="queue-bar" style="display: none;">
        <p style="color: #7a6e60; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">🖐 Next up</p>
        <div id="queue-list" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem;"></div>
      </div>
    </div>

    <!-- DIVIDER -->
    <div style="border-top: 1px solid rgba(200,169,110,0.08); margin: 0 1.5rem;"></div>

    <!-- AUDIENCE -->
    <div style="padding: 1rem 1.5rem;">
      <p style="color: #7a6e60; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">👥 Listeners</p>
      <div id="audience-grid" style="
        display: flex; flex-wrap: wrap; gap: 1rem;
      "></div>
    </div>
  `;
  overlay.appendChild(roomBody);

  // Bottom controls
  const controls = document.createElement('div');
  controls.style.cssText = `
    display: flex; justify-content: center; align-items: center; gap: 1.2rem;
    padding: 1rem; background: rgba(14,11,8,0.97);
    border-top: 1px solid rgba(200,169,110,0.12);
  `;
  controls.innerHTML = `
    <button id="mic-toggle-btn" style="
      width: 56px; height: 56px; border-radius: 50%;
      background: rgba(200,169,110,0.12); border: 2px solid rgba(200,169,110,0.25);
      color: #c8a96e; font-size: 1.3rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    " title="Toggle microphone">🎤</button>
    <button id="hand-raise-btn" style="
      width: 56px; height: 56px; border-radius: 50%;
      background: rgba(200,169,110,0.12); border: 2px solid rgba(200,169,110,0.25);
      color: #c8a96e; font-size: 1.3rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    " title="Raise hand to speak">✋</button>
    <p id="mic-status" style="color: #7a6e60; font-size: 0.75rem; min-width: 90px;">Mic muted</p>
  `;
  overlay.appendChild(controls);

  // Hidden Daily iframe
  const hiddenFrame = document.createElement('div');
  hiddenFrame.style.cssText = 'width: 0; height: 0; overflow: hidden; position: absolute;';
  overlay.appendChild(hiddenFrame);

  document.body.appendChild(overlay);

  // --- Initialize voice changer ---
  const processedStream = await initVoiceChanger();

  // --- Create Daily call (hidden) ---
  const callFrame = window.DailyIframe.createFrame(hiddenFrame, {
    showLeaveButton: false, 
    showFullscreenButton: false,
    iframeStyle: { width: '1px', height: '1px', border: 'none' },
    dailyConfig: {
      useDevicePreferences: false,
      videoSource: false,
    }
  });
  roomState.callFrame = callFrame;

  let isMuted = true;
  let userData = { role: 'storyteller', isVerified: false };

  // Fetch real profile if logged in
  try {
    const profile = await window.kathaaAuth.getProfile();
    if (profile) {
      userData.role = profile.role;
      userData.isVerified = profile.is_verified;
      userData.name = profile.active_persona === 'mentor' ? profile.mentor_profile?.name : 'Anonymous';
    }
  } catch (e) {
    console.warn('Auth check failed before join, using defaults:', e);
  }

  callFrame.join({ 
    url, 
    userName: userData.name || 'Anonymous',
    userData: userData,
    startVideoOff: true, 
    startAudioOff: true, 
    videoSource: false 
  });

  // --- On join ---
  callFrame.on('joined-meeting', async () => {
    // Get the REAL session_id from Daily.co for the local participant
    syncLocalSessionId();
    console.log('[JOIN] Local session_id:', roomState.localSessionId);

    if (processedStream) {
      try {
        const t = processedStream.getAudioTracks()[0];
        if (t) await callFrame.setInputDevicesAsync({ audioSource: t });
      } catch(e) { console.warn('Voice input error:', e); }
    }

    // Nobody auto-gets the stage. Everyone starts as a listener.
    renderRoom(callFrame);
  });

  function syncLocalSessionId() {
    const participants = callFrame.participants();
    if (participants && participants.local) {
      roomState.localSessionId = participants.local.session_id || roomState.localSessionId || 'local';
    }
  }

  callFrame.on('participant-joined', () => renderRoom(callFrame));
  callFrame.on('participant-left', (ev) => {
    roomState.handQueue = roomState.handQueue.filter(id => id !== ev.participant.session_id);
    delete roomState.reportVotes[ev.participant.session_id];
    if (roomState.currentSpeaker === ev.participant.session_id) advanceSpeaker(callFrame);
    renderRoom(callFrame);
  });
  callFrame.on('participant-updated', (ev) => {
    if (ev.participant.local) syncLocalSessionId();
    renderRoom(callFrame);
  });

  // --- Mic toggle ---
  document.getElementById('mic-toggle-btn').onclick = () => {
    const isCurrentSpeaker = isLocalSpeaker();
    if (!isMuted && !isCurrentSpeaker) return;
    if (isMuted && !isCurrentSpeaker) {
      showToast('✋ Raise your hand first — only the current speaker can unmute.');
      return;
    }
    isMuted = !isMuted;
    callFrame.setLocalAudio(!isMuted);
    const btn = document.getElementById('mic-toggle-btn');
    btn.innerHTML = isMuted ? '🎤' : '🔴';
    btn.style.background = isMuted ? 'rgba(200,169,110,0.12)' : 'rgba(212,129,58,0.25)';
    btn.style.borderColor = isMuted ? 'rgba(200,169,110,0.25)' : '#d4813a';
    document.getElementById('mic-status').textContent = isMuted ? 'Mic muted' : 'Speaking';
    document.getElementById('mic-status').style.color = isMuted ? '#7a6e60' : '#d4813a';
  };

  // --- Hand raise ---
  document.getElementById('hand-raise-btn').onclick = () => {
    const myId = roomState.localSessionId;
    
    // Check if local user is the speaker (by session_id match or by .local flag)
    if (isLocalSpeaker()) {
      showToast("You're already on stage!");
      return;
    }
    if (roomState.handQueue.includes(myId)) {
      // Lower hand
      roomState.handQueue = roomState.handQueue.filter(id => id !== myId);
      document.getElementById('hand-raise-btn').style.background = 'rgba(200,169,110,0.12)';
      document.getElementById('hand-raise-btn').style.borderColor = 'rgba(200,169,110,0.25)';
      showToast('Hand lowered');
    } else {
      // If stage is empty, go directly to stage
      if (!roomState.currentSpeaker && roomState.handQueue.length === 0) {
        roomState.currentSpeaker = myId;
        startSpeakTimer();
        showToast('🎙️ You\'re on stage!');
      } else {
        roomState.handQueue.push(myId);
        document.getElementById('hand-raise-btn').style.background = 'rgba(212,129,58,0.25)';
        document.getElementById('hand-raise-btn').style.borderColor = '#d4813a';
        showToast(`✋ Hand raised — you are #${roomState.handQueue.indexOf(myId) + 1} in queue`);
      }
    }
    renderRoom(callFrame);
  };

  // Voice preset buttons
  voiceBar.querySelectorAll('.voice-preset-btn').forEach(btn => {
    btn.onclick = () => applyVoicePreset(btn.dataset.preset);
  });

  // Cleanup
  function cleanupCall() {
    clearInterval(roomState.speakTimer);
    cleanupVoiceChanger();
    try { callFrame.destroy(); } catch(e) {}
    overlay.remove();
    document.querySelectorAll('.btn-primary[disabled]').forEach(btn => {
      btn.disabled = false; btn.textContent = '🎙️ Join Room';
    });
  }

  document.getElementById('leave-room-btn').onclick = async () => {
    try { await callFrame.leave(); } catch(e) {}
    cleanupCall();
  };
  callFrame.on('left-meeting', () => cleanupCall());
  callFrame.on('error', (ev) => {
    console.error('Daily.co error:', ev);
    cleanupCall();
    alert(`⚠️ Audio room error:\n${ev.errorMsg || 'Unknown error'}`);
  });
}

// Helper: check if the local user is the current speaker
function isLocalSpeaker() {
  if (!roomState.currentSpeaker) return false;
  if (roomState.currentSpeaker === roomState.localSessionId) return true;
  // Also check via the Daily participant's local flag
  if (roomState.callFrame) {
    const participants = roomState.callFrame.participants();
    if (participants) {
      const localP = participants.local;
      if (localP && localP.session_id === roomState.currentSpeaker) return true;
    }
  }
  return false;
}

// ========================
// SPEAKING TIMER
// ========================
function startSpeakTimer() {
  clearInterval(roomState.speakTimer);
  roomState.speakTimeLeft = SPEAK_TIME_LIMIT;
  updateTimerDisplay();

  roomState.speakTimer = setInterval(() => {
    roomState.speakTimeLeft--;
    updateTimerDisplay();

    if (roomState.speakTimeLeft <= 0) {
      showToast('⏰ Time is up!');
      if (isLocalSpeaker()) {
        roomState.callFrame?.setLocalAudio(false);
        document.getElementById('mic-toggle-btn').innerHTML = '🎤';
        document.getElementById('mic-status').textContent = 'Mic muted';
      }
      advanceSpeaker(roomState.callFrame);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('speaker-timer');
  if (!el) return;
  const m = Math.floor(roomState.speakTimeLeft / 60);
  const s = roomState.speakTimeLeft % 60;
  el.textContent = `${m}:${s.toString().padStart(2, '0')}`;

  const progress = document.getElementById('timer-progress');
  if (progress) {
    const circumference = 2 * Math.PI * 60;
    const offset = circumference * (1 - roomState.speakTimeLeft / SPEAK_TIME_LIMIT);
    progress.setAttribute('stroke-dashoffset', offset);
    if (roomState.speakTimeLeft <= 10) progress.setAttribute('stroke', '#ef4444');
    else if (roomState.speakTimeLeft <= 30) progress.setAttribute('stroke', '#f59e0b');
    else progress.setAttribute('stroke', '#d4813a');
  }
}

function advanceSpeaker(callFrame) {
  clearInterval(roomState.speakTimer);
  if (roomState.handQueue.length > 0) {
    roomState.currentSpeaker = roomState.handQueue.shift();
  } else {
    roomState.currentSpeaker = null;
  }
  if (roomState.currentSpeaker) startSpeakTimer();
  if (callFrame) renderRoom(callFrame);
}

// ========================
// VOTE TO KICK
// ========================
window.reportUser = function(sessionId) {
  if (sessionId === roomState.localSessionId) return;

  if (!roomState.reportVotes[sessionId]) {
    roomState.reportVotes[sessionId] = new Set();
  }

  const votes = roomState.reportVotes[sessionId];
  if (votes.has(roomState.localSessionId)) {
    showToast('You already reported this user.');
    return;
  }

  votes.add(roomState.localSessionId);
  const count = votes.size;
  showToast(`⚠️ Report submitted (${count}/3 votes)`);

  if (count >= 3) {
    roomState.kickedUsers.add(sessionId);
    roomState.handQueue = roomState.handQueue.filter(id => id !== sessionId);
    if (roomState.currentSpeaker === sessionId) advanceSpeaker(roomState.callFrame);
    showToast('🚫 User has been removed by community vote.');
  }

  renderRoom(roomState.callFrame);
};

// ========================
// RENDER ROOM UI
// ========================
function renderRoom(callFrame) {
  if (!callFrame) return;
  const participants = callFrame.participants();
  if (!participants) return;
  const all = Object.values(participants).filter(p => !roomState.kickedUsers.has(p.session_id));

  // Participant count
  const countEl = document.getElementById('room-participant-count');
  if (countEl) countEl.textContent = `${all.length} in room`;

  // Helper: find participant by session_id
  function findParticipant(sid) {
    if (!sid) return null;
    // Direct Daily keys match
    if (sid === 'local' || sid === roomState.localSessionId) return participants.local;
    if (participants[sid]) return participants[sid];
    
    // Fallback: search in values
    return all.find(x => x.session_id === sid || (x.local && sid === 'local'));
  }

  // Helper: check if a participant is the speaker
  function isSpeaker(p) {
    if (!roomState.currentSpeaker) return false;
    if (p.session_id === roomState.currentSpeaker) return true;
    if (p.local && (roomState.currentSpeaker === 'local' || roomState.currentSpeaker === roomState.localSessionId)) return true;
    return false;
  }

  // --- STAGE ---
  const stageEmpty = document.getElementById('stage-empty');
  const stageSpeaker = document.getElementById('stage-speaker');

  if (roomState.currentSpeaker) {
    const speaker = findParticipant(roomState.currentSpeaker);
    if (speaker) {
      stageEmpty.style.display = 'none';
      stageSpeaker.style.display = 'block';
      const isLocal = speaker.local;
      const isVerified = speaker.userData?.isVerified;
      const mentorName = speaker.userData?.name || speaker.user_name || 'Anonymous';
      
      document.getElementById('speaker-avatar').innerHTML = (isVerified ? '🎗️' : (isLocal ? '🪔' : '👤'));
      document.getElementById('speaker-name').innerHTML = `
        ${isVerified ? '<span style="color: #d4813a; font-weight: 600;">🎗️ ' + mentorName + '</span>' : (isLocal ? 'You' : mentorName)}
        ${isVerified ? '<br><span style="font-size: 0.65rem; color: #c8a96e; opacity: 0.8;">' + (speaker.userData?.role_title || 'Verified Mentor') + '</span>' : ''}
      `;

    } else {
      // Speaker not found in participants — they may have left
      // Don't call advanceSpeaker here to avoid recursion, just reset
      console.warn('[STAGE] Speaker not found in participants, clearing stage');
      roomState.currentSpeaker = null;
      clearInterval(roomState.speakTimer);
      stageEmpty.style.display = 'block';
      stageSpeaker.style.display = 'none';
      stageEmpty.textContent = '🎙️ Stage is open — raise your hand to speak';
    }
  } else {
    stageEmpty.style.display = 'block';
    stageSpeaker.style.display = 'none';
    stageEmpty.textContent = all.length > 0 ? '🎙️ Stage is open — raise your hand to speak' : 'Connecting to room...';
  }

  // --- QUEUE ---
  const queueBar = document.getElementById('queue-bar');
  const queueList = document.getElementById('queue-list');
  if (roomState.handQueue.length > 0) {
    queueBar.style.display = 'block';
    queueList.innerHTML = roomState.handQueue.map((sid, i) => {
      const p = findParticipant(sid);
      const name = p ? (p.local ? 'You' : (p.user_name || 'Anon')) : '?';
      return `<div style="
        display: flex; align-items: center; gap: 0.4rem;
        background: rgba(200,169,110,0.08); padding: 0.3rem 0.7rem;
        border-radius: 999px; font-size: 0.75rem; color: #c8a96e;
        white-space: nowrap;
      "><span style="font-weight: 600;">#${i + 1}</span> ${name}</div>`;
    }).join('');
  } else {
    queueBar.style.display = 'none';
  }

  // --- AUDIENCE ---
  const grid = document.getElementById('audience-grid');
  const audience = all.filter(p => !isSpeaker(p));

  if (audience.length === 0) {
    grid.innerHTML = '<p style="color: #7a6e60; font-size: 0.8rem;">No other listeners yet</p>';
  } else {
    grid.innerHTML = audience.map(p => {
      const isLocal = p.local;
      const name = isLocal ? 'You' : (p.user_name || 'Anonymous');
      const inQueue = roomState.handQueue.includes(p.session_id) || 
                      (isLocal && roomState.handQueue.includes(roomState.localSessionId));
      const votes = roomState.reportVotes[p.session_id]?.size || 0;

      return `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem; position: relative;">
          <div style="
            width: 52px; height: 52px; border-radius: 50%;
            background: rgba(200,169,110,0.08);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; border: 2px solid ${inQueue ? '#d4813a' : 'rgba(200,169,110,0.15)'};
            transition: all 0.3s; position: relative;
          ">
            ${isLocal ? '🪔' : '👤'}
            ${p.userData?.isVerified ? '<span style="position: absolute; bottom: -2px; right: -2px; font-size: 0.8rem; background: #d4813a; border-radius: 50%; padding: 2px;">🎗️</span>' : ''}
            ${inQueue ? '<span style="position: absolute; top: -4px; right: -4px; font-size: 0.65rem;">✋</span>' : ''}
          </div>
          <span style="color: ${isLocal ? '#c8a96e' : '#d4c9b8'}; font-size: 0.7rem; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.userData?.isVerified ? '🎗️ ' : ''}${name}</span>
          ${!isLocal ? `<button onclick="window.reportUser('${p.session_id}')" style="
            background: none; border: none; color: #7a6e60; font-size: 0.6rem;
            cursor: pointer; padding: 0; opacity: 0.6; transition: opacity 0.2s;
          " onmouseover="this.style.opacity=1;this.style.color='#ef4444'" onmouseout="this.style.opacity=0.6;this.style.color='#7a6e60'"
          >⚠ Report${votes > 0 ? ` (${votes})` : ''}</button>` : ''}
        </div>
      `;
    }).join('');
  }
}

// Toast notification
function showToast(msg) {
  const existing = document.getElementById('room-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'room-toast';
  toast.style.cssText = `
    position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
    background: rgba(24,20,16,0.95); color: #c8a96e; padding: 0.6rem 1.5rem;
    border-radius: 999px; font-size: 0.85rem; z-index: 2000;
    border: 1px solid rgba(200,169,110,0.2); backdrop-filter: blur(8px);
    animation: toastIn 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Toast animation (inject once)
if (!document.getElementById('toast-style')) {
  const style = document.createElement('style');
  style.id = 'toast-style';
  style.textContent = `
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  `;
  document.head.appendChild(style);
}

window.rsvp = async function(sessionId) {
  const userId = 'test_user';
  const btn = document.getElementById(`rsvp-btn-${sessionId}`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Saving...';
  }
  
  try {
    const res = await rsvpMentorSession(sessionId, userId);
    if (res.success) {
      showToast(`✅ RSVP confirmed! ${res.rsvpCount} people attending.`);
      if (btn) {
        btn.textContent = '✅ Attending';
        btn.style.opacity = '0.7';
        btn.style.cursor = 'default';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#10b981';
      }
    } else if (res.error) {
      showToast(`⚠️ ${res.error}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📅 RSVP & Remind Me';
      }
    }
  } catch(e) {
    showToast('Could not RSVP — is the backend running?');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📅 RSVP & Remind Me';
    }
  }
};

// Mentor Modal logic
window.showMentorProfile = function(mentorName, mentorTitle, mentorBio) {
  const modal = document.createElement('div');
  modal.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(14, 11, 8, 0.9); display: flex; align-items: center;
    justify-content: center; z-index: 2000; backdrop-filter: blur(8px);
  `;
  modal.onclick = () => modal.remove();
  
  modal.innerHTML = `
    <div class="warm-card" style="max-width: 450px; width: 90%; position: relative;">
      <button style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div class="participant-avatar" style="width: 80px; height: 80px; font-size: 2.5rem; margin: 0 auto 1rem; background: #fdf2f2;">🎓</div>
        <h2 class="serif-heading" style="margin: 0;">${mentorName}</h2>
        <p style="color: var(--warm-gold); margin-top: 0.2rem;">${mentorTitle}</p>
      </div>
      <div style="border-top: 1px solid var(--border-soft); padding-top: 1rem;">
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--muted-text); margin-bottom: 0.5rem;">Specialization</h4>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          <span class="mentor-tag">Trauma Support</span>
          <span class="mentor-tag">Grief Counseling</span>
        </div>
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--muted-text); margin-bottom: 0.5rem;">About</h4>
        <p style="font-size: 0.95rem; line-height: 1.6;">${mentorBio || 'Verified professional mentor providing guidance and a safe harbor for the community.'}</p>
      </div>
      <button class="btn-primary" style="width: 100%; margin-top: 2rem;">Message Mentor (Coming Soon)</button>
    </div>
  `;
  document.body.appendChild(modal);
};

document.addEventListener('DOMContentLoaded', () => {
  initGroups();
  simulateSpeaking();
});
