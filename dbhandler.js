import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize("sqlite:data/db.sqlite");

export const Category = sequelize.define("Category", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

export const Recipe = sequelize.define("Recipe", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ingredients: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Category.hasMany(Recipe, { foreignKey: "categoryId" });
Recipe.belongsTo(Category, {
  foreignKey: "categoryId",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

await sequelize.sync();
