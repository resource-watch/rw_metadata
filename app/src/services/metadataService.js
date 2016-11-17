'use strict';

const logger = require('logger');
const config = require('config');
const Metadata = require('models/metadata');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');

class MetadataService {
    
    static * get(dataset, resource){
        logger.debug('Getting metadata');
        return yield Metadata.findOne({
            dataset: dataset,
            resource: resource
        }).exec();
    }

    static * create(dataset, resource, body){
        logger.debug('Checking if metadata exists');
        let _metadata = yield Metadata.findOne({
            dataset: dataset,
            resource: resource
        }).exec();
        if(!_metadata){
            logger.error('Error creating metadata');
            throw new MetadataDuplicated(`Metadata of resource ${resource.type} : ${resource.id} already exists`);
        }
        logger.debug('Creating metadata');
        let metadata = new Metadata({
            dataset: dataset,
            resource: resource,
            app: body.app,
            language: body.language,
            name: body.name,
            description: body.description,
            source: body.source,
            citation: body.citation,
            license: body.license,
            info: body.info
        });
        return yield metadata.save().exec();
    }

    static * update(dataset, resource, body){ //@TODO PATCH or PUT (this is patch)
        let metadata = yield Metadata.findOne({
            dataset: dataset,
            resource: resource
        }).exec();
        if(!metadata){
            logger.error('Error updating metadata');
            throw new MetadataNotFound(`Metadata of resource ${resource.type} : ${resource.id} doesn't exist`);
        }
        logger.debug('Updating metadata');
        metadata.app = body.app; // @TODO: better
        metadata.language = body.language;
        metadata.name = body.name;
        metadata.description = body.description;
        metadata.source = body.source;
        metadata.citation = body.citation;
        metadata.license = body.license;
        metadata.info = body.info;
        return yield metadata.save().exec();
    }

    static * delete(dataset, resource){
        let metadata = yield Metadata.findOne({
            dataset: dataset,
            resource: resource
        }).exec();
        if(!metadata){
            logger.error('Error deleting metadata');
            throw new MetadataNotFound(`Metadata of resource ${resource.type} : ${resource.id} doesn't exist`);
        }
        logger.debug('Deleting metadata');
        return yield metadata.remove().exec();
    }

    static * findByIds(filter){
        logger.info(`Obtaining metadata with filters ${filter}`);
        let filters = {};
        if(filter && filter.ids){
            filters.dataset = {
                $in: filter.ids
            };
        }
        if(filter && filter.application){
            filters.application = filter.application;
        }
        return yield Metadata.find(filters).exec();
    }

}

module.exports = MetadataService;
