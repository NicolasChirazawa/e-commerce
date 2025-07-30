const db = require('../bd_connection.js');

class Product {
    constructor(name, quantity, price) {
        this.name = name;
        this.quantity = quantity;
        this.price = price;
    }

    is_valid_quantity () {
        if((typeof this.quantity) !== "number") {
            return false;
        }
        return (this.quantity >= 0)
    };

    is_valid_price () {
        if((typeof this.price) !== "number") {
            return false;
        }
        return (this.price >= 0)
    };

    is_name_empty() {
        if(this.name === undefined) {
            return true;
        }
        return this.name.length === 0;
    }

    is_quantity_empty() {
        if(this.quantity === undefined) {
            return true;
        }
        return this.quantity.length === 0;
    }

    is_price_empty() {
        if(this.price === undefined) {
            return true;
        }
        return this.price.length === 0;
    }

    async is_product_on_database() {
        try{
            const is_product_already_used = await db.oneOrNone({
                text: 'SELECT * FROM products WHERE name = $1',
                values: [this.name]
            });

            return {
                status: 'success',
                response: is_product_already_used !== null,
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '107',
            }
        }
    }

    async search_product(product_id) {
        try {
            const product_data = await db.oneOrNone({
                text: 'SELECT * FROM products WHERE product_id = $1',
                values: [product_id]
            });

            return {
                status: 'success',
                response: product_data
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

module.exports = Product;