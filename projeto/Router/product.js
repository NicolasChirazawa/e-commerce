const express = require('express');
const router = express.Router();
const product = require('../controllers/product.js');
const token = require('../controllers/token.js');

router.post('/product/',              token.verify_jwt, product.createProduct);
router.get('/product/',               token.verify_jwt, product.selectAllProducts);
router.get('/product/:product_id',    token.verify_jwt, product.selectProduct);
router.put('/product/:product_id',    token.verify_jwt, product.updateProduct);
router.delete('/product/:product_id', token.verify_jwt, product.deleteProduct);
router.patch('/product/:product_id',  token.verify_jwt, product.patchProduct);

module.exports = router;