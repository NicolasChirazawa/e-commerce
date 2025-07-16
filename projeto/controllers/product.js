const Error = require('../models/error.js');
const db = require('../bd_connection.js');
const getDate = require('../useful_functions.js').generate_date_dmy;

function is_valid_quantity (quantity) {
    if((typeof quantity) !== "number") {
        return false;
    }
    return (quantity >= 0)
};

function is_valid_price (price) {
    if((typeof price) !== "number") {
        return false;
    }
    return (price >= 0)
};

const createProduct = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo.');
        return res.status(400).send(error);
    }

    const { name, quantity, price } = req.body;

    if(name === undefined || quantity === undefined || price === undefined) {
        let error = new Error(400, 'Preencha todos os campos obrigatórios.');

        return res.status(400).send(error);
    }

    try{
        let verification_duplication_product = await db.oneOrNone({
            text: 'SELECT * FROM products WHERE name = $1',
            values: [name]
        });

        if(verification_duplication_product !== null) {
            let duplication_product = new Error(400, 'Já existe um produto com esse mesmo nome.')
            return res.status(400).send(duplication_product)
        }
    } catch (e) {
        let error = new Error(400, 'Não foi possível verificar a duplicação do produto.')
        return res.status(400).send(error);
    }

    let list_error = [];
    let compilation_errors = {};
    const quantity_validation = is_valid_quantity(quantity); 
    const price_validation = is_valid_price(price);
    
    if(quantity_validation === false) {
        compilation_errors['quantity'] = 'Insira uma quantidade válida.';
        list_error.push('quantidade');
    }
    if(price_validation === false) {
        compilation_errors['price'] = 'Insira um preço válido';
        list_error.push('preco')
    }

    if(list_error.length > 0) {
        let error = new Error(400, compilation_errors);
        return res.status(400).send(error);
    }

    try {
        const dateTime = getDate();

        const product_created = await db.one({
            text: 'INSERT INTO products (name, quantity, price, created_at) VALUES ($1, $2, $3, $4) RETURNING name, quantity, price',
            values: [name, quantity, price, dateTime]
        });

        return res.status(201).send(product_created);
    } catch (e) {
        console.log(e);

        let error = new Error(400, 'Não foi possível criar o produto.');
        return res.status(400).send(error);
    }
}

const selectAllProducts = async function (req, res) {
    try {
        const all_products = await db.many('SELECT * FROM products ORDER BY product_id');
        return res.status(200).send(all_products);
    } catch (e) {
        let error = new Error(400, 'Não foi possível selecionar os produtos.');
        return res.status(400).send(error);
    }
}

const selectProduct = async function (req, res) {
    const product_id = req.params.product_id; 

    try {
        const choosedProduct = await db.oneOrNone({
            text: 'SELECT * FROM products WHERE product_id = $1',
            values: [product_id]
        });

        if(choosedProduct === null) {
            let error = new Error(404, 'Não foi encontrado um produto com o id informado.')
            return res.status(404).send(error);
        }

        return res.status(200).send(choosedProduct);
    } catch (e) {
        let error = new Error(400, 'Não foi possível selecionar o produto.');
        return res.status(400).send(error);
    }
}

const updateProduct = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo');
        return res.status(400).send(error);
    }

    const product_id = req.params.product_id;
    const { name, quantity, price } = req.body;

    if(name == undefined || quantity == undefined || price == undefined) {
        let error = new Error(400, 'Nenhum dos campos deve estar vazio.');
        return res.status(400).send(error);
    }

    try {
        let product_data = await db.oneOrNone({
            text: 'SELECT * FROM products WHERE product_id = $1',
            values: [product_id]
        });

        if(product_data === null) {
            let error = new Error(404, 'O id do produto informado não está na base de dados.');
            return res.status(404).send(error);
        };

        if(product_data.name !== name) {
            let test_name_used = await db.oneOrNone({
                text: 'SELECT * FROM products WHERE name = $1 AND product_id <> $2',
                values: [name, product_id]
            });

            if(test_name_used !== null) {
                let is_name_already_used = new Error(400, 'O nome deste produto já está sendo usado a outro.');
                return res.status(400).send(is_name_already_used);
            }
        }
    } catch (e) {
        console.log(e);

        let error = new Error(400, 'Erro no processamento do produto.');
        return res.status(400).send(error); 
    }

    let list_error = [];
    let compilation_errors = {};
    const quantity_validation = is_valid_quantity(quantity); 
    const price_validation = is_valid_price(price);
    
    if(quantity_validation === false) {
        compilation_errors['quantity'] = 'Insira uma quantidade válida.';
        list_error.push('quantidade');
    }
    if(price_validation === false) {
        compilation_errors['price'] = 'Insira um preço válido';
        list_error.push('preco');
    }

    if(list_error.length > 0) {
        let error = new Error(400, compilation_errors);
        return res.status(400).send(error);
    }

    try {
        const dateTime = getDate();
        const updateProductChoosed = await db.none({
            text: 'UPDATE products SET name = $1, quantity = $2, price = $3, last_update = $4 WHERE product_id = $5' ,
            values: [name, quantity, price, dateTime, product_id]
        });

        return res.status(204).send('');
    } catch(e) {
        console.log(e);
        let error = new Error(400, 'Erro ao atualizar o produto.');
        return res.status(400).send(error)
    }
}

const deleteProduct = async function (req, res) {

    const product_id = req.params.product_id; 

    try {
        const deleted_product = await db.none({
            text: 'DELETE FROM products WHERE product_id = $1',
            values: [product_id]
        });

        return res.status(204).send('');
    } catch (e) {
        console.log(e);

        let error = new Error(400, 'Não foi possível deletar o produto.');
        return res.status(400).send(error);
    }
}

const patchProduct = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo');
        return res.status(400).send(error);
    }

    const product_id = req.params.product_id;
    const { name, quantity, price } = req.body;

    if(name == undefined && quantity == undefined && price == undefined) {
        let error = new Error(400, 'Algum dos campos deve estar informados.');
        return res.status(400).send(error);
    }

    try {
        let product_data = await db.oneOrNone({
            text: 'SELECT * FROM products WHERE product_id = $1',
            values: [product_id]
        });

        if(product_data === null) {
            let error = new Error(404, 'O id do produto informado não está na base de dados.');
            return res.status(404).send(error);
        }
    } catch (e) {
        let error = new Error(400, 'Erro no processamento do produto.');
        return res.status(400).send(error); 
    }

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
        quantity_valid = is_valid_quantity(quantity); 
        
        if(quantity_valid === false) { compilation_errors['quantity'] = 'Insira uma quantidade válida'; }

        query_update_text.push(`quantity = $${query_update_text.length + 1}`);
        query_update_values.push(quantity);
    }
    if(price !== undefined) { 
        price_valid = is_valid_price(price); 

        if(price_valid === false) { compilation_errors['price'] = 'Insira um preço válido.'; }

        query_update_text.push(`price = $${query_update_text.length + 1}`);
        query_update_values.push(price);
    }

    if(quantity_valid === false || price_valid === false) {
        let error = new Error(400, compilation_errors);
        return res.status(400).send(error);
    };

    try {
        let quantidade_campos = query_update_text.length;
        query_update_text = query_update_text.join(',');

        const patchedProductChoosed = await db.none({
            text: `UPDATE products SET ${query_update_text} WHERE product_id = $${quantidade_campos + 1}` ,
            values: [...query_update_values, product_id]
        });

        return res.status(204).send(patchedProductChoosed);
    } catch(e) {
        console.log(e);
        let error = new Error(400, 'Erro ao atualizar o produto.');
        return res.status(400).send(error);
    }
}

module.exports = { createProduct, selectAllProducts, selectProduct, updateProduct, deleteProduct, patchProduct }