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

        const last_user = await db.one('SELECT user_id FROM Users ORDER BY user_id DESC LIMIT 1')
        let insert_user = '';
        await db.tx(async (t) => {
            
            insert_user = await t.one({
                text: 'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, $4) RETURNING user_id, username, password, email, created_at',
                values: [username, hashed_password, email, dateTime]
            });

            const shooping_cart_status = 'Aberto';
            const create_shopping_cart = await t.none({
                text: 'INSERT INTO Shopping_Cart (user_id, status, created_at) VALUES ($1, $2, $3)',
                values: [last_user.user_id, shooping_cart_status, dateTime]
            });

            return t.batch([insert_user, create_shopping_cart]);
        })

        return res.status(201).send(insert_user);
    } catch(e) {
        console.log(e);

        let error = new Error(400, 'Erro ao criar um novo usuário e carrinho de compras.');
        return res.status(400).send(error)
    }
}

const loginUser = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo');
        return res.status(400).send(error);
    }

    const { username, password, email } = req.body;

    if(username === undefined && email === undefined) {
        let error = new Error(400, 'Insira o email ou o username.');
        return res.status(400).send(error);
    }

    let loginChoose = '';
    if(password === undefined) {
        let error = new Error(400, 'Insira a senha.');
        return res.status(400).send(error);
    }

    if(username !== '') {
        loginChoose = 'username';
    } else if(email !== '') {
        loginChoose = 'email';
    }

    try {
        let user_search = '';
        if(loginChoose === 'username') {
            user_search = await db.oneOrNone({
                text: 'SELECT password FROM users WHERE username = $1',
                values: [username]
            });
        } else if(loginChoose === 'email') {
                user_search = await db.oneOrNone({
                text: 'SELECT password FROM users WHERE email = $1',
                values: [username]
            });
        }

        if(user_search === null) {
            const user_not_found = new Error(404, 'Usuário não encontrado.');
            return res.status(404).send(user_not_found);
        }

        const password_crypto_verification = await bcrypt.compare(password, user_search.password);

        if(password_crypto_verification === false) {
            const loginFailed = new Error(400, 'Usuário e/ou senha errado(s).');
            return res.status(400).send(loginFailed);
        }

        return res.status(200).send('');
    } catch(e) {
        console.log(e);

        let error = new Error(400, 'Erro no processamento do login.');
        return res.status(400).send(error)
    }
}

const selectAllUsers = async function (req, res) {
    try {
        const all_users = await db.many('SELECT * FROM users');
        return res.status(200).send(all_users);
    } catch (e) {
        let error = new Error(400, 'Não foi possível selecionar os usuários.');
        return res.status(400).send(error);
    }
}

const selectUser = async function (req, res) {

    const user_id = req.params.user_id; 

    try {
        const choosedUser = await db.oneOrNone({
            text: 'SELECT * FROM users WHERE user_id = $1',
            values: [user_id]
        });

        if(choosedUser === null) {
            let error = new Error(404, 'Não foi encontrado um usuário com o id informado.')
            return res.status(404).send(error);
        }

        return res.status(200).send(choosedUser);
    } catch (e) {
        let error = new Error(400, 'Não foi possível selecionar o usuário.');
        return res.status(400).send(error);
    }
}

const updateUser = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo');
        return res.status(400).send(error);
    }

    const user_id = req.params.user_id;
    const { username, password, email } = req.body;

    if(username == undefined || password == undefined || email == undefined) {
        let error = new Error(400, 'Nenhum dos campos deve estar vazio.');
        return res.status(400).send(error);
    }

    try {
        let verification_duplication_user = await db.oneOrNone({
            text: 'SELECT * FROM users WHERE user_id = $1',
            values: [user_id]
        });

        if(verification_duplication_user === null) {
            let error = new Error(404, 'O id do usuário informado não está na base de dados.');
            return res.status(404).send(error);
        }
    } catch (e) {
        let error = new Error(400, 'Erro no processamento do usuário.');
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
        const saltrounds = 10;
        const hashed_password = await bcrypt.hash(password, saltrounds);

        await db.tx(async (t) => {
            const userChoosed = await t.one({
                text: "SELECT created_at, last_login FROM users WHERE user_id = $1",
                values: [user_id]
            });

            const updateUserChoosed = await t.none({
                text: 'UPDATE users SET username = $1, password = $2, email = $3, created_at = $4, last_login = $5 WHERE user_id = $6' ,
                values: [username, hashed_password, email, userChoosed.created_at, userChoosed.last_login, user_id]
            });

            return t.batch([userChoosed, updateUserChoosed])
        });
        return res.status(204).send('');
    } catch(e) {
        console.log(e);
        let error = new Error(400, 'Erro ao atualizar o usuário.');
        return res.status(400).send(error)
    }
}

const deleteUser = async function (req, res) {

    const user_id = req.params.user_id; 

    try {
        await db.tx(async (t) => {
            
            const deleted_shopping_carts = await t.none({
                text: 'DELETE FROM Shopping_Cart WHERE user_id = $1',
                values: [user_id]
            });

            const deleted_user = await t.none({
                text: 'DELETE FROM users WHERE user_id = $1',
                values: [user_id]
            });

            return t.batch([deleted_shopping_carts, deleted_user])
        });
        return res.status(204).send('');
    } catch (e) {
        let error = new Error(400, 'Não foi possível deletar o usuário.');
        return res.status(400).send(error);
    }
}

const patchUser = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo');
        return res.status(400).send(error);
    }

    const user_id = req.params.user_id;
    const { username, password, email } = req.body;

    if(username == undefined && password == undefined && email == undefined) {
        let error = new Error(400, 'Algum dos campos devem estar informados.');
        return res.status(400).send(error);
    }

    try {
        let verification_duplication_user = await db.oneOrNone({
            text: 'SELECT * FROM users WHERE user_id = $1',
            values: [user_id]
        });

        if(verification_duplication_user === null) {
            let error = new Error(404, 'O id do usuário informado não está na base de dados.');
            return res.status(404).send(error);
        }
    } catch (e) {
        let error = new Error(400, 'Erro no processamento do usuário.');
        return res.status(400).send(error); 
    }

    let username_conditions = [];
    let password_conditions = [];
    let email_conditions = [];
    let compilation_errors = {};
    let query_update_text = [];
    let query_update_values = [];

    if(username !== undefined) { 
        username_conditions = username_verification(username); 
        compilation_errors['username'] = username_conditions;

        query_update_text.push(`username = $${query_update_text.length + 1}`);
        query_update_values.push(username);
    }
    if(password !== undefined) { 
        password_conditions = password_verification(password); 
        compilation_errors['password'] = password_conditions;

        const saltrounds = 10;
        const hashed_password = await bcrypt.hash(password, saltrounds);

        query_update_text.push(`password = $${query_update_text.length + 1}`);
        query_update_values.push(hashed_password);
    }
    if(email !== undefined) { 
        email_conditions = email_verification(email); 
        compilation_errors['email'] = email_conditions;

        query_update_text.push(`email = $${query_update_text.length + 1}`);
        query_update_values.push(email);
    }

    if(Object.values(compilation_errors).flat().length !== 0) {
        let error = new Error(compilation_errors, 400);
        return res.status(400).send(error);
    };

    try {
        let quantidade_campos = query_update_text.length;
        query_update_text = query_update_text.join(',');

        const patchedUserChoosed = await db.none({
            text: `UPDATE users SET ${query_update_text} WHERE user_id = $${quantidade_campos + 1}` ,
            values: [...query_update_values, user_id]
        });

        return res.status(204).send(patchedUserChoosed);
    } catch(e) {
        console.log(e);
        let error = new Error(400, 'Erro ao atualizar o usuário.');
        return res.status(400).send(error)
    }
}

module.exports = { registerUser, loginUser, selectAllUsers, selectUser, updateUser, patchUser, deleteUser, password_verification, email_verification }