const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        match: /^[A-Za-z]{3,}$/ // Alphabets only, min 3 characters
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Basic email format
    },
    image: {
        public_id: String, // Cloudinary public ID
        url: String // Cloudinary URL
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);