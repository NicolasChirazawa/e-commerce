const Product = require('../models/product.js');
const Error = require('../models/error.js');
const Datetime = require('../models/datetime.js');

const db = require('../bd_connection.js');

const createProduct = async function (req, res) {
    const { name, quantity, price } = req?.body;
    const product = new Product(name, quantity, price);

    if(
        product.is_name_empty()     || 
        product.is_quantity_empty() || 
        product.is_price_empty()
    ) {
        return res.status(400).send(new Error().getMessage('001'));
    }

    const is_product_on_database = await product.is_product_on_database();
    if(is_product_on_database.status === 'failed') { return res.status(500).send(new Error().getMessage(is_product_on_database.response)) }
    if(is_product_on_database.response === true  ) { return res.status(400).send(new Error().getMessage('010')) }

    let list_error = [];
    let compilation_errors = {};
    const quantity_validation = product.is_valid_quantity(); 
    const price_validation    = product.is_valid_price();
    
    if(quantity_validation === false) {
        compilation_errors['quantity'] = 'Insira uma quantidade válida';
        list_error.push('quantidade');
    }
    if(price_validation === false) {
        compilation_errors['price'] = 'Insira um preço válido';
        list_error.push('preco')
    }

    if(list_error.length > 0) { return res.status(400).send(compilation_errors) }

    try {
        const dateTime = new Datetime().getTimestamp();

        const product_created = await db.one ({
            text: 'INSERT INTO products (name, quantity, price, created_at) VALUES ($1, $2, $3, $4) RETURNING product_id, name, quantity, price',
            values: [product.name, product.quantity, product.price, dateTime]
        });

        return res.status(201).send(product_created);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('108'));
    }
}

const selectAllProducts = async function (req, res) {
    try {
        const all_products = await db.any('SELECT * FROM products ORDER BY product_id');
        return res.status(200).send(all_products);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('109'));
    }
}

const selectProduct = async function (req, res) {
    const { product_id } = req?.params; 
    const product = new Product();

    const product_data = await product.search_product(product_id);
    if(product_data.status === 'failed') { return res.status(500).send(new Error().getMessage(product_data.response)) }
    if(product_data.response === null  ) { return res.status(404).send(new Error().getMessage('011')) }

    return res.status(200).send(product_data.response);
}

const updateProduct = async function (req, res) {
    const { product_id } = req?.params;
    const { name, quantity, price } = req?.body;
    const product = new Product(name, quantity, price);

    if(
        product.is_name_empty()     || 
        product.is_quantity_empty() || 
        product.is_price_empty()
    ) {
        return res.status(400).send(new Error().getMessage('001'));
    }

    try {
        const product_data = await product.search_product(product_id);
        
        if(product_data.status === 'failed') { return res.status(500).send(new Error().getMessage(product_data.response)) }
        if(product_data.response === null  ) { return res.status(404).send(new Error().getMessage('011')) }

        if(product_data.name !== product.name) {
            const test_name_used = await db.oneOrNone({
                text: 'SELECT * FROM products WHERE name = $1 AND product_id <> $2',
                values: [product.name, product_id]
            });

            if(test_name_used !== null) { return res.status(400).send(new Error().getMessage('010')) }
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('107')); 
    }

    let list_error = [];
    let compilation_errors = {};
    const quantity_validation = product.is_valid_quantity(); 
    const price_validation = product.is_valid_price();
    
    if(quantity_validation === false) {
        compilation_errors['quantity'] = 'Insira uma quantidade válida';
        list_error.push('quantidade');
    }
    if(price_validation === false) {
        compilation_errors['price'] = 'Insira um preço válido';
        list_error.push('preco');
    }

    if(list_error.length > 0) { return res.status(400).send(compilation_errors) }

    try {
        const dateTime = new Datetime().getTimestamp();
        await db.none({
            text: 'UPDATE products SET name = $1, quantity = $2, price = $3, last_update = $4 WHERE product_id = $5' ,
            values: [product.name, product.quantity, product.price, dateTime, product_id]
        });

        return res.status(204).send();
    } catch(e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('110'));
    }
}

const deleteProduct = async function (req, res) {

    const { product_id } = req?.params; 

    try {
        const deleted_product = await db.oneOrNone ({
            text: 'DELETE FROM products WHERE product_id = $1 RETURNING product_id',
            values: [product_id]
        });

        if(deleted_product === null) { return res.status(404).send(new Error().getMessage('011')) }

        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('111'));
    }
}

const patchProduct = async function (req, res) {
    const product_id = req.params.product_id;
    const { name, quantity, price } = req?.body;
    const product = new Product(name, quantity, price);

    if(
        product.is_name_empty()     && 
        product.is_quantity_empty() && 
        product.is_price_empty()
    ) {
        return res.status(400).send(new Error().getMessage('012'));
    }

    const product_data = await product.search_product(product_id);
    if(product_data.status === 'failed') { return res.status(500).send(new Error().getMessage(product_data.response)) }
    if(product_data.response === null  ) { return res.status(404).send(new Error().getMessage('011')) }

    let quantity_valid = true;
    let price_valid = true;
    let compilation_errors = {};
    let query_update_text = [];
    let query_update_values = [];

    if(name !== undefined) { 
        query_update_text.push(`name = $${query_update_text.length + 1}`);
        query_update_values.push(name);
    }
    if(quantity !== undefined) { 
        quantity_valid = product.is_valid_quantity(); 
        if(quantity_valid === false) { compilation_errors['quantity'] = 'Insira uma quantidade válida' }

        query_update_text.push(`quantity = $${query_update_text.length + 1}`);
        query_update_values.push(product.quantity);
    }
    if(price !== undefined) { 
        price_valid = product.is_valid_price(); 

        if(price_valid === false) { compilation_errors['price'] = 'Insira um preço válido.'; }

        query_update_text.push(`price = $${query_update_text.length + 1}`);
        query_update_values.push(product.price);
    }

    if(quantity_valid === false || price_valid === false) { return res.status(400).send(compilation_errors) };

    let dateTime = new Datetime().getTimestamp();
    query_update_text.push(`last_update = $${query_update_text.length + 1}`);
    query_update_values.push(dateTime);

    try {
        let fields_length = query_update_text.length;
        query_update_text = query_update_text.join(',');

        await db.none({
            text: `UPDATE products SET ${query_update_text} WHERE product_id = $${fields_length + 1}` ,
            values: [...query_update_values, product_id]
        });

        return res.status(204).send();
    } catch(e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('110'));
    }
}

module.exports = { createProduct, selectAllProducts, selectProduct, updateProduct, deleteProduct, patchProduct }