const express = require('express');
const router = express.Router();
const user = require('../controllers/user.js');

router.post('/registerUser',    user.registerUser);
router.post('/login',           user.loginUser);
router.get('/user',             user.verify_jwt, user.selectAllUsers);
router.get('/user/:user_id',    user.verify_jwt, user.selectUser);
router.put('/user/:user_id',    user.verify_jwt, user.updateUser);
router.delete('/user/:user_id', user.verify_jwt, user.deleteUser);
router.patch('/user/:user_id',  user.verify_jwt, user.patchUser);

module.exports = router;