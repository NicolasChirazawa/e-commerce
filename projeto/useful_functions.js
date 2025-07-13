function generate_date_dmy() {
    let DateTime = new Date();

    return DateTime.getFullYear() + '/' + (DateTime.getMonth() + 1) + '/' + DateTime.getDate() + ' ' + DateTime.getHours() + ':' + DateTime.getMinutes() + ':' + DateTime.getSeconds();
}

module.exports = { generate_date_dmy };