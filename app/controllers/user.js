const User = require('../models/user.js');
const Error = require('../models/error.js');
const Datetime = require('../models/datetime.js');

const db = require('../bd_connection.js');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async function (req, res) {
    const { username, password, email } = req?.body;
    const user = new User(username, password, email);

    if (
        user.is_username_empty() || 
        user.is_password_empty() || 
        user.is_email_empty()
    ) {
        return res.status(400).send(new Error().getMessage('001'));
    };

    const is_username_on_database = await user.is_username_on_database();
    if(is_username_on_database.status === 'failed') { return res.status(500).send(new Error.getMessage(is_username_on_database.response)) }



    const is_email_on_database = await user.is_email_on_database();
    if(is_email_on_database.status === 'failed') { return res.status(500).send(new Error.getMessage(is_email_on_database.response)) }

    if(is_username_on_database.response === true && is_email_on_database.response === true) { 
        return res.status(400).send(new Error().getMessage('002'));
    };
    if(is_username_on_database.response === true) { return res.status(400).send(new Error().getMessage('007')) }
    if(is_email_on_database.response === true) { return res.status(400).send(new Error().getMessage('008')) }

    const username_conditions = user.username_verification();
    const password_conditions = user.password_verification();
    const email_conditions    = user.email_verification();

    if(
        username_conditions.length > 0 || 
        password_conditions.length > 0 || 
        email_conditions.length > 0
    ) {
        let compilation_errors = {
            username: username_conditions.description,
            password: password_conditions.description,
            email: email_conditions.description
        }
        return res.status(400).send(compilation_errors);
    }

    try {
        const saltrounds = 10;
        const hashed_password = await bcrypt.hash(user.password, saltrounds);

        let insert_user = '';

        await db.tx(async (t) => {
            const dateTime = new Datetime().getTimestamp();
            insert_user = await t.one({
                text: 'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, $4) RETURNING user_id, username, password, email, created_at',
                values: [user.username, hashed_password, user.email, dateTime]
            });

            const shooping_cart_status = 'Em aberto';
            const create_shopping_cart = await t.none({
                text: 'INSERT INTO Shopping_Cart (user_id, status, created_at) VALUES ($1, $2, $3)',
                values: [insert_user.user_id, shooping_cart_status, dateTime]
            });

            return t.batch([insert_user, create_shopping_cart]);
        });

        return res.status(201).send(insert_user);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('101'))
    }
}

const loginUser = async function (req, res) {
    const { username, password, email } = req?.body;
    const user = new User(username, password, email);

    if (user.is_username_empty() && user.is_email_empty()) { return res.status(400).send(new Error().getMessage('003')) }
    if (user.is_password_empty()) { return res.status(400).send(new Error().getMessage('004')) }

    const loginMethodChoosed = (!(user.is_username_empty()) ? 
        {method: 'username', value: user.username} : 
        {method: 'email',    value: user.email});

    try {
        const dateTime = new Datetime().getTimestamp();

        let user_data = await db.oneOrNone({
            text: `SELECT user_id, password FROM users WHERE ${loginMethodChoosed.method} = $1`,
            values: [loginMethodChoosed.value]
        });

        const password_crypto_verification = await bcrypt.compare(user.password, user_data.password);
        if(password_crypto_verification === false) { return res.status(400).send(new Error().getMessage('005')) }

        await db.none({
            text: `UPDATE users SET last_login = $1 WHERE user_id = $2`,
            values: [dateTime, user_data.user_id]
        });

        const token_user = jwt.sign (
            {user_id: user_data.user_id}, 
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        return res.status(201).send({ token: token_user });
    } catch(e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('102'));
    }
}

const selectAllUsers = async function (_, res) {
    try {
        const all_users = await db.any('SELECT * FROM users ORDER BY user_id');
        return res.status(200).send(all_users);
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('103'));
    }
}

const selectUser = async function (req, res) {
    const { user_id } = req?.params;
    const user = new User();

    const choosedUser = await user.search_user(user_id);
    
    if(choosedUser.status   === 'failed') { return res.status(500).send(new Error().getMessage(choosedUser.response)) }
    if(choosedUser.response === null    ) { return res.status(404).send(new Error().getMessage('006')) }

    return res.status(200).send(choosedUser.response);
}

const updateUser = async function (req, res) {
    const { user_id } = req?.params;
    const { username, password, email } = req?.body;
    const user = new User(username, password, email);

    if (
        user.is_username_empty() || 
        user.is_password_empty() || 
        user.is_email_empty()
    ) {
        return res.status(400).send(new Error().getMessage('001'));
    }

    try {
        const user_data = await user.search_user(user_id);

        if(user_data.status   === 'failed') { return res.status(500).send(new Error().getMessage(choosedUser.response)) }
        if(user_data.response === null    ) { return res.status(404).send(new Error().getMessage('006')) }

        if (user_data.username !== user.username) {
            const test_username_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND username = $2',
                values: [user_id, user.username]
            });

            if (test_username_used !== null) { return res.status(400).send(new Error().getMessage('007')) }
        }

        if (user_data.email !== user.email) {
            const test_email_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND email = $2',
                values: [user_id, user.email]
            });

            if (test_email_used !== null) { return res.status(400).send(new Error().getMessage('008')) }
        }
        
    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('100')); 
    }

    const username_conditions = user.username_verification();
    const password_conditions = user.password_verification();
    const email_conditions    = user.email_verification();

    if(
        username_conditions.length > 0 || 
        password_conditions.length > 0 || 
        email_conditions.length    > 0
    ) {
        let compilation_errors = {
            username: username_conditions.description,
            password: password_conditions.description,
            email:    email_conditions.description
        }
        return res.status(400).send(compilation_errors);
    }

    try {
        const saltrounds = 10;
        const hashed_password = await bcrypt.hash(user.password, saltrounds);

        await db.tx(async (t) => {
            const user_data = await t.one({
                text: "SELECT created_at, last_login FROM users WHERE user_id = $1",
                values: [user_id]
            });

            const updateUser = await t.none({
                text: 'UPDATE users SET username = $1, password = $2, email = $3, created_at = $4, last_login = $5 WHERE user_id = $6' ,
                values: [user.username, hashed_password, user.email, user_data.created_at, user_data.last_login, user_id]
            });

            return t.batch([user_data, updateUser])
        });
        return res.status(204).send();
    } catch(e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('105'))
    }
}

const deleteUser = async function (req, res) {
    const { user_id } = req?.params; 
    const user = new User();

    const user_data = await user.search_user(user_id);

    if(user_data.status   === 'failed') { return res.status(500).send(new Error().getMessage(user_data.response)) }
    if(user_data.response === null    ) { return res.status(404).send(new Error().getMessage('006')) }

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

            return t.batch([deleted_shopping_carts, deleted_user]);
        });
        return res.status(204).send();
    } catch (e) {
        console.log(e);
        return res.status(400).send(new Error().getMessage('106'));
    }
}

const patchUser = async function (req, res) {
    const { user_id } = req?.params;
    const { username, password, email } = req?.body;
    const user = new User(username, password, email);

    if(
        user.is_username_empty() && 
        user.is_password_empty() && 
        user.is_email_empty()
    ) {
        return res.status(400).send(new Error().getMessage('009'));
    }

    try {
        const user_data = await user.search_user(user_id);

        if(user_data.status   === 'failed') { return res.status(500).send(new Error().getMessage(choosedUser.response)) }
        if(user_data.response === null    ) { return res.status(404).send(new Error().getMessage('006')) }

        if(user.username !== undefined && user_data.username !== user.username) {
            const test_username_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND username = $2',
                values: [user_id, user.username]
            });

            if(test_username_used !== null) { return res.status(400).send(new Error().getMessage('007')) };
        }
        if(user.email !== undefined && user_data.email !== user.email) {
            const test_email_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id <> $1 AND email = $2',
                values: [user_id, user.email]
            });

            if(test_email_used !== null) { return res.status(400).send(new Error().getMessage('008')) }
        }

    } catch (e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('100')); 
    }

    let username_conditions = [];
    let password_conditions = [];
    let email_conditions = [];
    let compilation_errors = {};
    let query_update_text = [];
    let query_update_values = [];

    if(user.username !== undefined) { 
        username_conditions = user.username_verification(); 
        compilation_errors['username'] = username_conditions.description;

        query_update_text.push(`username = $${query_update_text.length + 1}`);
        query_update_values.push(user.username);
    }
    if(user.password !== undefined) { 
        password_conditions = user.password_verification(); 
        compilation_errors['password'] = password_conditions.description;

        const saltrounds = 10;
        const hashed_password = await bcrypt.hash(user.password, saltrounds);

        query_update_text.push(`password = $${query_update_text.length + 1}`);
        query_update_values.push(hashed_password);
    }
    if(user.email !== undefined) { 
        email_conditions = user.email_verification(); 
        compilation_errors['email'] = email_conditions;

        query_update_text.push(`email = $${query_update_text.length + 1}`);
        query_update_values.push(user.email);
    }

    if(
        username_conditions.length !== 0 || 
        password_conditions.length !== 0 || 
        email_conditions.length    !== 0
    ) {
        return res.status(400).send(compilation_errors);
    };

    try {
        let quantity_fields = query_update_text.length;
        query_update_text = query_update_text.join(',');

        const patchedUserChoosed = await db.none({
            text: `UPDATE users SET ${query_update_text} WHERE user_id = $${quantity_fields + 1}` ,
            values: [...query_update_values, user_id]
        });

        return res.status(204).send(patchedUserChoosed);
    } catch(e) {
        console.log(e);
        return res.status(500).send(new Error().getMessage('105'))
    }
}

module.exports = { registerUser, loginUser, selectAllUsers, selectUser, updateUser, patchUser, deleteUser }