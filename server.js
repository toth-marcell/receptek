import express from "express";
import jwt from "jsonwebtoken";
import { Category, Recipe, User } from "./dbhandler.js";
import { Sequelize } from "sequelize";

import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT;
const SECRETKEY = process.env.SECRETKEY;

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Felhasználónév és jelszó kötelező!" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Hibás adatok!" });
    }

    if (user.password != password) {
      return res.status(401).json({ message: "Hibás adatok!" });
    }

    const token = jwt.sign({ userId: user.id }, SECRETKEY, {
      expiresIn: "1h",
    });

    res.json({ message: "Sikeres bejelentkezés!", token });
  } catch (error) {
    console.error("Hiba a bejelentkezés során:", error);
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Hozzáférés megtagadva!" });
  }

  jwt.verify(token, SECRETKEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Érvénytelen token!" });
    }
    req.user = user;
    next();
  });
}

app.get("/users/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Felhasználó nem található!" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

app.post("/recipes", async (req, res) => {
  try {
    const { name, ingredients /*, categoryId */ } = req.body;

    if (!name || !ingredients /* || !categoryId*/) {
      return res
        .status(400)
        .json({ message: "Minden mező kitöltése kötelező!" });
    }

    /*const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({message: "Nem található ilyen kategória!"});
        }*/

    await Recipe.create({
      name,
      ingredients, //,
      //categoryId
    });

    res.status(201).json({ message: "Sikeres létrehozás" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Szerverhiba történt a létrehozás során" });
  }
});

app.get("/recipes", async (req, res) => {
  const { category, ingredient } = req.query;
  const where = {};
  const include = [];

  if (category) {
    include.push({
      model: Category,
      where: {
        name: {
          [Sequelize.Op.like]: `%${category}%`,
        },
      },
      required: true,
    });
  }

  if (ingredient) {
    where.ingredients = {
      [Sequelize.Op.like]: `%${ingredient}%`,
    };
  }

  try {
    const results = await Recipe.findAll({
      where,
      include,
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hiba a szűrés során" });
  }
});

app.get("/categories/popular", async (req, res) => {
  try {
    const popularCategories = await Recipe.findAll({
      attributes: [
        "categoryId",
        [Sequelize.fn("COUNT", Sequelize.col("recipe.categoryId")), "count"],
      ],
      include: [
        {
          model: Category,
          attributes: ["name"],
          required: true,
        },
      ],
      group: ["recipe.categoryId", "category.name"], // Itt a modell alias-okat használjuk!
      order: [[Sequelize.literal("count"), "DESC"]],
      limit: 10,
      raw: true,
      nest: true,
    });

    res.json(popularCategories);
  } catch (error) {
    console.error(error); // Hibakereséshez
    res
      .status(500)
      .json({ message: "Hiba a legnépszerűbb kategóriák lekérdezésekor" });
  }
});

app.delete("/recipes/:id", async (req, res) => {
  try {
    const deleted = await Recipe.destroy({
      where: { id: parseInt(req.params.id) },
    });
    if (deleted) {
      res.json({ message: "Recept sikeresen törölve" });
    } else {
      res.status(404).json({ message: "Nem található recept ezzel az ID-vel" });
    }
  } catch (error) {
    res.status(500).json({ message: "Hiba történt a törlés során" });
  }
  res.end();
});

app.get("/recipes/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(parseInt(req.params.id));
    if (recipe) {
      res.json(recipe);
    } else {
      res.status(404).json({ message: "Nincs ilyen ID-jű recept" });
    }
  } catch (error) {
    res.status(500).json({ message: "Szerverhiba történt" });
  }
});

app.get("/recipes/title/:title", async (req, res) => {
  try {
    const title = req.params.title;
    // exact match; for partial search uncomment Op and adjust accordingly
    const recipes = await Recipe.findAll({
      where: { name: title },
      // for partial: where: { name: { [Sequelize.Op.like]: `%${title}%` } }
    });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: "Hiba a keresés során" });
  }
});

app.put("/recipes/:id", async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const [updated] = await Recipe.update(
      {
        name: req.body.name,
        ingredients: req.body.ingredients,
      },
      {
        where: { id: recipeId },
      },
    );
    if (updated) {
      res.json({ message: "Recept sikeresen frissítve" });
    } else {
      res.status(404).json({ message: "Nem található recept ezzel az ID-vel" });
    }
  } catch (error) {
    res.status(500).json({ message: "Szerverhiba történt" });
  }
});

app.post("/users/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Felhasználónév és jelszó kötelező!" });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Ez a felhasználónév már foglalt!" });
    }

    const newUser = await User.create({ username, password });
    res
      .status(201)
      .json({ message: "Sikeres regisztráció!", userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: "Szerverhiba történt" });
  }
});

app.post("/recipes/:id/ingredients", async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const newIngredient = req.body.name;

    if (!newIngredient) {
      return res.status(400).json({ message: "Hozzávaló név kötelező!" });
    }

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recept nem található!" });
    }

    const currentIngredients = recipe.ingredients || "";
    const updatedIngredients = currentIngredients
      ? currentIngredients + ", " + newIngredient
      : newIngredient;

    recipe.ingredients = updatedIngredients;
    await recipe.save();

    res.json({
      message: "Hozzávaló hozzáadva!",
      ingredients: updatedIngredients,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

app.get("/recipes/:id/ingredients", async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recept nem található!" });
    }

    const ingredients = await dbhandler.ingredients.findAll({
      where: { recipeId },
    });
    res.json(ingredients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

app.delete("/ingredients/:id", async (req, res) => {
  try {
    const ingredientId = parseInt(req.params.id);

    const deleted = await dbhandler.ingredients.destroy({
      where: { id: ingredientId },
    });
    if (deleted) {
      res.json({ message: "Hozzávaló törölve!" });
    } else {
      res.status(404).json({ message: "Nincs ilyen ID-jű hozzávaló!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

app.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "A kategória neve kötelező!" });
    }
    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ message: "Ez a kategória már létezik!" });
    }
    const newCategory = await Category.create({ name });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Hiba történt a kategória létrehozásakor" });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Hiba történt a kategóriák lekérdezésekor" });
  }
});

app.put("/recipes/:id/category", async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const { categoryId } = req.body;

    if (!categoryId) {
      return res
        .status(400)
        .json({ message: "A kategória azonosítója kötelező!" });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ message: "Nem található ilyen kategória!" });
    }

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Nem található ilyen recept!" });
    }

    recipe.categoryId = categoryId; // FONTOS: ide a categoryId kell
    await recipe.save();

    res.json({
      message: "Kategória sikeresen hozzárendelve a recepthez",
      recipe,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Hiba történt a kategória hozzárendelése során" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
