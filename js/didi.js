(function () {
  'use strict';

  const API_URL = 'http://localhost:5000/api/didi/chat';

  // ─── CSS ────────────────────────────────────────────────────────────────────
  const css = `
    #didi-widget {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 950;
      font-family: 'DM Sans', sans-serif;
    }

    #didi-bubble {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9b59b6 0%, #7d3c98 100%);
      border: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      box-shadow: 0 4px 20px rgba(155, 89, 182, 0.45);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      outline: none;
      color: #f0e8d8;
    }

    #didi-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(160, 90, 180, 0.55);
    }

    #didi-bubble.open {
      background: linear-gradient(135deg, #7e4a9a 0%, #6a3585 100%);
    }

    .didi-bubble-icon { font-size: 1.5rem; line-height: 1; }
    .didi-bubble-label {
      font-size: 0.58rem;
      font-family: 'DM Sans', sans-serif;
      letter-spacing: 0.4px;
      opacity: 0.9;
    }

    /* Panel */
    #didi-panel {
      display: none;
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 360px;
      max-height: 500px;
      background: #181410;
      border-radius: 16px;
      border: 1px solid rgba(200, 169, 110, 0.2);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(200, 169, 110, 0.08);
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
    }

    #didi-panel.open {
      display: flex;
      animation: didiSlideIn 0.2s ease-out;
    }

    #didi-panel.open.closing {
      animation: didiSlideOut 0.15s ease-in forwards;
    }

    @keyframes didiSlideIn {
      from { opacity: 0; transform: scale(0.92) translateY(8px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);   }
    }

    @keyframes didiSlideOut {
      from { opacity: 1; transform: scale(1)    translateY(0);   }
      to   { opacity: 0; transform: scale(0.92) translateY(8px); }
    }

    /* Header */
    .didi-header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.85rem 1rem;
      background: linear-gradient(135deg, rgba(212,129,58,0.13) 0%, rgba(200,169,110,0.06) 100%);
      border-bottom: 1px solid rgba(200, 169, 110, 0.14);
      flex-shrink: 0;
    }

    .didi-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4813a, #c8a96e);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .didi-header-info { flex: 1; min-width: 0; }

    .didi-header-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      font-weight: 600;
      color: #f0e8d8;
      line-height: 1.2;
    }

    .didi-header-status {
      font-size: 0.7rem;
      color: #c8a96e;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .didi-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6bc47a;
      flex-shrink: 0;
    }

    .didi-close-btn {
      background: none;
      border: none;
      color: #7a6e60;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px 6px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      line-height: 1;
      flex-shrink: 0;
    }

    .didi-close-btn:hover {
      color: #d4c9b8;
      background: rgba(255,255,255,0.06);
    }

    /* Messages */
    #didi-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      scrollbar-width: thin;
      scrollbar-color: rgba(200,169,110,0.18) transparent;
    }

    #didi-messages::-webkit-scrollbar { width: 4px; }
    #didi-messages::-webkit-scrollbar-thumb {
      background: rgba(200,169,110,0.18);
      border-radius: 4px;
    }

    .didi-msg {
      display: flex;
      flex-direction: column;
      max-width: 86%;
    }

    .didi-msg.user    { align-self: flex-end;   align-items: flex-end;   }
    .didi-msg.didi-side { align-self: flex-start; align-items: flex-start; }

    .didi-msg-bubble {
      padding: 0.55rem 0.85rem;
      border-radius: 14px;
      font-size: 0.875rem;
      line-height: 1.55;
      color: #d4c9b8;
      word-break: break-word;
    }

    .didi-msg.user .didi-msg-bubble {
      background: linear-gradient(135deg, #d4813a 0%, #c06828 100%);
      color: #f0e8d8;
      border-bottom-right-radius: 4px;
    }

    .didi-msg.didi-side .didi-msg-bubble {
      background: #231e1a;
      border: 1px solid rgba(200,169,110,0.12);
      border-bottom-left-radius: 4px;
    }

    .didi-msg.didi-side.escalated .didi-msg-bubble {
      border-color: rgba(155, 89, 182, 0.45);
      background: rgba(155, 89, 182, 0.07);
    }

    .didi-msg.didi-side.crisis .didi-msg-bubble {
      border-color: rgba(220, 80, 80, 0.45);
      background: rgba(220, 80, 80, 0.06);
    }

    .didi-msg-bubble a {
      color: #c8a96e;
      text-decoration: underline;
    }

    .didi-msg-bubble a:hover { color: #d4813a; }
    .didi-msg-bubble strong  { color: #f0e8d8; font-weight: 500; }

    /* Typing indicator */
    .didi-typing-wrap {
      display: flex;
      align-self: flex-start;
    }

    .didi-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0.6rem 0.9rem;
      background: #231e1a;
      border: 1px solid rgba(200,169,110,0.12);
      border-radius: 14px;
      border-bottom-left-radius: 4px;
    }

    .didi-typing span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #7a6e60;
      animation: didiDot 1.2s infinite;
    }

    .didi-typing span:nth-child(2) { animation-delay: 0.2s; }
    .didi-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes didiDot {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0);    }
      30%           { opacity: 1;   transform: translateY(-3px); }
    }

    /* Input area */
    .didi-input-area {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      padding: 0.7rem;
      border-top: 1px solid rgba(200,169,110,0.1);
      background: #100d0a;
      flex-shrink: 0;
    }

    #didi-input {
      flex: 1;
      background: #231e1a;
      border: 1px solid rgba(200,169,110,0.15);
      border-radius: 10px;
      padding: 0.55rem 0.75rem;
      color: #d4c9b8;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem;
      outline: none;
      resize: none;
      max-height: 80px;
      transition: border-color 0.15s;
      line-height: 1.45;
      overflow-y: auto;
    }

    #didi-input::placeholder { color: #3e352c; }
    #didi-input:focus { border-color: rgba(212, 129, 58, 0.4); }

    #didi-send {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #9b59b6, #7d3c98);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.15s, box-shadow 0.15s;
      color: white;
    }

    #didi-send:hover {
      transform: scale(1.06);
      box-shadow: 0 2px 10px rgba(155,89,182,0.4);
    }

    #didi-send:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Mobile */
    @media (max-width: 480px) {
      #didi-widget { bottom: 1rem; right: 1rem; }
      #didi-panel {
        width: calc(100vw - 2rem);
        right: -1rem;
        max-height: 72vh;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── Widget DOM ──────────────────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'didi-widget';
  widget.innerHTML = `
    <button id="didi-bubble" aria-label="Chat with Didi" title="Didi — a safe, private space to talk">
      <span class="didi-bubble-icon">🌸</span>
      <span class="didi-bubble-label">Didi</span>
    </button>
  `;
  document.body.appendChild(widget);

  // ─── State ───────────────────────────────────────────────────────────────────
  let isOpen    = false;
  let isWaiting = false;
  let history   = [];
  let panelEl   = null;

  const bubbleBtn = document.getElementById('didi-bubble');

  // ─── Panel ───────────────────────────────────────────────────────────────────
  function buildPanel() {
    panelEl = document.createElement('div');
    panelEl.id = 'didi-panel';
    panelEl.innerHTML = `
      <div class="didi-header">
        <div class="didi-avatar">🌸</div>
        <div class="didi-header-info">
          <div class="didi-header-name">Didi · दिदी</div>
          <div class="didi-header-status">
            <span class="didi-status-dot"></span>
            Safe &amp; private — here for you
          </div>
        </div>
        <button class="didi-close-btn" aria-label="Close">✕</button>
      </div>
      <div id="didi-messages"></div>
      <div class="didi-input-area">
        <textarea id="didi-input" placeholder="This is a safe space — share what you'd like…" rows="1" aria-label="Message Didi"></textarea>
        <button id="didi-send" aria-label="Send">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    `;
    widget.appendChild(panelEl);

    panelEl.querySelector('.didi-close-btn').addEventListener('click', closePanel);
    document.getElementById('didi-send').addEventListener('click', sendMessage);
    document.getElementById('didi-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.getElementById('didi-input').addEventListener('input', growInput);

    // Welcome message
    addMessage('didi', "Namaste. I'm Didi — a safe, private space to talk. 💜\n\nWhatever you're carrying — something that happened to you, something you're afraid to say out loud, frustration, fear, or just needing to be heard — you can share it here. I will believe you. Take your time.", 'normal');
  }

  function growInput() {
    const ta = document.getElementById('didi-input');
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
  }

  function openPanel() {
    if (!panelEl) buildPanel();
    panelEl.classList.remove('closing');
    panelEl.classList.add('open');
    bubbleBtn.classList.add('open');
    isOpen = true;
    setTimeout(() => { const inp = document.getElementById('didi-input'); if (inp) inp.focus(); }, 120);
  }

  function closePanel() {
    if (!panelEl) return;
    panelEl.classList.add('closing');
    bubbleBtn.classList.remove('open');
    isOpen = false;
    setTimeout(() => { if (panelEl) panelEl.classList.remove('open', 'closing'); }, 150);
  }

  // ─── Messages ────────────────────────────────────────────────────────────────
  function renderText(raw) {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  }

  // level: 'normal' | 'support' | 'serious' | 'crisis'
  function addMessage(role, text, level) {
    const msgs = document.getElementById('didi-messages');
    const wrap = document.createElement('div');
    let extraClass = '';
    if (role !== 'user') {
      if (level === 'crisis') extraClass = ' crisis';
      else if (level === 'serious' || level === 'support') extraClass = ' escalated';
    }
    wrap.className = 'didi-msg ' + (role === 'user' ? 'user' : 'didi-side') + extraClass;
    const bubble = document.createElement('div');
    bubble.className = 'didi-msg-bubble';
    bubble.innerHTML = renderText(text);
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('didi-messages');
    const el = document.createElement('div');
    el.id = 'didi-typing-row';
    el.className = 'didi-typing-wrap';
    el.innerHTML = `<div class="didi-typing"><span></span><span></span><span></span></div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('didi-typing-row');
    if (el) el.remove();
  }

  // ─── Send ────────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const input = document.getElementById('didi-input');
    const sendBtn = document.getElementById('didi-send');
    const text = input.value.trim();
    if (!text || isWaiting) return;

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    isWaiting = true;

    addMessage('user', text, 'normal');
    history.push({ role: 'user', text });

    showTyping();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-10) })
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();
      hideTyping();

      const reply = data.reply || "I'm here. 💜";
      const level = data.level || 'normal';

      addMessage('didi', reply, level);
      history.push({ role: 'didi', text: reply });
    } catch (err) {
      hideTyping();
      addMessage('didi', "I'm having trouble connecting right now — please try again in a moment. You're not alone. 💜", 'normal');
    }

    isWaiting = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // ─── Toggle ──────────────────────────────────────────────────────────────────
  bubbleBtn.addEventListener('click', function () {
    isOpen ? closePanel() : openPanel();
  });

  // Close when clicking outside the widget
  document.addEventListener('click', function (e) {
    if (isOpen && panelEl && !widget.contains(e.target)) closePanel();
  });

})();
