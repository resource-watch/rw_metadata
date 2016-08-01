'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var metadataSerializer = new JSONAPISerializer('metadata', {
    attributes: ['info', 'application', 'dataset'],
    info:{
        pluralizeType: false
    },
    pluralizeType: false,
    keyForAttribute: 'camelCase'
});

class MetadataSerializer {

    static serialize(data) {

        let result = {
            data:[]
        };
        if(data){
            if(!Array.isArray(data)){
                data = [data];
            }
            data.forEach(function(el){
                result.data.push({
                    id: el._id,
                    type: 'metadata',
                    attributes:{
                        dataset: el.dataset,
                        application: el.application,
                        info: el.info
                    }
                });
            });
        }
        return result;
    }
}

module.exports = MetadataSerializer;
