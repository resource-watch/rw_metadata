'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var metadataSerializer = new JSONAPISerializer('metadata', {
    attributes: ['dataset', 'application', 'resource',
        'language', 'name', 'description', 'source', 'citation',
        'license', 'info'],
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
                        resource: el.resource,
                        language: el.language,
                        name: el.name,
                        description: el.description,
                        source: el.source,
                        citation: el.citation,
                        license: el.license,
                        units: el.units,
                        info: el.info,
                        createdAt: el.createdAt,
                        updatedAt: el.updatedAt,
                        status: el.status
                    }
                });
            });
        }
        return result;
    }
}

module.exports = MetadataSerializer;
