const User = require("../models/User");
const Joi = require("joi");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djijdozmj',
    api_key: process.env.CLOUDINARY_API_KEY || '538554776193533',
    api_secret: process.env.CLOUDINARY_API_SECRET || '6GytpqsQ7ygW-s63rcjfdhaMNNo'
});

// Validation schema
const validateUser = (data) => {
    const schema = Joi.object({
        username: Joi.string().regex(/^[A-Za-z]{3,}$/).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
    });
    return schema.validate(data);
};

// Create User
const createUser = async (req, res) => {
    try {
        // Validate input
        const { error } = validateUser(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { username, email, password } = req.body;

        // Check for existing user
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
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

        // Create new user
        const newUser = new User({
            username,
            email,
            password, // Note: In production, hash the password before saving
            image: imageData
        });

        await newUser.save();

        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single user
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update user with partial updates
const updateUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Find the existing user
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

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

        if (password && password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        // Check for existing user with same username or email (only if those fields are being updated)
        if (username || email) {
            const queryConditions = [
                { _id: { $ne: req.params.id } } // Exclude current user
            ];
            
            const orConditions = [];
            if (username) orConditions.push({ username });
            if (email) orConditions.push({ email });
            
            if (orConditions.length > 0) {
                queryConditions.push({ $or: orConditions });
            }
            
            const existingUser = await User.findOne({ $and: queryConditions });
            if (existingUser) {
                return res.status(400).json({ message: "Username or email already exists" });
            }
        }

        // Prepare update data
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (password) updateData.password = password; // Note: Hash password in production

        // Handle image update if present
        if (req.file) {
            // First delete old image if exists
            if (user.image?.public_id) {
                await cloudinary.uploader.destroy(user.image.public_id);
            }

            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path);
            updateData.image = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Delete image from Cloudinary if exists
        if (user.image?.public_id) {
            await cloudinary.uploader.destroy(user.image.public_id);
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
};