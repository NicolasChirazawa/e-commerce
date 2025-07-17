const Error = require('../models/error.js');
const db = require('../bd_connection.js');
const getDate = require('../useful_functions.js').generate_date_dmy;

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function username_verification (username) {
    let username_conditions = [];

    if(username.length < 3) {
        username_conditions.push('O username deve ter ao menos 3 caracteres.');
    }

    return username_conditions
}

function password_verification (password) {
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

function email_verification (email) {
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
        let dateTime = getDate();

        const saltrounds = 10;
        const hashed_password = await bcrypt.hash(password, saltrounds);

        let insert_user = '';
        await db.tx(async (t) => {
            
            insert_user = await t.one({
                text: 'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, $4) RETURNING user_id, username, password, email, created_at',
                values: [username, hashed_password, email, dateTime]
            });

            const shooping_cart_status = 'Em aberto';
            const create_shopping_cart = await t.none({
                text: 'INSERT INTO Shopping_Cart (user_id, status, created_at) VALUES ($1, $2, $3)',
                values: [insert_user.user_id, shooping_cart_status, dateTime]
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
        let error = new Error(400, 'Insira o username ou o email.');
        return res.status(400).send(error);
    }
    if(password === undefined) {
        let error = new Error(400, 'Insira a senha.');
        return res.status(400).send(error);
    }

    const loginMethodChoosed = (username !== null ? 'username' : 'email');

    try {
        let user_search = '';
        let dateTime = getDate();
        let password_crypto_verification = '';

        switch(loginMethodChoosed) {
            case 'username':
                user_search = await db.oneOrNone({
                    text: 'SELECT user_id, password FROM users WHERE username = $1',
                    values: [username]
                });

                password_crypto_verification = await bcrypt.compare(password, user_search.password);

                if(password_crypto_verification === false) {
                    const loginFailed = new Error(400, 'Usuário e/ou senha errado(s).');
                    return res.status(400).send(loginFailed);
                }

                await db.none({
                    text: 'UPDATE users SET last_login = $1 WHERE username = $2',
                    values: [dateTime, username]
                });

                break;

            case 'email':
                user_search = await db.oneOrNone({
                    text: 'SELECT user_id, password FROM users WHERE email = $1',
                    values: [email]
                });  
                
                password_crypto_verification = await bcrypt.compare(password, user_search.password);

                if(password_crypto_verification === false) {
                    const loginFailed = new Error(400, 'Usuário e/ou senha errado(s).');
                    return res.status(400).send(loginFailed);
                }

                await db.none({
                    text: 'UPDATE users SET last_login = $1 WHERE email = $2',
                    values: [dateTime, email]
                });
            break;

            default:
                const user_not_found = new Error(404, 'Usuário não encontrado.');
                return res.status(404).send(user_not_found);
        }

        const token_user = jwt.sign(
            {user_id: user_search.user_id}, 
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        )

        return res.status(200).send({token: token_user});
    } catch(e) {
        console.log(e);

        let error = new Error(400, 'Erro no processamento do login.');
        return res.status(400).send(error);
    }
}

const selectAllUsers = async function (req, res) {
    try {
        const all_users = await db.many('SELECT * FROM users ORDER BY user_id');
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
        let user_data = await db.oneOrNone({
            text: 'SELECT * FROM users WHERE user_id = $1',
            values: [user_id]
        });

        if(user_data === null) {
            let error = new Error(404, 'O id do usuário informado não está na base de dados.');
            return res.status(404).send(error);
        };

        if(user_data.username !== username) {
            const test_username_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND username = $2',
                values: [user_id, username]
            });

            if(test_username_used !== null) {
                let username_already_used = new Error(400, 'O usuário colocado já está sendo usado por outra pessoa.');
                return res.status(400).send(username_already_used);
            }
        }
        if(user_data.email !== email) {
            const test_email_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND email = $2',
                values: [user_id, email]
            });

            if(test_email_used !== null) {
                let email_already_used = new Error(400, 'O email colocado já está sendo usado por outra pessoa.');
                return res.status(400).send(email_already_used);
            }
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

// Verificar atualização para username e emails já cadastrados
const patchUser = async function (req, res) {
    if(req.body === undefined) {
        let error = new Error(400, 'A requisição não tem corpo');
        return res.status(400).send(error);
    }

    const user_id = req.params.user_id;
    const { username, password, email } = req.body;

    if(username == undefined && password == undefined && email == undefined) {
        let error = new Error(400, 'Algum dos campos deve estar informados.');
        return res.status(400).send(error);
    }

    try {
        let user_data = await db.oneOrNone({
            text: 'SELECT * FROM users WHERE user_id = $1',
            values: [user_id]
        });

        if(user_data === null) {
            let error = new Error(404, 'O id do usuário informado não está na base de dados.');
            return res.status(404).send(error);
        };

         if(username !== undefined && user_data.username !== username) {
            const test_username_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND username = $2',
                values: [user_id, username]
            });

            if(test_username_used !== null) {
                let username_already_used = new Error(400, 'O usuário colocado já está sendo usado por outra pessoa.');
                return res.status(400).send(username_already_used);
            }
        }
        if(email !== undefined && user_data.email !== email) {
            const test_email_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND email = $2',
                values: [user_id, email]
            });

            if(test_email_used !== null) {
                let email_already_used = new Error(400, 'O email colocado já está sendo usado por outra pessoa.');
                return res.status(400).send(email_already_used);
            }
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

    if(username_conditions.length !== 0 || password_conditions.length !== 0 || email_conditions.length !== 0) {
        let error = new Error(400, compilation_errors);
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

module.exports = { registerUser, loginUser, selectAllUsers, selectUser, updateUser, patchUser, deleteUser, username_verification, password_verification, email_verification }