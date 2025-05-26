const Category = require("../models/Category");
const Joi = require("joi");

// Validation schema
const validateCategory = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
        count: Joi.number().min(0).default(0)
    });
    return schema.validate(data);
};

// Create Category
const createCategory = async (req, res) => {
    try {
        const { error } = validateCategory(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, count } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists!" });
        }

        const newCategory = new Category({ name, count });
        await newCategory.save();

        res.status(201).json({ 
            message: "Category created successfully!",
            category: newCategory
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all Categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single Category
const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found!" });
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Category (PUT - supports partial updates)
const updateCategory = async (req, res) => {
    try {
        // Allowed fields
        const allowedFields = ["name", "count"];
        
        // Validate fields
        const invalidFields = Object.keys(req.body).filter(
            field => !allowedFields.includes(field)
        );
        
        if (invalidFields.length > 0) {
            return res.status(400).json({ 
                message: `Invalid fields: ${invalidFields.join(", ")}` 
            });
        }

        // Validation schema
        const schema = Joi.object({
            name: Joi.string().min(2),
            count: Joi.number().min(0)
        });

        const { error } = schema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Check if name already exists (if name is being updated)
        if (req.body.name) {
            const existingCategory = await Category.findOne({ 
                name: req.body.name,
                _id: { $ne: req.params.id } // Exclude current category
            });
            if (existingCategory) {
                return res.status(400).json({ message: "Category name already exists!" });
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: "Category not found!" });
        }

        res.status(200).json({
            message: "Category updated successfully!",
            category: updatedCategory
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found!" });
        
        res.status(200).json({ message: "Category deleted successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategory,
    updateCategory,
    deleteCategory
};