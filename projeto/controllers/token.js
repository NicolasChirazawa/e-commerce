const jwt = require('jsonwebtoken');

function verify_jwt (req, res, next) {
    if(req.headers.authorization === undefined) {
        return res.status(401).send('É necessário se logar para usar esse endpoint.')
    }
    const token = req.headers.authorization.split(' ')[1];

    try{
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        const error = new Error(401, 'O token usado é inválido.')
        res.status(401).send(error)
    }
}

module.exports = { verify_jwt };