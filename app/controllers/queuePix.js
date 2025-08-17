const connectionRedis = require('../redis_connection.js');

const { Queue, Worker } = require('bullmq');
const Datetime = require('../models/datetime.js');
const ShoppingCart = require('../models/shoppingCart.js');
const CartProducts = require('../models/cartProducts.js');
const Payment = require('../models/payment.js');

const processPIX = new Queue('processPIX', {
    connection: connectionRedis
});

// processPIX.add('pix', {data: data, shoppingCart: shoppingCart }, {delay: 1000 * 60 * 15})

const finishedPIX = new Worker('processPIX', 
    async (PIX) => {
        PIX = PIX.data;

        let pix_data = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${PIX.id}`, {
            headers: {
                'Authorization': 'Bearer ' + process.env.ABACATE_SECRET_KEY
            }
        }).then( async(response) => await response.json() );
        pix_data = pix_data.data;

        const datetime = new Datetime().getTimestamp();
        const shoppingCart = new ShoppingCart(PIX.user_id, PIX.shoppingCart_id);
        const cartProducts = new CartProducts(PIX.shoppingCart_id, PIX.products);
        const payment = new Payment();

        if(pix_data.status !== 'PAID') { 
            let statusPayment = 'Em aberto';
            await shoppingCart.changeStatusCart(statusPayment, datetime);
            await cartProducts.unreserveProducts(datetime);
            return console.log(`O carrinho de id ${PIX.shoppingCart_id} não foi pago.`);
        }
        
        await cartProducts.discountStorage(datetime);
        await cartProducts.unreserveProducts(datetime);

        pix_data.status = 'Pago';
        await shoppingCart.changeStatusCart(pix_data.status, datetime);
        await payment.createNewPayment(PIX.shoppingCart_id, 'PIX', PIX.price, 'AbacatePay', PIX.id, datetime);
        await shoppingCart.createNewCart(datetime);
    },
    {
        connection: connectionRedis
    }
);

finishedPIX.on('completed', async (PIX) => {
    PIX = PIX.data;
    console.log(`Tudo certo com o carrinho ${PIX.shoppingCart_id}`);
});

finishedPIX.on('failed', async (PIX) => {
    PIX = PIX.data;
    console.log(`Deu erro com o carrinho ${PIX.shoppingCart_id}`);
});


module.exports = processPIX;