const db = require('../bd_connection.js');

class shoppingCart {
    constructor(user_id, shopping_cart_id) {
        this.user_id = user_id;
        this.shopping_cart_id = shopping_cart_id;
    }

    async searchCurrentCart() {
        try{
            const current_shopping_cart = await db.oneOrNone({
                text: 'SELECT shopping_cart_id FROM Shopping_Cart WHERE user_id = $1 ORDER BY shopping_cart_id DESC LIMIT 1',
                values: [this.user_id]
            });

            return {
                status: 'success',
                response: current_shopping_cart
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '113'
            }
        }
    }

    async searchProductsCart() {
        try {
            const user_cart_data = await db.any({
                text: 'SELECT * FROM Cart_Products WHERE shopping_cart_id = $1',
                values: [this.shopping_cart_id]
            });

            return {
                status: 'success',
                response: user_cart_data
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '112'
            }
        } 
    }

    async searchProductCart(product_id) {
        try {
            const item_user_cart = await db.oneOrNone({
                text: 'SELECT * FROM Cart_Products WHERE shopping_cart_id = $1 AND product_id = $2',
                values: [this.shopping_cart_id, product_id]
            });

            return {
                status: 'success',
                response: item_user_cart
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '112'
            }
        } 
    }

    async hasProductCart(product_id) {
        try {
            const is_item_on_user_cart = await db.oneOrNone({
                text: 'SELECT * FROM Cart_Products WHERE shopping_cart_id = $1 AND product_id = $2',
                values: [this.shopping_cart_id, product_id]
            });

            return {
                status: 'success',
                response: is_item_on_user_cart !== null
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '112'
            }
        } 
    }

    async changeStatusCart(status, datetime) {
        await db.none({
            text: 'UPDATE Shopping_Cart SET status = $1, last_update = $2 WHERE shopping_cart_id = $3',
            values: [status, datetime, this.shopping_cart_id]
        });
    }

    async checkStatusCart() {
        try {
            let status = await db.one({
                text: 'SELECT status FROM Shopping_Cart WHERE shopping_cart_id = $1',
                values: [this.shopping_cart_id]
            });
            return {
                status: 'success',
                response: status
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '120'
            }
        };
    };

    async changeStatusCart(status, datetime) {
        await db.none({
            text: 'UPDATE Shopping_Cart SET status = $1, last_update = $2 WHERE shopping_cart_id = $3',
            values: [status, datetime, this.shopping_cart_id]
        });
    }

    async createNewCart(datetime) {
        const statusNewCart = 'Em aberto';
        await db.none({
            text: 'INSERT INTO Shopping_Cart (user_id, created_at, status) VALUES ($1, $2, $3)',
            values: [this.user_id, datetime, statusNewCart]
        });

        return;
    };
}

module.exports = shoppingCart;