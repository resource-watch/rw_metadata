'use strict';

const logger = require('logger');
const config = require('config');
const Metadata = require('models/metadata');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');

class MetadataService {
    static * query(dataset, resource){
        logger.info('Getting metadata'); //@TODO improve
        let filters = {
            dataset: dataset,
            resource: resource
        };
        return yield Metadata.find(filters).exec();
    }

    static * create(dataset, resource, body){
        logger.info('Creating metadata'); //@TODO: improve
        logger.debug('Checking if exist');
        let exists = yield Metadata.findOne({
            dataset: dataset,
            resource: resource
        }).exec();
        logger.debug(exists);
        if(exists){
            logger.error('Metadata exists!!');
            throw new MetadataDuplicated(`Metadata with dataset ${dataset} and application ${resource.id} exists`);
        }
        logger.debug('Creating metadata');
        let metadata = new Metadata({
            dataset: dataset,
            application: application,
            info: body
        });
        yield metadata.save();
        return metadata;
    }

    static * update(dataset, application, body){
        logger.info('Updating metadata'); //@TODO: improve
        let exists = yield Metadata.findOne({
            dataset: dataset,
            application: application
        }).exec();
        if(!exists){
            logger.error('Metadata not exist!!');
            throw new MetadataNotFound(`Metadata with dataset ${dataset} and application ${application} not found`);
        }
        logger.debug('Updating metadata');
        exists.info = body;
        yield exists.save();
        return exists;
    }

    static * delete(dataset, application){
        logger.info('Deleting metadata'); //@TODO: improve
        let filters = {};
        if(dataset){
            filters.dataset = dataset;
        }
        if(application){
            filters.application = application;
        }
        let metadatas = yield Metadata.find(filters).exec();
        if(!metadatas || metadatas.length === 0){
            return null;
        }
        logger.debug('Removing metadata');
        yield Metadata.remove(filters).exec();
        return metadatas;
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
