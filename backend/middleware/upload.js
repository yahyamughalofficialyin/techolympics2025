const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djijdozmj',
    api_key: process.env.CLOUDINARY_API_KEY || '538554776193533',
    api_secret: process.env.CLOUDINARY_API_SECRET || '6GytpqsQ7ygW-s63rcjfdhaMNNo'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "user-profiles",
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ width: 500, height: 500, crop: "limit" }]
    }
});

const upload = multer({ storage: storage });

module.exports = upload;