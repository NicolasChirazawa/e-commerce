const express = require('express');
const router = express.Router();

const shopping_cart = require('../controllers/shoppingCart.js');
const token = require('../middleware/token.js');

router.get('/shoppingCart/',              token.verify_jwt, shopping_cart.selectAllCarts);
router.get('/shoppingCart/:cart_id',      token.verify_jwt, shopping_cart.selectCart);

router.post('/updatePrice',               token.verify_jwt, shopping_cart.updateProductsPrice);
router.post('/verifyStorage',             token.verify_jwt, shopping_cart.verifyProductsStorage)

router.post('/currentCart/:product_id',   token.verify_jwt, shopping_cart.addProductCart);
router.get('/currentCart/',               token.verify_jwt, shopping_cart.selectCurrentCart);
router.delete('/currentCart/:product_id', token.verify_jwt, shopping_cart.eraseProductCart);
router.patch('/currentCart/:product_id',  token.verify_jwt, shopping_cart.updateQuantityCart);

module.exports = router;