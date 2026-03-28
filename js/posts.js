const POSTS_STORAGE = 'kathaa_posts';

function loadPosts() {
  const stored = localStorage.getItem(POSTS_STORAGE);
  if (stored) return JSON.parse(stored);
  // initial sample posts (anonymous – no author)
  const initial = [
    { id: 'p1', text: "The pressure from work and family expectations has been overwhelming. Every day feels like I'm not enough, no matter what I do.", tags: ["stress"], moodEmoji: "😰", timestamp: Date.now() - 2*3600000, similarCountCache: 142, authorId: null },
    { id: 'p2', text: "I've been struggling to sleep because my mind won't stop racing. So much weight I can't tell anyone.", tags: ["anxiety"], moodEmoji: "😔", timestamp: Date.now() - 4*3600000, similarCountCache: 89, authorId: null },
    { id: 'p3', text: "The stress of meeting expectations while dealing with self-doubt is exhausting.", tags: ["burnout"], moodEmoji: "😤", timestamp: Date.now() - 5*3600000, similarCountCache: 156, authorId: null },
    { id: 'p4', text: "Feeling anxious about the future and my choices. Nobody seems to understand.", tags: ["anxiety"], moodEmoji: "😰", timestamp: Date.now() - 6*3600000, similarCountCache: 67, authorId: null },
    { id: 'p5', text: "Some days are harder. Trying to keep it together but inside fragile.", tags: ["loneliness"], moodEmoji: "😔", timestamp: Date.now() - 7*3600000, similarCountCache: 203, authorId: null }
  ];
  localStorage.setItem(POSTS_STORAGE, JSON.stringify(initial));
  return initial;
}

function savePosts(posts) {
  localStorage.setItem(POSTS_STORAGE, JSON.stringify(posts));
}

function addNewPost(text, tags, authorId) {
  const posts = loadPosts();
  const newPost = {
    id: Date.now() + '' + Math.random(),
    text: text,
    tags: tags,
    moodEmoji: getEmojiForTags(tags),
    timestamp: Date.now(),
    authorId: authorId,
  };
  posts.unshift(newPost);
  savePosts(posts);
  return newPost;
}

function getEmojiForTags(tags) {
  if (tags.includes('anxiety')) return '😰';
  if (tags.includes('stress')) return '😤';
  if (tags.includes('sadness')) return '😢';
  if (tags.includes('loneliness')) return '😔';
  if (tags.includes('burnout')) return '😞';
  return '🪔';
}

function getSimilarCountForPost(post, allPosts, daysWindow = 7) {
  const windowTime = Date.now() - (daysWindow * 24 * 3600000);
  let count = 0;
  for (let p of allPosts) {
    if (p.id === post.id) continue;
    if (p.timestamp < windowTime) continue;
    if (p.tags.some(tag => post.tags.includes(tag))) {
      count++;
    }
  }
  return count;
}

function getFilteredPosts(tagFilter = 'all') {
  let posts = loadPosts();
  if (tagFilter !== 'all') {
    posts = posts.filter(p => p.tags.includes(tagFilter));
  }
  const all = loadPosts();
  return posts.map(post => ({
    ...post,
    liveSimilarCount: getSimilarCountForPost(post, all, 7)
  }));
}

function getUserPosts(userId) {
  const all = loadPosts();
  return all.filter(post => post.authorId === userId);
}

window.kathaaPosts = {
  loadPosts,
  addNewPost,
  getFilteredPosts,
  getSimilarCountForPost,
  savePosts,
  getUserPosts
};