const { Sequelize, DataTypes } = require("sequelize");

const handler = new Sequelize("sqlite:db.sqlite");

exports.categories = handler.define(
  "category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "categorytable",
  },
);

exports.recipes = handler.define(
  "recipe",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ingredients: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categorytable",
        key: "id",
      },
    },
  },
  {
    tableName: "recipetable",
  },
);

exports.users = handler.define("usertable", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

exports.categories.hasMany(exports.recipes, { foreignKey: "categoryId" });
exports.recipes.belongsTo(exports.categories, {
  foreignKey: "categoryId",
  targetKey: "id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

handler.sync();
