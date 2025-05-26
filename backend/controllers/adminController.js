const Admin = require("../models/Admin");
const Role = require("../models/Role");
const Joi = require("joi");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");

// Configure Cloudinary (same as user controller)
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
        role: Joi.string().hex().length(24).required() // MongoDB ObjectId validation
    });
    return schema.validate(data);
};

// Login validation schema
const validateLogin = (data) => {
    const schema = Joi.object({
        username: Joi.string().required(),
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Handle image upload if present
        let imageData = {};
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageData = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        // Create new admin
        const newAdmin = new Admin({
            username,
            email,
            password: hashedPassword,
            image: imageData,
            role
        });

        await newAdmin.save();

        res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin Login
const loginAdmin = async (req, res) => {
    try {
        // Validate input
        const { error } = validateLogin(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { username, password } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ username }).populate('role', 'name status limit');
        if (!admin) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Create session
        req.session.admin = {
            id: admin._id,
            username: admin.username,
            role: admin.role,
            email: admin.email
        };

        res.status(200).json({ 
            message: "Login successful",
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                image: admin.image
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin Logout
const logoutAdmin = async (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: "Could not log out, please try again" });
            }
            res.clearCookie('connect.sid'); // The default name for the session cookie
            res.status(200).json({ message: "Logout successful" });
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get current admin session
const getCurrentAdmin = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const admin = await Admin.findById(req.session.admin.id)
            .populate('role', 'name status limit')
            .select('-password'); // Exclude password from the response

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json(admin);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().populate('role', 'name status limit').select('-password');
        res.status(200).json(admins);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single admin
const getAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).populate('role', 'name status limit').select('-password');
        if (!admin) return res.status(404).json({ message: "Admin not found" });
        res.status(200).json(admin);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update admin with partial updates
const updateAdmin = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Find the existing admin
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        // Validate individual fields if they are provided
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

        // Check if role exists if provided
        if (role) {
            const validRole = await Role.findById(role);
            if (!validRole) {
                return res.status(400).json({ message: "Invalid role specified" });
            }
        }

        // Check for existing admin with same username or email
        if (username || email) {
            const queryConditions = [
                { _id: { $ne: req.params.id } } // Exclude current admin
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
        if (role) updateData.role = role;

        // Handle password update if provided
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Handle image update if present
        if (req.file) {
            // First delete old image if exists
            if (admin.image?.public_id) {
                await cloudinary.uploader.destroy(admin.image.public_id);
            }

            // Upload new image
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
        ).populate('role', 'name status limit').select('-password');

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

        // Delete image from Cloudinary if exists
        if (admin.image?.public_id) {
            await cloudinary.uploader.destroy(admin.image.public_id);
        }

        // If the deleted admin is the currently logged-in admin, destroy the session
        if (req.session.admin && req.session.admin.id === req.params.id) {
            req.session.destroy();
        }

        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createAdmin,
    loginAdmin,
    logoutAdmin,
    getCurrentAdmin,
    getAllAdmins,
    getAdmin,
    updateAdmin,
    deleteAdmin
};