const db = require('../bd_connection');

class User {
    constructor(username, password, email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }

    username_verification() {
        let username_conditions = [];

        if(this.username.length < 3) {
            username_conditions.push('O username deve ter ao menos 3 caracteres.');
        }

        return {
            'description': username_conditions,
            'length':      username_conditions.length
        }
    }

    password_verification() {
        let password_conditions = [];

        if(this.password.length < 5) {
            password_conditions.push('A senha deve ter ao menos 5 caracteres.');
        }
        if(this.password.length > 30) {
            password_conditions.push('A senha deve possuir no máximo 30 caracteres.');
        }
        if(this.password.search(/[A-Z]/) == -1) {
            password_conditions.push('A senha deve ter ao menos um caractere maiúsculo.');
        }
        if(this.password.search(/[a-z]/) == -1) {
            password_conditions.push('A senha deve ter ao menos um caractere minúsculo.');
        }
        if(this.password.search(/[0-9]/) == -1) {
            password_conditions.push('A senha deve ter ao menos um número.');
        }
        if(this.password.search(/[!@#$%¨&*]/) == -1) {
            password_conditions.push('A senha deve ter ao menos um caractere especial.');
        }

        return {
            'description': password_conditions,
            'length':      password_conditions.length
        };
    }

    email_verification() {
        let email_conditions = [];

        if(this.email.search(/^([a-z0-9]+@[a-z]+(\.[a-z]{1,3}){1,2})$/i) != 0) {
            email_conditions.push('Insira um e-mail válido.')
        }

        return {
            'description': email_conditions,
            'length':      email_conditions.length
        };
    }

    is_username_empty() {
        if(this.username === undefined) {
            return true;
        }

        return this.username.length === 0;
    }

    is_password_empty() {
        if(this.password === undefined) {
            return true;
        }
        return this.password.length === 0;
    }

    is_email_empty() {
        if(this.email === undefined) {
            return true;
        }
        return this.email.length === 0
    }

    async is_username_on_database() {
        try{
            const is_username_already_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE username = $1',
                values: [this.username]
            });

            return {
                status: 'success',
                response: is_username_already_used !== null,
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '100',
            }
        }
    }

    async is_email_on_database() {
        try{
            const is_email_already_used = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE email = $1',
                values: [this.email]
            });

            return {
                status: 'success',
                response: is_email_already_used !== null,
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '100',
            }
        }
    }

    async search_user(user_id) {
        try {
            const choosedUser = await db.oneOrNone({
                text: 'SELECT * FROM users WHERE user_id = $1',
                values: [user_id]
            });

            return {
                status: 'success',
                response: choosedUser
            };
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '104'
            };
        };
    };
}

module.exports = User;