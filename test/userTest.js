const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const userTest = require('../app/controllers/user.js');

/* Verificação de condições do username */
describe('Verification of username field', () => {
    test('Returns length condition', () => {
        const username_condition = userTest.username_verification('ab');
        assert.deepEqual(username_condition, ['O username deve ter ao menos 3 caracteres.']);
    })

    test('Pass all the conditions', () => {
        const username_condition = userTest.username_verification('abc');
        assert.deepEqual(username_condition, []);
    })
});

/* Verificação de condições da senha */
describe('Verification of password field', () => {
    test('Returns length condition', () => {
        const password_condition = userTest.password_verification('Ab9@');
        assert.deepEqual(password_condition, ['A senha deve ter ao menos 5 caracteres.']);
    });

    test('Returns special character condition', () => {
        const password_condition = userTest.password_verification('Ab979');
        assert.deepEqual(password_condition, ['A senha deve ter ao menos um caractere especial.']);
    });

    test('Returns number condition', () => {
        const password_condition = userTest.password_verification('Ab#aang');
        assert.deepEqual(password_condition, ['A senha deve ter ao menos um número.']);
    });

        test('Returns number condition', () => {
        const password_condition = userTest.password_verification('Ab#aang8');
        assert.deepEqual(password_condition, []);
    });
});

/* Verificação de condições do email */
describe('Verification of email field', () => {
    test('Regex test 1', () => {
        const email_conditions = userTest.email_verification('@gmail.com');
        assert.deepEqual(email_conditions, ['Insira um e-mail válido.']);
    });

    test('Regex test 2', () => {
        const email_conditions = userTest.email_verification('h82@gmail.test');
        assert.deepEqual(email_conditions, ['Insira um e-mail válido.']);
    });

    test('Regex test 3', () => {
        const email_conditions = userTest.email_verification('hgmail.com');
        assert.deepEqual(email_conditions, ['Insira um e-mail válido.']);
    });

    test('Regex test 4', () => {
        const email_conditions = userTest.email_verification('abc@gmail.com.br.tv');
        assert.deepEqual(email_conditions, ['Insira um e-mail válido.'])
    });

    test('Regex test 4', () => {
        const email_conditions = userTest.email_verification('abc@gmail.com.br');
        assert.deepEqual(email_conditions, [])
    });
});