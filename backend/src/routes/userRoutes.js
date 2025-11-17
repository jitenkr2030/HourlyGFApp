const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadPhotos, uploadVerification } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

const {
  getProfile,
  updateProfile,
  uploadPhotos: uploadPhotosController,
  deletePhoto,
  submitVerification,
  updatePreferences
} = require('../controllers/userController');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/photos', uploadLimiter, uploadPhotos, uploadPhotosController);
router.delete('/photos/:photoId', deletePhoto);
router.post('/verify', uploadLimiter, uploadVerification, submitVerification);
router.put('/preferences', updatePreferences);

module.exports = router;
