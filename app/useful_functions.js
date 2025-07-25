function generate_date_dmy() {
    let DateTime = new Date();

    return DateTime.getFullYear() + '/' + (DateTime.getMonth() + 1) + '/' + DateTime.getDate() + ' ' + DateTime.getHours() + ':' + DateTime.getMinutes() + ':' + DateTime.getSeconds();
}

function is_valid_quantity (quantity) {
    if((typeof quantity) !== "number") {
        return false;
    }
    return (quantity >= 0)
};

function is_valid_price (price) {
    if((typeof price) !== "number") {
        return false;
    }
    return (price >= 0)
};

module.exports = { generate_date_dmy, is_valid_quantity, is_valid_price };