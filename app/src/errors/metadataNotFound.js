'use strict';

class MetadataNotFound extends Error{

    constructor(message){
        super(message);
        this.name = 'MetadataNotFound';
        this.message = message;
    }
}
module.exports = MetadataNotFound;
