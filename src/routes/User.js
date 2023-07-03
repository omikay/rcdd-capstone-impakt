const express = require('express');
const router = express.Router();

const userController = require('../controllers/UserController');
const { check } = require('express-validator');
const auth = require('../middleware/auth');



//Route to update user information
router.put('/update', auth, [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({
        min: 6
    }
    )
], userController.updateUser);



module.exports = router;