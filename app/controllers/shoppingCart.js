const ProductStorage = require('../models/productStorage.js');
const ShoppingCart = require('../models/shoppingCart.js');
const Datetime = require('../models/datetime.js');
const Error = require('../models/error.js');

const db = require('../bd_connection');

const selectAllCarts = async function (_, res) {
    const { user_id } = res?.user_data;
    const shoppingCart = new ShoppingCart(user_id);

    try {
        const request = await db.any({
            text:   'SELECT Cart_Products.* FROM Shopping_Cart ' +
                    'INNER JOIN Cart_Products ON Cart_Products.Shopping_Cart_id = Shopping_Cart.Shopping_Cart_id ' +
                    'WHERE Shopping_Cart.user_id = $1',
            values: [shoppingCart.user_id]
        });

        return res.status(200).send(request);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('117'))
    }
};

const selectCart = async function (req, res) {
    const { user_id } = res?.user_data;
    const { cart_id } = req?.params;

    const shopping_cart = new ShoppingCart(user_id, cart_id);

    try {
        const request = await db.any({
            text: 'SELECT Cart_Products.* FROM Shopping_Cart ' +
            'INNER JOIN Cart_Products ON Cart_Products.Shopping_Cart_id = Shopping_Cart.Shopping_Cart_id ' +
            'WHERE Shopping_Cart.user_id = $1 AND Shopping_Cart.shopping_cart_id = $2',
            values: [shopping_cart.user_id, shopping_cart.shopping_cart_id]
        });

        return res.status(200).send(request);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('113'))
    }
};

const selectCurrentCart = async function (_, res) {
    const { user_id } = res?.user_data;

    let shoppingCart = new ShoppingCart(user_id);

    if(shoppingCart.user_id === undefined) { return res.status(404).send(new Error().getMessage('013')) }

    let current_cart_user = await shoppingCart.searchCurrentCart();
    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }
    if(current_cart_user.response === null    ) { return res.status(404).send(new Error().getMessage('017')) }

    shoppingCart = new ShoppingCart(user_id, current_cart_user.response.shopping_cart_id);
    
    try {
        const request = await db.any({
            text: (
                'SELECT Cart_Products.* FROM Shopping_Cart ' +
                'INNER JOIN Cart_Products ON Cart_Products.Shopping_Cart_id = Shopping_Cart.Shopping_Cart_id ' +
                'WHERE Shopping_Cart.user_id = $1 AND Shopping_Cart.Shopping_Cart_Id = $2'
            ),
            values: [shoppingCart.user_id, shoppingCart.shopping_cart_id]
        });

        return res.status(200).send(request);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('113'));
    }    
};

const addProductCart = async function(req, res) {
    const { user_id }    = res?.user_data;
    const { product_id } = req?.params;
    const { quantity }   = req?.body;
 
    let shoppingCart = new ShoppingCart(user_id);
    let productStorage = new ProductStorage('', '', '', product_id);

    let current_cart_user = await shoppingCart.searchCurrentCart();

    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }
    if(current_cart_user.response === null    ) { return res.status(404).send(new Error().getMessage('017')) }

    shoppingCart = new ShoppingCart(user_id, current_cart_user.response.shopping_cart_id);

    let product = await productStorage.search_product(product_id);
    if(product.status === 'failed') { return res.status(500).send(new Error().getMessage(product.response)) }
    if(product.response === null  ) { return res.status(404).send(new Error().getMessage('011')) }

    productStorage = new ProductStorage (
        product.response.name,
        product.response.quantity,
        product.response.price,
        product_id
    );

    if(quantity <= 0 || typeof quantity !== 'number') { return res.status(400).send(new Error().getMessage('015')) }
    if(productStorage.is_avaliable_quantity(quantity) === false) { return res.status(400).send(new Error().getMessage('016')) }

    const has_product_on_cart = await shoppingCart.hasProductCart(productStorage.product_id);
    if(has_product_on_cart.status === 'failed') { return res.status(500).send(new Error().getMessage(has_product_on_cart.response)) }
    if(has_product_on_cart.response === true  ) { return res.status(404).send(new Error().getMessage('019')) };

    try {
        let request;

        await db.tx(async (t) => {
            const dateTime = new Datetime().getTimestamp();
            request = await t.oneOrNone ({
                text: 'INSERT INTO Cart_Products (shopping_cart_id, product_id, quantity, price, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING shopping_cart_id, quantity, price',
                values: [shoppingCart.shopping_cart_id, productStorage.product_id, quantity, productStorage.price, dateTime]
            });

            const update_shopping_cart = await t.none({
                text: 'UPDATE Shopping_Cart SET last_update = $1 WHERE shopping_cart_id = $2',
                values: [dateTime, shoppingCart.shopping_cart_id]
            });

            return t.batch([request, update_shopping_cart]);
        });
        return res.status(201).send(request);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('112'));
    }
};

const updateQuantityCart = async function(req, res) {
    const { user_id }    = res?.user_data;
    const { product_id } = req?.params;
    const { quantity }   = req?.body;

    let shoppingCart = new ShoppingCart(user_id);
    let productStorage = new ProductStorage('', '', '', product_id);

    if(shoppingCart.user_id      === undefined) { return res.status(404).send(new Error().getMessage('013')) }
    if(productStorage.product_id === undefined) { return res.status(404).send(new Error().getMessage('011')) }

    let current_cart_user = await shoppingCart.searchCurrentCart();
    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }
    if(current_cart_user.response === null    ) { return res.status(404).send(new Error().getMessage('017')) }

    shoppingCart = new ShoppingCart(user_id, current_cart_user.response.shopping_cart_id);

    let product = await productStorage.search_product(product_id);
    if(product.status   === 'failed') { return res.status(500).send(new Error().getMessage(product.response)) }
    if(product.response === null    ) { return res.status(404).send(new Error().getMessage('011')) }

    productStorage = new ProductStorage (
        product.response.name,
        product.response.quantity,
        product.response.price,
        product_id
    );

    if(quantity <= 0 || typeof quantity !== 'number') { return res.status(400).send(new Error().getMessage('015')) }
    if(productStorage.is_avaliable_quantity(quantity) === false) { return res.status(400).send(new Error().getMessage('016')) }

    const has_product_on_cart = await shoppingCart.hasProductCart(productStorage.product_id);
    if(has_product_on_cart.status === 'failed') { return res.status(500).send(new Error().getMessage(has_product_on_cart.response)) }
    if(has_product_on_cart.response === false  ) { return res.status(404).send(new Error().getMessage('018')) };

    try {
        await db.tx(async (t) => {
            const dateTime = new Datetime().getTimestamp();
            const request = await t.none ({
                text: 'UPDATE Cart_Products SET quantity = $1, last_update = $2 WHERE product_id = $3 AND shopping_cart_id = $4',
                values: [quantity, dateTime, productStorage.product_id, shoppingCart.shopping_cart_id]
            });

            const update_shopping_cart = await t.none({
                text: 'UPDATE Shopping_Cart SET last_update = $1 WHERE shopping_cart_id = $2',
                values: [dateTime, shoppingCart.shopping_cart_id]
            });

            return t.batch([request, update_shopping_cart]);
        })

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('116'));
    }
};

const eraseProductCart = async function(req, res) {
    const { user_id }    = res?.user_data;
    const { product_id } = req?.params;

    let shoppingCart = new ShoppingCart(user_id);
    let productStorage = new ProductStorage('', '', '', product_id);

    if(shoppingCart.user_id === undefined)    { return res.status(404).send(new Error().getMessage('013')) }
    if(productStorage.product_id === undefined) { return res.status(404).send(new Error().getMessage('011')) }

    let current_cart_user = await shoppingCart.searchCurrentCart();
    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }
    if(current_cart_user.response === null    ) { return res.status(404).send(new Error().getMessage('017')) }

    shoppingCart = new ShoppingCart(user_id, current_cart_user.response.shopping_cart_id);

    const has_product_on_cart = await shoppingCart.hasProductCart(productStorage.product_id);
    if(has_product_on_cart.status === 'failed') { return res.status(500).send(new Error().getMessage(has_product_on_cart.response)) }
    if(has_product_on_cart.response === false  ) { return res.status(404).send(new Error().getMessage('018')) };

    try {
        let request;
        await db.tx(async (t) => {
            const datetime = new Datetime().getTimestamp();
            request = await t.none ({
                text: 'DELETE FROM Cart_Products WHERE product_id = $1 AND shopping_cart_id = $2',
                values: [productStorage.product_id, shoppingCart.shopping_cart_id]
            });

            let update_shopping_cart = await t.none({
                text: 'UPDATE Shopping_Cart SET last_update = $1 WHERE shopping_cart_id = $2',
                values: [datetime, shoppingCart.shopping_cart_id]
            });

            return t.batch([request, update_shopping_cart]);
        });

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('115'));
    }
};

const updateProductsPrice = async function (_, res) {
    const { user_id } = res?.user_data;

    let shoppingCart = new ShoppingCart(user_id);

    const current_cart_user = await shoppingCart.searchCurrentCart();
    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }

    shoppingCart = new ShoppingCart(user_id, current_cart_user.response.shopping_cart_id);
 
    const current_cart_product = await shoppingCart.searchProductsCart();
    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }

    const products_cart = current_cart_product.response;

    let update_prices = [];
    for(let i = 0; i < products_cart.length; i++) {
        let product_data = await db.oneOrNone({
            text: 'SELECT * FROM Products WHERE product_id = $1',
            values: [products_cart[i].product_id]
        });

        const product = new ProductStorage(product_data.name, product_data.quantity, product_data.price, products_cart[i].product_id);

        if(products_cart[i].price !== product.price) {
            update_prices.push(`O produto ${product.name} teve uma atualização de preço. De ${products_cart[i].price} a ${product.price}`);

            try{
                await db.none({
                    text: 'UPDATE Cart_Products SET price = $1 WHERE shopping_cart_id = $2 AND product_id = $3',
                    values: [product.price, shoppingCart.shopping_cart_id, product.product_id]
                });
            } catch (e) {
                console.log(e);
                return res.status(500).send(new Error().getMessage('116'))
            }
        };
    };
    return res.status(200).send({message: update_prices});
};

const verifyProductsStorage = async function (_, res) {
    const { user_id } = res?.user_data;

    let shoppingCart = new ShoppingCart(user_id);

    const current_cart_user = await shoppingCart.searchCurrentCart();
    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }

    shoppingCart = new ShoppingCart(user_id, current_cart_user.response.shopping_cart_id);

    const current_cart_product = await shoppingCart.searchProductsCart();
    if(current_cart_user.status   === 'failed') { return res.status(500).send(new Error().getMessage(current_cart_user.response)) }

    const products_cart = current_cart_product.response;

    let insufficient_storage = [];
    for(let i = 0; i < products_cart.length; i++) {
        let product_data = await db.oneOrNone({
            text: 'SELECT * FROM Products WHERE product_id = $1',
            values: [products_cart[i].product_id]
        });

        const product = new ProductStorage(product_data.name, product_data.quantity, product_data.price, products_cart[i].product_id);

        if(products_cart[i].quantity > product.quantity) {
            insufficient_storage.push(`O produto ${product.name} tem um pedido maior do que o estoque disponivel. Pedido: ${products_cart[i].quantity}; Disponível: ${product.quantity}`);
        };
    };
    return res.status(200).send({message: insufficient_storage});
};

module.exports = { selectAllCarts, selectCart, selectCurrentCart, addProductCart, updateQuantityCart, eraseProductCart, updateProductsPrice, verifyProductsStorage }