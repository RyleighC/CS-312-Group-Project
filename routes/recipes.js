const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

// Temporary recipe storage (until you add a database)
let recipes = [];

// MAIN PAGE — view all recipes
router.get("/", (req, res) => {
  res.render("index", { recipes });
});

// FORM PAGE — submit a recipe
router.get("/submit", (req, res) => {
  res.render("submit");
});

// HANDLE FORM SUBMISSION
router.post("/submit", upload.single("photo"), (req, res) => {
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
    photo: req.file ? req.file.filename : null
  };

  recipes.push(recipe);
  res.redirect("/");
});

// EDIT RECIPE
router.get("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = recipes.find(r => r.id === id);

  if (!recipe) return res.send("Recipe not found");

  res.render("edit", { recipe });
});

router.post("/edit/:id", upload.single("photo"), (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = recipes.find(r => r.id === id);

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

// DELETE RECIPE
router.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  recipes = recipes.filter(recipe => recipe.id !== id);
  res.redirect("/");
});

module.exports = router;
