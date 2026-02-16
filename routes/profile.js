const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isLoggedIn } = require('../routes/auth'); // check this path too
const multer = require('multer');

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, req.session.userId + '-' + Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Routes
router.get('/', isLoggedIn, profileController.getProfile);
router.post('/update', isLoggedIn, upload.single('avatar'), profileController.updateProfile);
router.post('/change-password', isLoggedIn, profileController.changePassword);
router.post('/delete-account', isLoggedIn, profileController.deleteAccount);

module.exports = router;
