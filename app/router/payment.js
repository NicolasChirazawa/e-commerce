const express = require('express');
const router = express.Router();
const payment = require('../controllers/payment.js');
const token = require('../middleware/token.js');

router.post('/payment', token.verify_jwt, payment.createPaymentLink);

module.exports = router;