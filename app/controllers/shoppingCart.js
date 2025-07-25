const db = require('../bd_connection');
const Error = require('../models/error.js');

const { generate_date_dmy: getDate, is_valid_price, is_valid_quantity } = require('../useful_functions.js');

const addProduct = async function(req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo.');
        return res.status(400).send(error);
    }

    const { user_id } = res.user_data;
    const { product_id, quantity, price } = req.body;

    if(user_id === undefined) {
        const error = new Error(404, 'Cadastre-se para usar esse endpoint.');
        return res.status(404).send(error);
    }

    if(product_id === undefined || quantity === undefined || price === undefined) {
        const error = new Error(400, 'Informe todos os campos obrigatórios.');
        return res.status(400).send(error);
    }

    let list_error = [];
    let compilation_errors = {};

    const quantity_validation = is_valid_quantity(quantity);
    const price_validation = is_valid_price(price);

    if(quantity_validation === false) { 
        list_error.push(quantity);
        compilation_errors['quantity'] = 'Insira uma quantidade válida.';
    }
    if(price_validation === false) {
        list_error.push(price);
        compilation_errors['price'] = 'Insira um preço válido.';
    }
    if(list_error.length > 0) {
        const error = new Error(400, compilation_errors);
        return res.status(400).send(error);
    }

    try {
        const searchedProduct = await db.oneOrNone({
            text: 'SELECT * FROM products WHERE product_id = $1',
            values: [product_id]
        });

        if(searchedProduct === null) {
            const error = new Error(404, 'Produto não encontrado');
            return res.status(404).send(error);
        }
    } catch (e) {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro na busca do produto.')
        return res.status(400).send(error);
    }

    try {
        const last_shopping_cart_user = await db.oneOrNone({
            text: 'SELECT shooping_cart_id FROM Shopping_Cart WHERE user_id = $1 ORDER BY shooping_cart_id DESC LIMIT 1',
            values: [user_id]
        });

        const dateTime = getDate();
        const request = await db.oneOrNone ({
            text: 'INSERT INTO Cart_Products (shopping_cart_id, product_id, quantity, price, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING shopping_cart_id, quantity, price',
            values: [last_shopping_cart_user.shooping_cart_id, product_id, quantity, price, dateTime]
        });

        return res.status(201).send(request);
    } catch (e) {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro ao adicionar o produto no carrinho de compras.');
        return res.status(400).send(error);
    }
};

const eraseProduct = async function(req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo.');
        return res.status(400).send(error);
    }

    const { user_id } = res.user_data;
    const product_id = req.params.product_id;

    if(user_id === undefined) {
        const error = new Error(404, 'Cadastre-se para usar esse endpoint.');
        return res.status(404).send(error);
    }

    if(product_id === undefined) {
        const error = new Error(400, 'Informe o produto.');
        return res.status(400).send(error);
    }

    let last_shopping_cart_user;
    try {
        last_shopping_cart_user = await db.oneOrNone({
            text: 'SELECT shooping_cart_id FROM Shopping_Cart WHERE user_id = $1 ORDER BY shooping_cart_id DESC LIMIT 1',
            values: [user_id]
        });
        
        if(last_shopping_cart_user === null) {
            const error = new Error(404, 'Carrinho não encontrado...');
            return res.status(404).send(error);
        }

    } catch {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro na busca do carrinho de compras.')
        return res.status(400).send(error);
    }

    try {
        const searchedProduct = await db.oneOrNone({
            text: 'SELECT * FROM shopping_cart WHERE product_id = $1 AND shopping_cart_id = $2',
            values: [product_id, last_shopping_cart_user.shooping_cart_id]
        });

        if(searchedProduct === null) {
            const error = new Error(404, 'Produto não encontrado no carrinho');
            return res.status(404).send(error);
        }
    } catch (e) {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro na busca do produto no carrinho.')
        return res.status(400).send(error);
    }

    try {
        const request = await db.oneOrNone ({
            text: 'DELETE FROM Cart_Products WHERE product_id = $1 AND shopping_cart_id = $2',
            values: [product_id, last_shopping_cart_user.shooping_cart_id,]
        });

        return res.status(204).send(request);
    } catch (e) {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro ao apagar o produto no carrinho de compras.');
        return res.status(400).send(error);
    }
};

const changeProductQuantity = async function(req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo.');
        return res.status(400).send(error);
    }

    const { user_id } = res.user_data;
    const product_id = req.params.product_id;
    const { quantity } = req.body;

    if(user_id === undefined) {
        const error = new Error(404, 'Cadastre-se para usar esse endpoint.');
        return res.status(404).send(error);
    }

    if(product_id === undefined) {
        const error = new Error(400, 'Informe o produto.');
        return res.status(400).send(error);
    }

    if(typeof quantity != 'number' && quantity <= 0) {
        const error = new Error(400, 'Quantidade informada inválida');
        return res.status(400).send(error);
    }

    let last_shopping_cart_user;
    try {
        last_shopping_cart_user = await db.oneOrNone({
            text: 'SELECT shooping_cart_id FROM Shopping_Cart WHERE user_id = $1 ORDER BY shooping_cart_id DESC LIMIT 1',
            values: [user_id]
        });
        
        if(last_shopping_cart_user === null) {
            const error = new Error(404, 'Carrinho não encontrado...');
            return res.status(404).send(error);
        }

    } catch {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro na busca do carrinho de compras.')
        return res.status(400).send(error);
    }

    try {
        const searchedProduct = await db.oneOrNone({
            text: 'SELECT * FROM shopping_cart WHERE product_id = $1 AND shopping_cart_id = $2',
            values: [product_id, last_shopping_cart_user.shooping_cart_id]
        });

        if(searchedProduct === null) {
            const error = new Error(404, 'Produto não encontrado no carrinho');
            return res.status(404).send(error);
        }
    } catch (e) {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro na busca do produto no carrinho.')
        return res.status(400).send(error);
    }

    try {
        const request = await db.oneOrNone ({
            text: 'DELETE FROM Cart_Products WHERE product_id = $1 AND shopping_cart_id = $2',
            values: [product_id, last_shopping_cart_user.shooping_cart_id,]
        });

        return res.status(204).send(request);
    } catch (e) {
        console.log(e);
        const error = new Error(400, 'Ocorreu um erro ao apagar o produto no carrinho de compras.');
        return res.status(400).send(error);
    }
};

module.exports = { addProduct, eraseProduct, changeProductQuantity }