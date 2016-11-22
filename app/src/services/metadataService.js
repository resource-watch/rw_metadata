'use strict';

const logger = require('logger');
const config = require('config');
const Metadata = require('models/metadata');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');

class MetadataService {

    static getFilter(_filter){
        var filter = {};
        if(_filter && _filter.app){
            filter.app = { $in: _filter.app.split(',') };
        }
        if(_filter && _filter.lang){
            filter.lang = { $in: _filter.lang.split(',') };
        }
        return filter;
    }

    static * get(dataset, resource, filter){
        let _query = {
            dataset: dataset,
            'resource.id': resource.id,
            'resource.type': resource.type
        };
        let query = Object.assign(_query, MetadataService.getFilter(filter));
        let limit = (isNaN(parseInt(filter.limit))) ? 0:parseInt(filter.limit);
        logger.debug('Getting metadata');
        return yield Metadata.find(query).limit(limit).exec();
    }

    static * create(dataset, resource, body){
        logger.debug('Checking if metadata exists');
        let _metadata = yield Metadata.findOne({
            dataset: dataset,
            'resource.id': resource.id,
            'resource.type': resource.type,
            app: body.app,
            lang: body.lang
        }).exec();
        if(_metadata){
            logger.error('Error creating metadata');
            throw new MetadataDuplicated(`Metadata of resource ${resource.type}: ${resource.id}, app: ${body.app} and lang: ${body.lang} already exists`);
        }
        logger.debug('Creating metadata');
        let metadata = new Metadata({
            dataset: dataset,
            resource: resource,
            app: body.app,
            lang: body.lang,
            name: body.name,
            description: body.description,
            source: body.source,
            citation: body.citation,
            license: body.license,
            info: body.info
        });
        return metadata.save();
    }

    static * update(dataset, resource, body){
        let metadata = yield Metadata.findOne({
            dataset: dataset,
            'resource.id': resource.id,
            'resource.type': resource.type,
            app: body.app,
            lang: body.lang
        }).exec();
        if(!metadata){
            logger.error('Error updating metadata');
            throw new MetadataNotFound(`Metadata of resource ${resource.type}: ${resource.id} doesn't exist`);
        }
        logger.debug('Updating metadata');
        metadata.name = body.name ? body.name:metadata.name;
        metadata.description = body.description ? body.description:metadata.description;
        metadata.source = body.source ? body.source:metadata.source;
        metadata.citation = body.citation ? body.citation:metadata.citation;
        metadata.license = body.license ? body.license:metadata.license;
        metadata.info = body.info ? body.info:metadata.info;
        return metadata.save();
    }

    static * delete(dataset, resource, filter){
        let _query = {
            dataset: dataset,
            'resource.id': resource.id,
            'resource.type': resource.type
        };
        let query = Object.assign(_query, MetadataService.getFilter(filter));
        let metadata = yield Metadata.find(query).exec();
        if(!metadata){
            logger.error('Error deleting metadata');
            throw new MetadataNotFound(`Metadata of resource ${resource.type}: ${resource.id} doesn't exist`);
        }
        logger.debug('Deleting metadata');
        return yield Metadata.remove(query).exec();
    }

    static * getAll(_filter, extendedFilter){
        let filter = MetadataService.getFilter(_filter);
        if(extendedFilter && extendedFilter.type){
            filter['resource.type'] = extendedFilter.type;
        }
        let limit = (isNaN(parseInt(_filter.limit))) ? 0:parseInt(_filter.limit);
        logger.debug('Getting metadata');
        return yield Metadata.find(filter).limit(limit).exec();
    }

    static * getByIds(resource, filter){
        logger.info(`Getting metadata with ids ${resource.ids}`);
        let _query = {
            'resource.id': { $in: resource.ids },
            'resource.type': resource.type
        };
        let query = Object.assign(_query, MetadataService.getFilter(filter));
        let limit = (isNaN(parseInt(filter.limit))) ? 0:parseInt(filter.limit);
        logger.debug('Getting metadata');
        return yield Metadata.find(query).limit(limit).exec();
    }

}

module.exports = MetadataService;
