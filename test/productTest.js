const { describe, test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { json } = require('node:stream/consumers');

/* Verificação do endpoint POST do produto */
describe('Looking for the endpoint "/products"', async () => {
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
    
    await test('/POST', async (inside) => {
        await inside.test('Need all parameters', async () => {

                const body = {
                    name: 'Nome_teste',
                    quantity: 10
                };

                const request = await fetch(`http://localhost:3000/v1/products`, {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                }).then(async (result) => await result.json());

                const result = request;
                const expect_result = {
                    statusCode: 400, 
                    message: 'Preencha todos os campos obrigatórios.'
                }

                assert.deepEqual(result, expect_result);
        });

        await inside.test('Looking for "is_valid" functions', async () => {

                const body = {
                    name: 'Nome_teste',
                    quantity: '10',
                    price: '20'
                };

                const request = await fetch(`http://localhost:3000/v1/products`, {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                }).then(async(result) => await result.json());

                const result = request;
                const expect_result = {
                    statusCode: 400, 
                    message: {
                        quantity: 'Insira uma quantidade válida',
                        price: 'Insira um preço válido'
                    }
                }

                assert.deepEqual(result, expect_result);
        });

        await inside.test('Creating a new product', async () => {

                const body = {
                    name: 'Nome_teste',
                    quantity: 10,
                    price: 20
                };

                const request = await fetch(`http://localhost:3000/v1/products`, {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                }).then(async(result) => await result.json());

                const result = request;
                const expect_result = {
                    name: 'Nome_teste',
                    quantity: 10,
                    price: '20'
                };

                product_id = result.product_id;

                // Adjust for the test
                delete result.product_id

                assert.deepEqual(result, expect_result);
        });
    });
    
    await test('GET', async (inside) => {
        
        let product_id = await fetch(`http://localhost:3000/v1/products`, {
        headers: {
            Authorization: 'Bearer ' + token
        }}).then(async (result) => await result.json());

        product_id = product_id[product_id.length - 1].product_id;

        await inside.test('Product doesnt found', async () => {
            let request = await fetch(`http://localhost:3000/v1/products/${product_id + 100}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = {
                statusCode: 404, 
                message:'Não foi encontrado um produto com o id informado.'
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Product found', async () => {
            let request = await fetch(`http://localhost:3000/v1/products/${product_id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }}).then(async(result) => await result.json());

            delete request.created_at;
            delete request.last_update;

            const result = request;
            const expect_result = {
                    product_id: product_id,
                    name: 'Nome_teste',
                    quantity: 10,
                    price: '20'
            };

            assert.deepEqual(result, expect_result);
        });
    });

    await test('PUT', async (inside) => {
        
        let product_id = await fetch(`http://localhost:3000/v1/products`, {
        headers: {
            Authorization: 'Bearer ' + token
        }}).then(async (result) => await result.json());

        product_id = product_id[product_id.length - 1].product_id;

        await inside.test('Need to inform all the fields', async () => {
            const body = JSON.stringify({
                name: 'Nome_teste',
                price: 30
            });

            let request = await fetch(`http://localhost:3000/v1/products/${product_id + 100}`, {
                body: body,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }, 
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = {
                statusCode: 400, 
                message: 'Nenhum dos campos deve estar vazio.'
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Product doesnt found', async () => {
            const body = JSON.stringify({
                name: 'Nome_teste',
                quantity: 200,
                price: 30
            })

            let request = await fetch(`http://localhost:3000/v1/products/${product_id + 100}`, {
                body: body,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }, 
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = {
                statusCode: 404, 
                message: 'O id do produto informado não está na base de dados.'
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Product updated', async () => {
            const body = JSON.stringify({
                name: 'Nome_teste',
                quantity: '200',
                price: '30'
            })

            let request = await fetch(`http://localhost:3000/v1/products/${product_id}`, {
                body: body,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }, 
            }).then(async(result) => await result.json());

            const result = request;
            const expect_result = {
                statusCode: 400,
                message: {
                    quantity: 'Insira uma quantidade válida',
                    price: 'Insira um preço válido'
                }
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Product updated', async () => {
            const body = JSON.stringify({
                name: 'Nome_teste',
                quantity: 200,
                price: 30
            })

            let request = await fetch(`http://localhost:3000/v1/products/${product_id}`, {
                body: body,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }, 
            });

            const result = request.status;
            const expect_result = 204;

            assert.equal(result, expect_result);
        });
    });

    await test('/DELETE', async (inside) => {

        await inside.test('Product doesnt found', async () => {
            const request = await fetch(`http://localhost:3000/v1/products/${product_id + 100}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            }).then(async (result) => await result.json());

            const result = request;
            const expect_result = {
                statusCode: 404, 
                message: 'O id do produto informado não está na base de dados.'
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Delete the product', async () => {
            const request = await fetch(`http://localhost:3000/v1/products/${product_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });

            const result = request.status;
            const expect_result = 204;

            assert.equal(result, expect_result);
        });
    })
});