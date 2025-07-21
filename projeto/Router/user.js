const express = require('express');
const router = express.Router();
const user = require('../controllers/user.js');
const token = require('../middleware/token.js');

router.post('/registerUser',                       user.registerUser);
router.post('/login',                              user.loginUser);
router.get('/users',             token.verify_jwt, user.selectAllUsers);
router.get('/users/:user_id',    token.verify_jwt, user.selectUser);
router.put('/users/:user_id',    token.verify_jwt, user.updateUser);
router.delete('/users/:user_id', token.verify_jwt, user.deleteUser);
router.patch('/users/:user_id',  token.verify_jwt, user.patchUser);

module.exports = router;