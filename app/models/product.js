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
}

module.exports = Product;