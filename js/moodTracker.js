const MOOD_KEY = 'kathaa_mood_logs';
const MOOD_SCORES = {
  '😊 Good': 5,
  '😐 Okay': 4,
  '😔 Low': 2,
  '😰 Anxious': 3,
  '😤 Stressed': 3,
  '😢 Sad': 2
};

function getMoodLogs() {
  const stored = localStorage.getItem(MOOD_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveMoodLog(logs) {
  localStorage.setItem(MOOD_KEY, JSON.stringify(logs));
}

function logMood(moodText, score, userId) {
  const logs = getMoodLogs();
  const today = new Date().toISOString().slice(0,10);
  const existingIndex = logs.findIndex(l => l.date === today && l.userId === userId);
  const entry = { date: today, mood: moodText, score: score, timestamp: Date.now(), userId: userId };
  if (existingIndex !== -1) {
    logs[existingIndex] = entry;
  } else {
    logs.push(entry);
  }
  saveMoodLog(logs);
}

function getLast7DaysMood(userId) {
  const logs = getMoodLogs().filter(l => l.userId === userId);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0,10);
    const found = logs.find(l => l.date === dateStr);
    days.push({
      date: dateStr,
      score: found ? found.score : null,
      mood: found ? found.mood : '—'
    });
  }
  return days;
}

// NEW: Get moods only for a specific user
function getUserMoods(userId) {
  const all = getMoodLogs();
  return all.filter(log => log.userId === userId);
}

window.kathaaMood = {
  logMood,
  getMoodLogs,
  getLast7DaysMood,
  MOOD_SCORES,
  getUserMoods
};