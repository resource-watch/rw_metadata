
class MetadataDuplicated extends Error {

    constructor(message) {
        super(message);
        this.name = 'MetadataDuplicated';
        this.message = message;
    }

}

module.exports = MetadataDuplicated;
