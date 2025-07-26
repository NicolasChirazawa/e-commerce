class Datetime {
    constructor() {
        this.timestamp = new Date();
    }

    getTimestamp() {
        return  (
            this.timestamp.getFullYear()    + '/' + 
            (this.timestamp.getMonth() + 1) + '/' + 
            this.timestamp.getDate()        + ' ' + 
            this.timestamp.getHours()       + ':' + 
            this.timestamp.getMinutes()     + ':' + 
            this.timestamp.getSeconds()
        )
    };
}

module.exports = Datetime;