require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Joi = require("joi");
const cors = require("cors");
const session = require("express-session");
const upload = require("./middleware/upload");

// Importing Controllers
const roleController = require("./controllers/roleController");
const userController = require("./controllers/userController");
const categoryController = require("./controllers/categoryController");
const productController = require("./controllers/productController");

const app = express();

app.use(
  session({
    secret: process.env.SESSIONCODE,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  })
);

const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Connect to MongoDB Atlas
connectDB();

// **********************************************************ROLE CRUD**********************************************************

// **1. CREATE - Add Role**
app.post("/api/role/create", roleController.createRole);

// **2. READ - Get All Roles**
app.get("/api/role/", roleController.readallRole);

// **3. READ - Get Role by ID**
app.get("/api/role/:id", roleController.readRole);

// **4. UPDATE - Update Role by ID**
app.put("/api/role/update/:id", roleController.updateRole);

// **5. DELETE - Delete Role by ID**
app.delete("/api/role/delete/:id", roleController.deleteRole);

// **********************************************************USER CRUD**********************************************************
// Create User (with image upload)
app.post("/api/user/create", upload.single("image"), userController.createUser);

// Get all users
app.get("/api/user/", userController.getAllUsers);

// Get single user
app.get("/api/user/:id", userController.getUser);

// Update user (with optional image upload)
app.put("/api/user/update/:id", upload.single("image"), userController.updateUser);

// Delete user
app.delete("/api/user/delete/:id", userController.deleteUser);


// **********************************************************CATEGORY CRUD**********************************************************

// **1. CREATE - Add Category**
app.post("/api/category/create", categoryController.createCategory);

// **2. READ - Get All Categories**
app.get("/api/category/", categoryController.getAllCategories);

// **3. READ - Get Category by ID**
app.get("/api/category/:id", categoryController.getCategory);

// **4. UPDATE - Update Category by ID**
app.put("/api/category/update/:id", categoryController.updateCategory);

// **5. DELETE - Delete Category by ID**
app.delete("/api/category/delete/:id", categoryController.deleteCategory);

// **********************************************************PRODUCT CRUD**********************************************************

// 1. CREATE - Add Product (with required image upload)
app.post("/api/product/create", upload.single("image"), productController.createProduct);

// 2. READ - Get All Products
app.get("/api/product/", productController.getAllProducts);

// 3. READ - Get Product by ID
app.get("/api/product/:id", productController.getProduct);

// 4. UPDATE - Update Product by ID (with optional image upload)
app.put("/api/product/update/:id", upload.single("image"), productController.updateProduct);

// 5. DELETE - Delete Product by ID
app.delete("/api/product/delete/:id", productController.deleteProduct);

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));