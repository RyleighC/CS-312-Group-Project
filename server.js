const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "flavorforge-phase1-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
app.use("/", authRoutes);
app.use("/", recipeRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`FlavorForge running on port ${PORT}`);
});

