const db = require('../bd_connection.js');

class cartProducts {
    constructor(shoppingCartId, products) {
        this.shoppingCartId = shoppingCartId; 
        this.products = products;
    }

    calculatePrice() {
        let price = 0;

        for(let i = 0; i < this.products.length; i++) {
            price += Number(this.products[i].price) * Number(this.products[i].quantity);
        }
        return price;
    }

    async updateProductPrices() {
        let update_prices = [];
        
        for(let i = 0; i < this.products.length; i++) {
            const product_storage = await db.oneOrNone({
                text: 'SELECT * FROM Products WHERE product_id = $1',
                values: [this.products[i].product_id]
            });

            if(this.products[i].price !== product_storage.price) {
                update_prices.push(`O produto ${product_storage.name} teve uma atualização de preço. De ${this.products[i].price} para ${product_storage.price}`);

                try{
                    await db.none({
                        text: 'UPDATE Cart_Products SET price = $1 WHERE shopping_cart_id = $2 AND product_id = $3',
                        values: [product_storage.price, this.shoppingCartId, product_storage.product_id]
                    });
                } catch (e) {
                    console.log(e);
                    return {
                        status: 'failed',
                        response: '116'
                    };
                };
            };
        };
        return {
            status: 'success',
            response: update_prices
        };
    };

    async verifyStorage() {
        let insufficient_storage = [];
        for(let i = 0; i < this.products.length; i++) {
            const product_storage = await db.oneOrNone({
                text: 'SELECT * FROM Products WHERE product_id = $1',
                values: [this.products[i].product_id]
            });

            if(this.products[i].quantity > product_storage.quantity - product_storage.reserved) {
                insufficient_storage.push(`O produto ${product_storage.name} tem um pedido maior do que o estoque disponivel. Pedido: ${this.products[i].quantity}; Disponível: ${product_storage.quantity - product_storage.reserved}`);
            };
        };

        return {
            status: 'success',
            response: insufficient_storage
        };
    };

    async reserveProducts(datetime) {
        for(let i = 0; i < this.products.length; i++) {
            await db.none ({
                text: 'UPDATE Products SET reserved = ((SELECT reserved FROM Products WHERE product_id = $1) + $2), last_update = $3 WHERE product_id = $1',
                values: [this.products[i].product_id, this.products[i].quantity, datetime]
            });
        };
    };

    async unreserveProducts(datetime) {
        for(let i = 0; i < this.products.length; i++) {
            await db.none ({
                text: 'UPDATE Products SET reserved = ((SELECT reserved FROM Products WHERE product_id = $1) - $2), last_update = $3 WHERE product_id = $1',
                values: [this.products[i].product_id, this.products[i].quantity, datetime]
            });
        };
    };

    async discountStorage(datetime) {
        for(let i = 0; i < this.products.length; i++) {
            await db.none ({
                text: 'UPDATE Products SET quantity = ((SELECT quantity FROM Products WHERE product_id = $1) - $2), last_update = $3 WHERE product_id = $1',
                values: [this.products[i].product_id, this.products[i].quantity, datetime]
            });
        };
    };
};

module.exports = cartProducts;