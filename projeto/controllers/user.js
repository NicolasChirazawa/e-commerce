const db = require('../conexao_banco');
const Error = require('../models/error.js');
const bcrypt = require('bcrypt');

function username_verification(username) {
    let username_conditions = [];

    if(username.length < 3) {
        username_conditions.push('O username deve ter ao menos 3 caracteres.');
    }

    return username_conditions
}

function password_verification(password) {
    let password_conditions = [];

    if(password.length < 5) {
        password_conditions.push('A senha deve ter ao menos 5 caracteres.');
    }
    if(password.length > 30) {
        password_conditions.push('A senha deve possuir no máximo 30 caracteres.');
    }
    if(password.search(/[A-Z]/) == -1) {
        password_conditions.push('A senha deve ter ao menos um caractere maiúsculo.');
    }
    if(password.search(/[a-z]/) == -1) {
        password_conditions.push('A senha deve ter ao menos um caractere minúsculo.');
    }
    if(password.search(/[0-9]/) == -1) {
        password_conditions.push('A senha deve ter ao menos um número.');
    }
    if(password.search(/[!@#$%¨&*]/) == -1) {
        password_conditions.push('A senha deve ter ao menos um caractere especial.');
    }

    return password_conditions;
}

function email_verification(email) {
    let email_conditions = [];

    if(email.search(/^([a-z0-9]+@[a-z]+(\.[a-z]{1,3}){1,2})$/i) != 0) {
        email_conditions.push('Insira um e-mail válido.')
    }

    return email_conditions;
}

const registerUser = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo');
        return res.status(400).send(error);
    }

    const { username, password, email } = req.body;

    if(username == undefined || password == undefined || email == undefined) {
        let error = new Error(400, 'Nenhum dos campos deve estar vazio.');
        return res.status(400).send(error);
    }

    try {
        let verification_duplication_user = await db.oneOrNone({
            text: 'SELECT * FROM users WHERE username = $1 OR email = $2',
            values: [username, email]
        });

        if(verification_duplication_user !== null) {
            let error = new Error(400, 'Já existe um usuário com esse username e/ou email registrado.');
            return res.status(400).send(error);
        }
    } catch (e) {
        let error = new Error(400, 'Erro no processamento de duplicação de usuário.');
        return res.status(400).send(error); 
    }

    let username_conditions = username_verification(username);
    let password_conditions = password_verification(password);
    let email_conditions = email_verification(email);

    if(username_conditions.length > 0 || password_conditions.length > 0 || email_conditions.length > 0) {
        let compilation_errors = {
            username: username_conditions,
            password: password_conditions,
            email: email_conditions
        }

        let error = new Error(compilation_errors, 400);
        return res.status(400).send(error);
    }

    try {
        let informations_DateTime = new Date();
        let dateTime = informations_DateTime.getFullYear() + '/' + (informations_DateTime.getMonth() + 1) + '/' + informations_DateTime.getDay() + ' ' + informations_DateTime.getHours() + ':' + informations_DateTime.getMinutes() + ':' + informations_DateTime.getSeconds();

        const saltrounds = 10;
        const hashed_password = await bcrypt.hash(password, saltrounds);

        // Seria interessante posteriormente estudar para implementar o BEGIN TRANSACTION, permitindo que apenas ocorra o INSERT users se ocorrer o INSERT shopping_cart
         
        const insert_user = await db.one({
            text: 'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, $4) RETURNING user_id, username, password, email, created_at',
            values: [username, hashed_password, email, dateTime]
        });

        const shooping_cart_status = 'Aberto';
        await db.none({
            text: 'INSERT INTO Shopping_Cart (user_id, status, created_at) VALUES ($1, $2, $3)',
            values: [insert_user.user_id, shooping_cart_status, dateTime]
        });

        return res.status(201).send(insert_user);
    } catch(e) {
        console.log(e);

        let error = new Error(400, 'Erro ao criar um novo usuário');
        return res.status(400).send(error)
    }
}

module.exports = { registerUser,  username_verification, password_verification, email_verification }