const Admin = require("../models/Admin");
const Role = require("../models/Role");
const Joi = require("joi");
const bcrypt = require('bcrypt');
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djijdozmj',
    api_key: process.env.CLOUDINARY_API_KEY || '538554776193533',
    api_secret: process.env.CLOUDINARY_API_SECRET || '6GytpqsQ7ygW-s63rcjfdhaMNNo'
});

// Validation schema
const validateAdmin = (data) => {
    const schema = Joi.object({
        username: Joi.string().regex(/^[A-Za-z]{3,}$/).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        role: Joi.string().hex().length(24).required()
    });
    return schema.validate(data);
};

// Login validation schema
const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    return schema.validate(data);
};

// Create Admin
const createAdmin = async (req, res) => {
    try {
        // Validate input
        const { error } = validateAdmin(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { username, email, password, role } = req.body;

        // Check if role exists
        const validRole = await Role.findById(role);
        if (!validRole) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        // Check for existing admin
        const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existingAdmin) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        // Handle image upload if present
        let imageData = {};
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageData = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        // Create new admin with hashed password
        const newAdmin = new Admin({
            username,
            email,
            password: await bcrypt.hash(password, 10),
            image: imageData,
            role
        });

        await newAdmin.save();

        res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().populate('role', 'name status limit');
        res.status(200).json(admins);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single admin
const getAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).populate('role', 'name status limit');
        if (!admin) return res.status(404).json({ message: "Admin not found" });
        res.status(200).json(admin);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update admin
const updateAdmin = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        // Validate individual fields if provided
        if (username) {
            const usernameRegex = /^[A-Za-z]{3,}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({ message: "Username must be at least 3 letters with no numbers or special chars" });
            }
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Invalid email format" });
            }
        }

        if (password && password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        if (role) {
            const validRole = await Role.findById(role);
            if (!validRole) {
                return res.status(400).json({ message: "Invalid role specified" });
            }
        }

        // Check for existing admin with same username or email
        if (username || email) {
            const queryConditions = [
                { _id: { $ne: req.params.id } }
            ];
            
            const orConditions = [];
            if (username) orConditions.push({ username });
            if (email) orConditions.push({ email });
            
            if (orConditions.length > 0) {
                queryConditions.push({ $or: orConditions });
            }
            
            const existingAdmin = await Admin.findOne({ $and: queryConditions });
            if (existingAdmin) {
                return res.status(400).json({ message: "Username or email already exists" });
            }
        }

        // Prepare update data
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (role) updateData.role = role;

        // Handle image update
        if (req.file) {
            if (admin.image?.public_id) {
                await cloudinary.uploader.destroy(admin.image.public_id);
            }

            const result = await cloudinary.uploader.upload(req.file.path);
            updateData.image = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('role', 'name status limit');

        res.status(200).json({ message: "Admin updated successfully", admin: updatedAdmin });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete admin
const deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        if (admin.image?.public_id) {
            await cloudinary.uploader.destroy(admin.image.public_id);
        }

        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login Admin - Enhanced with more checks from old version
const loginAdmin = async (req, res) => {
    try {
        // Validate input
        const { error } = validateLogin(req.body);
        if (error) {
            console.log("Validation error:", error.details[0].message);
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password } = req.body;

        // Check if admin is already logged in
        if (req.session.adminId) {
            console.log("Admin is already logged in!");
            return res.status(400).json({ message: "Admin is already logged in!" });
        }

        // Check if email and password are provided
        if (!email || !password) {
            console.log("Email and password are required!");
            return res.status(400).json({ message: "Email and password are required!" });
        }

        // Check if admin exists
        const admin = await Admin.findOne({ email }).populate('role');
        if (!admin) {
            console.log("Invalid email or password!");
            return res.status(404).json({ message: "Invalid email or password!" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log("Invalid email or password!");
            return res.status(401).json({ message: "Invalid email or password!" });
        }

        // Save admin ID in session
        req.session.adminId = admin._id;
        await req.session.save(); // Ensure session is saved

        res.status(200).json({
            message: "Login successful!",
            adminId: admin._id,
            admin: {
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                image: admin.image
            }
        });
        console.log("Session after login:", req.session); // Log the session object
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Logout Admin - Enhanced with error handling from old version
const logoutAdmin = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Failed to logout." });
        }
        res.status(200).json({ message: "Logged out successfully." });
    });
};

// Check Admin Session - From new version
const checkAdminSession = async (req, res) => {
    try {
        if (req.session.adminId) {
            const admin = await Admin.findById(req.session.adminId).populate('role');
            if (!admin) {
                return res.status(200).json({ isLoggedIn: false });
            }
            return res.status(200).json({ 
                isLoggedIn: true,
                adminId: req.session.adminId,
                admin: {
                    _id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    image: admin.image
                }
            });
        }
        res.status(200).json({ isLoggedIn: false });
    } catch (err) {
        console.error("Session check error:", err);
        res.status(500).json({ message: "Error checking session" });
    }
};

module.exports = {
    createAdmin,
    getAllAdmins,
    getAdmin,
    updateAdmin,
    deleteAdmin,
    loginAdmin,
    logoutAdmin,
    checkAdminSession
};