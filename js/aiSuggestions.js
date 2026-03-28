const suggestionLibrary = [
  { emoji: "🌬️", title: "Box breathing", desc: "Inhale 4 sec, hold 4, exhale 4 — repeat 5 times." },
  { emoji: "📖", title: "One line journal", desc: "Write just one honest sentence about today." },
  { emoji: "💧", title: "Hydrate gently", desc: "Sip warm water with lemon — small ritual of care." },
  { emoji: "🌙", title: "Sleep ritual", desc: "Dim lights, no screen 30 min before bed." },
  { emoji: "👥", title: "Trusted person", desc: "Share one small feeling with someone safe." }
];

function getSuggestions(moodScore = null) {
  let suggestions = [...suggestionLibrary];
  if (moodScore !== null && moodScore <= 2) {
    suggestions.unshift({ emoji: "🕯️", title: "You're not alone", desc: "Even hard moments pass. Reach out if needed." });
  }
  return suggestions.slice(0, 4);
}

function createEmotionalValidation(similarCount) {
  const card = document.createElement('div');
  card.className = 'glow-validate';
  card.innerHTML = `✨ You are not alone. <strong>${similarCount} people</strong> shared similar feelings this week.<br> <span style="font-size:0.85rem;">Your Kathaa echoes in this community.</span>`;
  return card;
}

window.kathaaAI = { getSuggestions, createEmotionalValidation };