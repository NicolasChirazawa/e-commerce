class cartProducts{
    constructor(shooping_cart_id, products_id, quantity, price) {
        this.shooping_cart_id = shooping_cart_id;
        this.products_id = products_id;
        this.quantity = quantity;
        this.price = price;
    }
}

module.exports = cartProducts;