const express = require('express');
const router = express.Router();

const shooping_cart = require('../controllers/shoppingCart.js');
const token = require('../middleware/token.js');

router.post('/shoopingCart', token.verify_jwt, shooping_cart.addProduct);

module.exports = router;