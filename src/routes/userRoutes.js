const router = express.Router();
const userController = require('../controllers/userController');

// Route for user signup
router.post('/signup', userController.postSignup);

// Route for Google OAuth
router.post('/auth/google', userController.postGoogleAuth);


// Update user profile route
router.put('/user:id/update', userController.updateUserProfile);

// GET user profile route
router.get('/users/:id/profile', userController.getUserProfile);
