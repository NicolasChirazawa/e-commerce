const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const bcrypt = require('bcrypt');
const User_model = require('../app/models/user.js');

describe('Unitary tests "/users"', () => {
    describe('Verification of username field', () => {
        test('Returns length condition', () => {
            const user = new User_model('ab');
            const username_condition = user.username_verification();
            
            assert.deepEqual(
                username_condition.description, 
                ['O username deve ter ao menos 3 caracteres.']);
        });

        test('Pass all the conditions', () => {
            const user = new User_model('abc');
            const username_condition = user.username_verification();
            
            assert.deepEqual(
                username_condition.description, 
                []
            );
        });
    });

    describe('Verification of password field', () => {
        test('Returns length condition', () => {
            const user = new User_model('', 'Ab9@')
            const password_condition = user.password_verification();
            
            assert.deepEqual(
                password_condition.description, 
                ['A senha deve ter ao menos 5 caracteres.']
            );
        });

        test('Returns special character condition', () => {
            const user = new User_model('', 'Ab979');
            const password_condition = user.password_verification();
            
            assert.deepEqual(
                password_condition.description, 
                ['A senha deve ter ao menos um caractere especial.']
            );
        });

        test('Returns number condition', () => {
            const user = new User_model('', 'Ab#aang');
            const password_condition = user.password_verification();
            
            assert.deepEqual(
                password_condition.description, 
                ['A senha deve ter ao menos um número.']
            );
        });

        test('Returns number condition', () => {
            const user = new User_model('', 'Ab#aang8');
            const password_condition = user.password_verification();
            
            assert.deepEqual(
                password_condition.description, 
                []
            );
        });
    });

    describe('Verification of email field', () => {
        test('Regex test 1', () => {
            const user = new User_model('', '', '@gmail.com');
            const email_conditions = user.email_verification();
            
            assert.deepEqual(
                email_conditions.description,
                ['Insira um e-mail válido.']
            );
        });

        test('Regex test 2', () => {
            const user = new User_model('', '', 'h82@gmail.test')
            const email_conditions = user.email_verification();
            
            assert.deepEqual(
                email_conditions.description, 
                ['Insira um e-mail válido.']
            );
        });

        test('Regex test 3', () => {
            const user = new User_model('', '', 'hgmail.com')
            const email_conditions = user.email_verification();
            
            assert.deepEqual(
                email_conditions.description, 
                ['Insira um e-mail válido.']
            );
        });

        test('Regex test 4', () => {
            const user = new User_model('', '', 'bc@gmail.com.br.tv')
            const email_conditions = user.email_verification();
            assert.deepEqual(
                email_conditions.description, 
                ['Insira um e-mail válido.']
            );
        });

        test('Regex test 4', () => {
            const user = new User_model('', '', 'abc@gmail.com.br');
            const email_conditions = user.email_verification();

            assert.deepEqual(
                email_conditions.description, 
                []
            );
        });
    });
});

describe('Integrated tests', async () => {
    
    test('POST "/Register"', async (inside) => {
        await inside.test('Need to fill all the fields', async() => {
            const body = {
                username: 'wjhcgqowcgeocq'
            };

            const request = await fetch('http://localhost:3000/v1/register', {
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Nenhum dos campos deve estar vazio' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('This user already exists', async() => {
            const body = {
                username: 'Usuario Teste',
                password: 'tTeste@313#',
                email: 'nome@teste.com.br'
            };

            const request = await fetch('http://localhost:3000/v1/register', {
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Já existe um usuário com esse username e email registrado' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Need to correct the password', async() => {
            const body = {
                username: 'wjhcgqowcgeocq',
                password: 'teste',
                email: 'fodinha@gmail.com'
            };

            const request = await fetch('http://localhost:3000/v1/register', {
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { 
                username: [],
                password: ['A senha deve ter ao menos um caractere maiúsculo.', 'A senha deve ter ao menos um número.', 'A senha deve ter ao menos um caractere especial.'],
                email: [] 
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('User registed with success', async() => {
            const body = {
                username: 'testes12345',
                password: 'Teste12@',
                email: 'testereal@gmail.com'
            };

            const request = await fetch('http://localhost:3000/v1/register', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async(result) => await result.json());

            delete request['user_id'];
            delete request['created_at'];

            const hashed_password = await bcrypt.compare(body.password, request.password);
            request.password = true;

            const result = request;
            const expect_result = {
                username: 'testes12345',
                password: hashed_password,
                email: 'testereal@gmail.com'
            };

            assert.deepEqual(result, expect_result);
        });
    });

    test('POST /Login', async (inside) => {
        await inside.test('Need to fill username or email', async() => {
            const body = {
                password: 'teste'
            };

            const request = await fetch('http://localhost:3000/v1/login', {
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Insira username ou email' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Need to fill the field password', async() => {
            const body = {
                username: 'Usuario Teste',
                email: 'nome@teste.com.br'
            };

            const request = await fetch('http://localhost:3000/v1/login', {
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Insira a senha' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Password wrong', async() => {
            const body = {
                username: 'testes12345',
                password: 'Teste12',
                email: 'testereal@gmail.com'
            };

            const request = await fetch('http://localhost:3000/v1/login', {
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { 
                error: 'Usuário e/ou senha errada'
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('User logged with success', async() => {
            const body = {
                username: 'testes12345',
                password: 'Teste12@',
                email: 'testereal@gmail.com'
            };

            const request = await fetch('http://localhost:3000/v1/login', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            const result = request.status;
            const expect_result = 201;

            assert.deepEqual(result, expect_result);
        });
    });

    test('GET "/Users/:user_id"', async (inside) => {
        const user = {
            username: "Usuario Teste",
            password: "Abc123@",
            email: "nome@teste.com.br" 
        }

        const { token } = await fetch('http://localhost:3000/v1/login', {
            method: 'POST',
            body: JSON.stringify(user),
            headers: {
                'Content-Type': 'application/json'
        }}).then(async (result) => await result.json());

        const users = await fetch(`http://localhost:3000/v1/users`, {
            headers: {
                'authorization': 'Bearer ' + token
            }
        }).then(async(result) => await result.json());

        // Pegar o id do último usuário
        const user_id = users[users.length - 1].user_id;

        await inside.test('selete a non-existencial user', async() => {

            const request = await fetch(`http://localhost:3000/v1/users/${user_id + 100}`, {
                headers: {
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Usuário não encontrado' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('select the last user', async() => {

            const request = await fetch(`http://localhost:3000/v1/users/${user_id}`, {
                headers: {
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => result.json());

            request.password = await bcrypt.compare('Teste12@', request.password);
            delete request['created_at'];
            delete request['last_login'];

            const result = request;
            const expect_result = {
                user_id: user_id,
                username: 'testes12345',
                password: true,
                email: 'testereal@gmail.com'
            };

            assert.deepEqual(result, expect_result);
        });
    });

    test('PUT "/Users"', async (inside) => {
        const user = {
            username: "Usuario Teste",
            password: "Abc123@",
            email: "nome@teste.com.br" 
        }

        const { token } = await fetch('http://localhost:3000/v1/login', {
            method: 'POST',
            body: JSON.stringify(user),
            headers: {
                'Content-Type': 'application/json'
        }}).then(async (result) => await result.json());

        const users = await fetch(`http://localhost:3000/v1/users`, {
            headers: {
                'authorization': 'Bearer ' + token
            }
        }).then(async(result) => await result.json());

        // Pegar o id do último usuário
        const user_id = users[users.length - 1].user_id;

        await inside.test('No body on request', async() => {
            const body = {
                teste: "teste" 
            }

            const request = await fetch(`http://localhost:3000/v1/users/${user_id}`, {
                body: JSON.stringify(body),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Nenhum dos campos deve estar vazio' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('User not found', async() => {
            const body = {
                username: "nao existe esse usuario",
                password: "ljehfb$%4kç3j",
                email: "naoexisteusuarioaqui@gmail.com" 
            }

            const request = await fetch(`http://localhost:3000/v1/users/${user_id + 100}`, {
                body: JSON.stringify(body),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Usuário não encontrado' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Already there is a user with this username', async() => {
            const body = {
                username: "Usuario Teste",
                password: "ljehfb$%4kç3j",
                email: "naoexisteusuarioaqui@gmail.com" 
            }

            const request = await fetch(`http://localhost:3000/v1/users/${user_id}`, {
                body: JSON.stringify(body),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Já existe um usuário com esse nome' };

            assert.deepEqual(result, expect_result);
        });
        
        await inside.test('Already there is a user with this email', async() => {
            const body = {
                username: "naoexisteesseusuario",
                password: "ljehfb$%4kç3j",
                email: "nome@teste.com.br" 
            }

            const request = await fetch(`http://localhost:3000/v1/users/${user_id}`, {
                body: JSON.stringify(body),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Já existe um usuário com esse e-mail' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Need to adjust all the conditions of password', async() => {
            const body = {
                username: "naoexisteesseusuario",
                password: "ljehfb$%4kç3j",
                email: "naoexisteusuarioaqui@gmail.com" 
            }

            const request = await fetch(`http://localhost:3000/v1/users/${user_id}`, {
                body: JSON.stringify(body),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { 
                username: [],
                password: ['A senha deve ter ao menos um caractere maiúsculo.'],
                email: []
            };

            assert.deepEqual(result, expect_result);
        });

                await inside.test('Need to adjust all the conditions of password', async() => {
            const body = {
                username: "naoexisteesseusuario",
                password: "ljehfb$%4kç3J",
                email: "naoexisteusuarioaqui@gmail.com" 
            }

            const request = await fetch(`http://localhost:3000/v1/users/${user_id}`, {
                body: JSON.stringify(body),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            });

            const result = request.status;
            const expect_result = 204;

            assert.deepEqual(result, expect_result);
        });
    });

    test('DELETE "/Users"', async (inside) => {
        const user = {
            username: "Usuario Teste",
            password: "Abc123@",
            email: "nome@teste.com.br" 
        }

        const { token } = await fetch('http://localhost:3000/v1/login', {
            method: 'POST',
            body: JSON.stringify(user),
            headers: {
                'Content-Type': 'application/json'
        }}).then(async (result) => await result.json());

        const users = await fetch(`http://localhost:3000/v1/users`, {
            headers: {
                'authorization': 'Bearer ' + token
            }
        }).then(async(result) => await result.json());

        // Pegar o id do último usuário
        const user_id = users[users.length - 1].user_id;

        await inside.test('delete a non-existencial user', async() => {

            const request = await fetch(`http://localhost:3000/v1/users/${user_id + 100}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = { error: 'Usuário não encontrado' };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('delete the last user', async() => {

            const request = await fetch(`http://localhost:3000/v1/users/${user_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + token
                }
            });

            const result = 204;
            const expect_result = request.status;

            assert.deepEqual(result, expect_result);
        });
    });
});