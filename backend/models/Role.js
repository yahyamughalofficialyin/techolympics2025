const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        required: true,
    },
    limit: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model("Role", roleSchema);