const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../bd_connection');

class Payment {
    constructor(payment) {
        this.payment = payment;
    }

    isPaymentMethodValid() {
        return (this.payment === 'Cartão' || this.payment === 'PIX')
    };

    async paymentProcess(price) {
        if(this.payment === 'Cartão') {
            const paymentCreditCard = await this.paymentCreditCard(price);
            if(paymentCreditCard.status === 'failed') { return paymentCreditCard }

            return paymentCreditCard;
        };

        if(this.payment === 'PIX') {
            return await this.paymentPIX(price);
        }
    }

    async paymentCreditCard(price) {
        // Teste em código da criação de pagamentos (https://docs.stripe.com/testing)

        const CENTS = 100; // Não há centavos -> 10,00 = 1000
        try {
            const createPaymentIntent = await stripe.paymentIntents.create({
                amount: price * CENTS,
                currency: 'brl'
            });

            const id_payment = createPaymentIntent.id;

            const paymentIntent = await stripe.paymentIntents.confirm(id_payment, {
                payment_method: 'pm_card_visa',
                return_url: 'http://teste.com.br'
            });

            return {
                status: 'success',
                response: paymentIntent
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '118'
            }
        }
    };

    async paymentPIX(price) {
        // O tempo para expirar é em segundos, nesse caso, são 15 minutos
        const expireTimer = 60 * 15;

        let createPIX;
        try {
            createPIX = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + process.env.ABACATE_SECRET_KEY,
                    "Content-Type": "application/json"
                }, body: JSON.stringify({
                    "amount": price * 100,
                    "expiresIn": expireTimer
                })
            }).then( async(response) => response.json() );

            return {
                status: 'success',
                response: createPIX
            }

        } catch(e) {
            console.log(e);
            return {
                status: 'failed',
                response: '119'
            }
        }
    };

    async createNewPayment(shoppingCart_id, paymentMethod, price, paymentGateway, id, datetime) {
        await db.none({
            text: 'INSERT INTO Payments (shopping_cart_id, payment_form, amount, gateway, id, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            values: [shoppingCart_id, paymentMethod, price, paymentGateway, id, datetime]
        });
    }
};

module.exports = Payment;