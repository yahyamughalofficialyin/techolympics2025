/* eslint-disable no-undef */
const Role = require("../models/Role");
const Joi = require("joi");

const validateRole = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        status: Joi.string().valid("active", "inactive").required(),
        limit: Joi.number().required(),
    });
    return schema.validate(data);
};

// Create Role
createRole = async (req, res) => {
    try {
        const { error } = validateRole(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });
    
        const { name, status, limit } = req.body;
    
        // Check if a Role already exists based on name
        const existingRole = await Role.findOne({ name });
    
        if (existingRole) {
            return res.status(400).json({ message: "Role already exists!" });
        }
    
        // Create new Role if no existing Role matches
        const newRole = new Role({ name, status, limit });
        await newRole.save();
    
        res.status(201).json({ message: "Role created successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

readallRole = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

readRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: "Role not found!" });
        res.status(200).json(role);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateRole = async (req, res) => {
    try {
        // Allowed fields
        const allowedFields = ["name", "status", "limit"];
        
        // Validate if any invalid fields were provided
        const invalidFields = Object.keys(req.body).filter(
            field => !allowedFields.includes(field)
        );
        
        if (invalidFields.length > 0) {
            return res.status(400).json({ 
                message: `Invalid fields: ${invalidFields.join(", ")}` 
            });
        }

        // Create validation schema (all fields optional for partial update)
        const schema = Joi.object({
            name: Joi.string().min(3),
            status: Joi.string().valid("active", "inactive"),
            limit: Joi.number().min(1)
        });

        // Validate the input
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Find the existing role
        const existingRole = await Role.findById(req.params.id);
        if (!existingRole) {
            return res.status(404).json({ message: "Role not found!" });
        }

        // Merge existing data with new data (for partial updates)
        const updatedData = {
            name: req.body.name !== undefined ? req.body.name : existingRole.name,
            status: req.body.status !== undefined ? req.body.status : existingRole.status,
            limit: req.body.limit !== undefined ? req.body.limit : existingRole.limit
        };

        // Update the role
        const updatedRole = await Role.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Role updated successfully!",
            role: updatedRole
        });
    } catch (err) {
        console.error("Error updating Role:", err);
        res.status(500).json({ message: err.message });
    }
};

deleteRole = async (req, res) => {
    try {
        const role = await Role.findByIdAndDelete(req.params.id);
        if (!role) return res.status(404).json({ message: "Role not found!" });
        
        res.status(200).json({ message: "Role deleted successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createRole,
    readallRole,
    readRole,
    updateRole,
    deleteRole
};