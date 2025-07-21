const express = require('express');
const router = express.Router();
const product = require('../controllers/product.js');
const token = require('../middleware/token.js');

router.post('/products/',              token.verify_jwt, product.createProduct);
router.get('/products/',               token.verify_jwt, product.selectAllProducts);
router.get('/products/:product_id',    token.verify_jwt, product.selectProduct);
router.put('/products/:product_id',    token.verify_jwt, product.updateProduct);
router.delete('/products/:product_id', token.verify_jwt, product.deleteProduct);
router.patch('/products/:product_id',  token.verify_jwt, product.patchProduct);

module.exports = router;