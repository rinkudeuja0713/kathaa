const POSTS_STORAGE = 'kathaa_posts';

function loadPosts() {
  const stored = localStorage.getItem(POSTS_STORAGE);
  if (stored) return JSON.parse(stored);
  // initial sample posts (anonymous – no author)
  const initial = [
    { id: 'p1', text: "I miss home so much. The dal bhaat, aama's voice, my favorite street corner. Everything here feels cold and empty.", tags: ["homesick"], moodEmoji: "🏠", timestamp: Date.now() - 2*3600000, similarCountCache: 142, authorId: null },
    { id: 'p2', text: "Been sending money home and barely have enough for rent. The pressure is crushing me. How do other students do this?", tags: ["financial"], moodEmoji: "💰", timestamp: Date.now() - 4*3600000, similarCountCache: 89, authorId: null },
    { id: 'p3', text: "Why am I here? Everyone else seems to fit in. I feel like an outsider in everything.", tags: ["lonely"], moodEmoji: "🕯️", timestamp: Date.now() - 5*3600000, similarCountCache: 156, authorId: null },
    { id: 'p4', text: "The fear of visa rejection is killing me. I can't sleep, can't focus. What if I have to go back?", tags: ["anxious"], moodEmoji: "💢", timestamp: Date.now() - 6*3600000, similarCountCache: 67, authorId: null },
    { id: 'p5', text: "Nothing is the same. The food tastes different, the weather feels wrong, people think differently. I don't belong anywhere anymore.", tags: ["culture-shock"], moodEmoji: "🇳🇵", timestamp: Date.now() - 7*3600000, similarCountCache: 203, authorId: null }
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
  if (tags.includes('anxious')) return '💢';
  if (tags.includes('homesick')) return '🏠';
  if (tags.includes('lonely')) return '🕯️';
  if (tags.includes('financial')) return '💰';
  if (tags.includes('culture-shock')) return '🇳🇵';
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