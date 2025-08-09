const Payment = require('../models/payment.js');
const ShoppingCart = require('../models/shoppingCart.js');
const CartProducts = require('../models/cartProducts.js');
const Datatime = require('../models/datetime.js');
const Error = require('../models/error.js');

const db = require('../bd_connection');

const calculatePrice = async function(req, res) {
    const { user_id } = res?.user_data;

    let shoppingCart =  new ShoppingCart(user_id);
    let current_shopping_cart = await shoppingCart.searchCurrentCart();
    if(current_shopping_cart.status === 'failed') { return res.status(500).send(new Error().getMessage(current_shopping_cart.response)) }

    current_shopping_cart = current_shopping_cart.response;

    shoppingCart = new ShoppingCart(user_id, current_shopping_cart.shopping_cart_id);
    let products_cart = await shoppingCart.searchProductsCart();
    if(products_cart.status === 'failed') { return res.status(500).send(new Error().getMessage(products_cart.response)) }

    products_cart = products_cart.response;

    const cartProducts = new CartProducts(shoppingCart.shopping_cart_id, products_cart);

    const updatedPrices = await cartProducts.updateProductPrices();
    if(updatedPrices.status === 'failed') { return new Error().getMessage(updatedPrices.response) }

    const verifyStorage = await cartProducts.verifyStorage();
    if(verifyStorage.status === 'failed') { return new Error().getMessage(verifyStorage.response) }

    if(verifyStorage.response.length !== 0) { 
        return res.status(400).send({
            updatedPrices: updatedPrices.response,
            verifyStorage: verifyStorage.response
        });
    };

    const price = cartProducts.calculatePrice();

    return res.status(201).send(price);
}

const createPaymentLink = async function(req, res) {
    const { payment } = req?.body;
    const { user_id } = res?.user_data;

    const paymentMethod = new Payment(payment);

    const isValidPayment = paymentMethod.paymentValid();
    if(isValidPayment === false) { return res.status(400).send(new Error().getMessage('020')) }

    let shoppingCart =  new ShoppingCart(user_id);
    let current_shopping_cart = await shoppingCart.searchCurrentCart();
    if(current_shopping_cart.status === 'failed') { return res.status(500).send(new Error().getMessage(current_shopping_cart.response)) }

    current_shopping_cart = current_shopping_cart.response;

    shoppingCart = new ShoppingCart(user_id, current_shopping_cart.shopping_cart_id);
    let products_cart = await shoppingCart.searchProductsCart();
    if(products_cart.status === 'failed') { return res.status(500).send(new Error().getMessage(products_cart.response)) }

    products_cart = products_cart.response;

    const cartProducts = new CartProducts(shoppingCart.shopping_cart_id, products_cart);

    const price = cartProducts.calculatePrice();
    const paymentChoose = await paymentMethod.paymentProcess(price, shoppingCart.shopping_cart_id, cartProducts.products);
    if(paymentChoose.status === 'failed') { new Error().getMessage(paymentChoose.response) }

    if(payment === 'Cartão') {
        let statusPayment = 'Pago'
        let datetime = new Datatime().getTimestamp();
        await shoppingCart.changeStatusCart(statusPayment, datetime);
        await cartProducts.discountStorage(datetime);

        let statusNewCart = 'Em aberto';
        let createNewCart = await db.none({
            text: 'INSERT INTO Shopping_Cart (user_id, created_at, status) VALUES ($1, $2, $3)',
            values: [user_id, datetime, statusNewCart]
        });
    }

    return res.status(201).send(paymentChoose);
}

module.exports = { calculatePrice, createPaymentLink }