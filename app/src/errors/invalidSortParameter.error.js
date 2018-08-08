
class InvalidSortParameter extends Error {

    constructor(message) {
        super(message);
        this.name = 'IvalidSortParameter';
        this.message = message;
    }

}

module.exports = InvalidSortParameter;
