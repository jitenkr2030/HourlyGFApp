const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on field name
    if (file.fieldname === 'profilePhoto' || file.fieldname === 'photos') {
      uploadPath = 'uploads/profiles/';
    } else if (file.fieldname === 'reviewPhoto') {
      uploadPath = 'uploads/reviews/';
    } else if (file.fieldname === 'verification') {
      uploadPath = 'uploads/verification/';
    } else if (file.fieldname === 'chatMedia') {
      uploadPath = 'uploads/chat/';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = process.env.ALLOWED_FILE_TYPES 
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
});

// Export different upload configurations
exports.uploadSingle = (fieldName) => upload.single(fieldName);
exports.uploadMultiple = (fieldName, maxCount) => upload.array(fieldName, maxCount);
exports.uploadFields = (fields) => upload.fields(fields);

// Upload profile photo
exports.uploadProfilePhoto = upload.single('profilePhoto');

// Upload multiple photos (max 6)
exports.uploadPhotos = upload.array('photos', 6);

// Upload verification documents
exports.uploadVerification = upload.array('verification', 3);

// Upload review photos
exports.uploadReviewPhotos = upload.array('reviewPhoto', 5);

// Upload chat media
exports.uploadChatMedia = upload.single('chatMedia');

module.exports = exports;
