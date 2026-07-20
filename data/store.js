// In-memory storage for Phase 1 (resets when the server restarts)

const store = {
  recipes: [],
  users: [],
  // { id, recipeId, userId, username, stars (1-5) }
  ratings: [],
  // { id, recipeId, userId, username, body, parentId, createdAt }
  comments: []
};

function getRecipeStats(recipeId) {
  const recipeRatings = store.ratings.filter((r) => r.recipeId === recipeId);
  const count = recipeRatings.length;
  const average =
    count === 0
      ? 0
      : recipeRatings.reduce((sum, r) => sum + r.stars, 0) / count;

  return {
    average: Math.round(average * 10) / 10,
    count
  };
}

function getThreadedComments(recipeId) {
  const comments = store.comments
    .filter((c) => c.recipeId === recipeId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const byId = new Map();
  comments.forEach((c) => {
    byId.set(c.id, { ...c, replies: [] });
  });

  const roots = [];
  byId.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId).replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  // Flatten with depth so EJS can render without recursive partials
  const flat = [];
  function walk(nodes, depth) {
    nodes.forEach((node) => {
      flat.push({
        id: node.id,
        username: node.username,
        body: node.body,
        depth
      });
      if (node.replies && node.replies.length) {
        walk(node.replies, depth + 1);
      }
    });
  }
  walk(roots, 0);
  return flat;
}

module.exports = {
  store,
  getRecipeStats,
  getThreadedComments
};
