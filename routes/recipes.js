const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  store,
  getRecipeStats,
  getThreadedComments
} = require("../data/store");

const upload = multer({ dest: "uploads/" });

// Temporary recipe storage (until you add a database)
// Phase 1: uses shared in-memory store so ratings/comments can attach to recipes

// MAIN PAGE — view all recipes
router.get("/", (req, res) => {
  const recipesWithStats = store.recipes.map((recipe) => ({
    ...recipe,
    stats: getRecipeStats(recipe.id)
  }));

  res.render("index", {
    recipes: recipesWithStats,
    user: req.session.user || null
  });
});

// FORM PAGE — submit a recipe
router.get("/submit", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("submit", { user: req.session.user || null });
});

// HANDLE FORM SUBMISSION
router.post("/submit", upload.single("photo"), (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const recipe = {
    id: Date.now(), // unique ID
    title: req.body.title,
    ingredients: req.body.ingredients,
    instructions: req.body.instructions,
    tags: Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags],
    cuisine: req.body.cuisine,
    mealType: req.body.mealType,
    cookTime: req.body.cookTime,
    difficulty: req.body.difficulty,
    photo: req.file ? req.file.filename : null,
    authorId: req.session.user.id,
    authorUsername: req.session.user.username
  };

  store.recipes.push(recipe);
  res.redirect("/");
});

// RECIPE DETAIL — average rating, review count, threaded comments
router.get("/recipe/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = store.recipes.find((r) => r.id === id);

  if (!recipe) return res.send("Recipe not found");

  const stats = getRecipeStats(id);
  const comments = getThreadedComments(id);
  const userRating = req.session.user
    ? store.ratings.find(
        (r) => r.recipeId === id && r.userId === req.session.user.id
      )
    : null;

  res.render("recipe", {
    recipe,
    stats,
    comments,
    userRating,
    user: req.session.user || null
  });
});

// RATE A RECIPE (1–5 stars)
router.post("/recipe/:id/rate", (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = store.recipes.find((r) => r.id === id);

  if (!recipe) return res.send("Recipe not found");
  if (!req.session.user) return res.redirect("/login");

  const stars = parseInt(req.body.stars);
  if (!stars || stars < 1 || stars > 5) {
    return res.redirect(`/recipe/${id}`);
  }

  const existing = store.ratings.find(
    (r) => r.recipeId === id && r.userId === req.session.user.id
  );

  if (existing) {
    existing.stars = stars;
  } else {
    store.ratings.push({
      id: Date.now(),
      recipeId: id,
      userId: req.session.user.id,
      username: req.session.user.username,
      stars
    });
  }

  res.redirect(`/recipe/${id}`);
});

// ADD A COMMENT OR REPLY (threaded via parentId)
router.post("/recipe/:id/comment", (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = store.recipes.find((r) => r.id === id);

  if (!recipe) return res.send("Recipe not found");
  if (!req.session.user) return res.redirect("/login");

  const body = (req.body.body || "").trim();
  if (!body) return res.redirect(`/recipe/${id}`);

  const parentId = req.body.parentId ? parseInt(req.body.parentId) : null;

  store.comments.push({
    id: Date.now(),
    recipeId: id,
    userId: req.session.user.id,
    username: req.session.user.username,
    body,
    parentId,
    createdAt: Date.now()
  });

  res.redirect(`/recipe/${id}`);
});

// EDIT RECIPE
router.get("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = store.recipes.find(r => r.id === id);

  if (!recipe) return res.send("Recipe not found");

  res.render("edit", { recipe, user: req.session.user || null });
});

router.post("/edit/:id", upload.single("photo"), (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = store.recipes.find(r => r.id === id);

  if (!recipe) return res.send("Recipe not found");

  // Update fields
  recipe.title = req.body.title;
  recipe.ingredients = req.body.ingredients;
  recipe.instructions = req.body.instructions;
  recipe.cuisine = req.body.cuisine;
  recipe.mealType = req.body.mealType;
  recipe.cookTime = req.body.cookTime;
  recipe.difficulty = req.body.difficulty;

  // Tags: convert comma-separated string → array
  if (Array.isArray(req.body.tags)) {
  recipe.tags = req.body.tags;
} else if (typeof req.body.tags === "string") {
  recipe.tags = [req.body.tags];
} else {
  recipe.tags = [];
}


  // Update photo if new one uploaded
  if (req.file) {
    recipe.photo = req.file.filename;
  }

  res.redirect("/");
});

// DELETE RECIPE — only the author can delete
router.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = store.recipes.find((r) => r.id === id);

  if (!recipe) return res.send("Recipe not found");
  if (!req.session.user || recipe.authorId !== req.session.user.id) {
    return res.status(403).send("Only the author can delete this recipe.");
  }

  store.recipes = store.recipes.filter((r) => r.id !== id);
  res.redirect("/");
});

module.exports = router;
