const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const Product = require('../app/models/product.js'); 

describe('Unitary tests', async () => {
    test('"is_empty" functions true', () => {
        const product = new Product();
        
        const test_product_name =     product.is_name_empty();
        const test_product_price =    product.is_price_empty();
        const test_product_quantity = product.is_quantity_empty();
        
        let final_test = false;
        if(test_product_name === true && test_product_name === test_product_price && test_product_name === test_product_quantity) { final_test = true } 

        const result = final_test;
        const expect_result = true;

        assert.equal(result, expect_result);
    });

    test('"is_empty" functions false', () => {
        const product = new Product('abs', 124, 134);
        
        const test_product_name =     product.is_name_empty();
        const test_product_price =    product.is_price_empty();
        const test_product_quantity = product.is_quantity_empty();
        
        let final_test = false;
        if(test_product_name === true && test_product_name === test_product_price && test_product_name === test_product_quantity) { final_test = true } 

        const result = final_test;
        const expect_result = false;

        assert.equal(result, expect_result);
    });

    test('"validation" function false', () => {
        const product = new Product('abc', -12, 11);

        const quantity_test = product.is_valid_quantity();

        const result = quantity_test;
        const expect_result = false;

        assert.equal(result, expect_result);
    });

    test('"validation" function false', () => {
        const product = new Product('abc', '-12', 11);

        const quantity_test = product.is_valid_quantity();

        const result = quantity_test;
        const expect_result = false;

        assert.equal(result, expect_result);
    });

    test('"validation" function false', () => {
        const product = new Product('abc', 12, 11);

        const quantity_test = product.is_valid_quantity();

        const result = quantity_test;
        const expect_result = true;

        assert.equal(result, expect_result);
    });
})

describe('Integrated tests', async () => {
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
    
    await test('POST "/products"', async (inside) => {
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
                error: 'Nenhum dos campos deve estar vazio'
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
                quantity: 'Insira uma quantidade válida',
                price: 'Insira um preço válido'
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

            // Adjust for the test
            delete result.product_id
            product_id = result.product_id;

            assert.deepEqual(result, expect_result);
        });
    });
    
    await test('GET "/products/:product_id', async (inside) => {
        
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
                error:'Não foi possível encontrar um produto com o id informado'
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

    await test('PUT "/products/:product_id"', async (inside) => {
        
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
                error: 'Nenhum dos campos deve estar vazio'
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
                error: 'Não foi possível encontrar um produto com o id informado'
            };

            assert.deepEqual(result, expect_result);
        });

        await inside.test('Looking for "is_valid" functions', async () => {
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
                quantity: 'Insira uma quantidade válida',
                price: 'Insira um preço válido'
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

    await test('/DELETE "/products/:product_id"', async (inside) => {

        let product_id = await fetch(`http://localhost:3000/v1/products`, {
        headers: {
            Authorization: 'Bearer ' + token
        }}).then(async (result) => await result.json());

        product_id = product_id[product_id.length - 1].product_id;

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
                error: 'Não foi possível encontrar um produto com o id informado'
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
    });
});