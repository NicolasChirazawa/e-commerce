const Product = require('./product.js');

class ProductStorage extends Product {
    constructor (name, quantity, price, product_id) {
        super(name, quantity, price);
        this.product_id = product_id;
    }

    is_valid_price () {
        if((typeof this.price) !== "number") {
            return false;
        }
        return (this.price >= 0)
    };

    is_avaliable_quantity(quantity_params) {
        return (this.quantity >= quantity_params);
    }

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

    async search_product_storage() {
        try{
             const product_storage = await db.oneOrNone({
                text: 'SELECT * FROM products WHERE product_id = $1',
                values: [this.product_id]
            });

            return {
                status: 'success',
                response: product_storage
            }
        } catch (e) {
            console.log(e);
            return {
                status: 'failed',
                response: '111'
            }
        }
    }
}

module.exports = ProductStorage;