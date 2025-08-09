const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../bd_connection');

class Payment {
    constructor(payment) {
        this.payment = payment;
    }

    paymentValid() {
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

    }
}

module.exports = Payment;