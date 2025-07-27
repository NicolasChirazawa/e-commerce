const jwt = require('jsonwebtoken');
const Error = require('../models/error.js');

function verify_jwt (req, res, next) {
    if(req.headers.authorization === undefined) {
        return res.status(401).send(new Error().getMessage('013'));
    }
    const token = req.headers.authorization.split(' ')[1];

    try{
        res.user_data = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        console.log(e)
        return res.status(401).send(new Error().getMessage('014'));
    }
}

module.exports = { verify_jwt };