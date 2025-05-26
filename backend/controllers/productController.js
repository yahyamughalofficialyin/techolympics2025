const Product = require("../models/Product");
const Category = require("../models/Category");
const Joi = require("joi");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary (you can reuse the same config)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djijdozmj',
    api_key: process.env.CLOUDINARY_API_KEY || '538554776193533',
    api_secret: process.env.CLOUDINARY_API_SECRET || '6GytpqsQ7ygW-s63rcjfdhaMNNo'
});

// Validation schema
const validateProduct = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        price: Joi.number().min(0).required(),
        category: Joi.string().hex().length(24).required() // MongoDB ObjectId validation
    });
    return schema.validate(data);
};

// Create Product
const createProduct = async (req, res) => {
    try {
        // Validate input
        const { error } = validateProduct(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, price, category } = req.body;

        // Check if category exists
        const validCategory = await Category.findById(category);
        if (!validCategory) {
            return res.status(400).json({ message: "Invalid category specified" });
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

        // Create new product
        const newProduct = new Product({
            name,
            price,
            image: imageData,
            category
        });

        await newProduct.save();

        // Update category count
        await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });

        res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category', 'name count');
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single product
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name count');
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update product with partial updates
const updateProduct = async (req, res) => {
    try {
        const { name, price, category } = req.body;

        // Find the existing product
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Validate individual fields if they are provided
        if (name && (name.length < 3 || name.length > 100)) {
            return res.status(400).json({ message: "Name must be between 3 and 100 characters" });
        }

        if (price && price < 0) {
            return res.status(400).json({ message: "Price must be a positive number" });
        }

        // Check if category exists if provided
        let oldCategory = null;
        if (category) {
            const validCategory = await Category.findById(category);
            if (!validCategory) {
                return res.status(400).json({ message: "Invalid category specified" });
            }
            oldCategory = product.category; // Store old category for count update
        }

        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name;
        if (price) updateData.price = price;
        if (category) updateData.category = category;

        // Handle image update if present
        if (req.file) {
            // First delete old image if exists
            if (product.image?.public_id) {
                await cloudinary.uploader.destroy(product.image.public_id);
            }

            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path);
            updateData.image = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('category', 'name count');

        // Update category counts if category was changed
        if (category && oldCategory && !oldCategory.equals(category)) {
            await Category.findByIdAndUpdate(oldCategory, { $inc: { count: -1 } });
            await Category.findByIdAndUpdate(category, { $inc: { count: 1 } });
        }

        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Delete image from Cloudinary if exists
        if (product.image?.public_id) {
            await cloudinary.uploader.destroy(product.image.public_id);
        }

        // Update category count
        await Category.findByIdAndUpdate(product.category, { $inc: { count: -1 } });

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct
};