require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Joi = require("joi");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const upload = require("./middleware/upload");

// Importing Controllers
const roleController = require("./controllers/roleController");
const userController = require("./controllers/userController");
const adminController = require("./controllers/adminController");
const categoryController = require("./controllers/categoryController");
const productController = require("./controllers/productController");

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Enhanced CORS configuration
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced Session Configuration
app.use(
  session({
    name: 'hotel.sid', // Session ID cookie name
    secret: process.env.SESSIONCODE || 'your-strong-secret-here', // Use environment variable
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Your MongoDB connection string
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
      autoRemove: 'native' // Automatically remove expired sessions
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  })
);

// Session debugging middleware (optional)
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});

const PORT = process.env.PORT || 5000;

// **********************************************************
// HEALTH CHECK ENDPOINT
// **********************************************************
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    session: req.session,
    sessionId: req.sessionID
  });
});

// **********************************************************
// ROLE CRUD
// **********************************************************
app.post("/api/role/create", roleController.createRole);
app.get("/api/role/", roleController.readallRole);
app.get("/api/role/:id", roleController.readRole);
app.put("/api/role/update/:id", roleController.updateRole);
app.delete("/api/role/delete/:id", roleController.deleteRole);

// **********************************************************
// USER CRUD
// **********************************************************
app.post("/api/user/create", upload.single("image"), userController.createUser);
app.get("/api/user/", userController.getAllUsers);
app.get("/api/user/:id", userController.getUser);
app.put("/api/user/update/:id", upload.single("image"), userController.updateUser);
app.delete("/api/user/delete/:id", userController.deleteUser);

// **********************************************************
// ADMIN CRUD
// **********************************************************
app.post("/api/admin/create", upload.single("image"), adminController.createAdmin);
app.post("/api/admin/login", adminController.loginAdmin);
app.post("/api/admin/logout", adminController.logoutAdmin);
app.get("/api/admin/check-session", adminController.checkAdminSession);
app.get("/api/admin/", adminController.getAllAdmins);
app.get("/api/admin/:id", adminController.getAdmin);
app.put("/api/admin/update/:id", upload.single("image"), adminController.updateAdmin);
app.delete("/api/admin/delete/:id", adminController.deleteAdmin);

// **********************************************************
// CATEGORY CRUD
// **********************************************************
app.post("/api/category/create", categoryController.createCategory);
app.get("/api/category/", categoryController.getAllCategories);
app.get("/api/category/:id", categoryController.getCategory);
app.put("/api/category/update/:id", categoryController.updateCategory);
app.delete("/api/category/delete/:id", categoryController.deleteCategory);

// **********************************************************
// PRODUCT CRUD
// **********************************************************
app.post("/api/product/create", upload.single("image"), productController.createProduct);
app.get("/api/product/", productController.getAllProducts);
app.get("/api/product/:id", productController.getProduct);
app.put("/api/product/update/:id", upload.single("image"), productController.updateProduct);
app.delete("/api/product/delete/:id", productController.deleteProduct);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Session secret: ${process.env.SESSIONCODE || 'using-fallback-secret'}`);
});