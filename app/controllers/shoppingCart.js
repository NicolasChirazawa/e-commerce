const db = require('../bd_connection');
const Error = require('../models/error.js')
const shoppingCart = require('../models/shoppingCart');

const addProduct = async function(req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo.');
        return res.status(400).send(error);
    }

    // const {  }
}

module.exports = {}