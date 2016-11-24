'use strict';

const logger = require('logger');
const config = require('config');
const Metadata = require('models/metadata');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');

class MetadataService {

    static getFilter(_filter){
        var filter = {};
        if(_filter && _filter.application){
            filter.application = { $in: _filter.application.split(',') };
        }
        if(_filter && _filter.language){
            filter.language = { $in: _filter.language.split(',') };
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

    static * create(user, dataset, resource, body){
        logger.debug('Checking if metadata exists');
        let _metadata = yield Metadata.findOne({
            dataset: dataset,
            'resource.id': resource.id,
            'resource.type': resource.type,
            application: body.application,
            language: body.language
        }).exec();
        if(_metadata){
            logger.error('Error creating metadata');
            throw new MetadataDuplicated(`Metadata of resource ${resource.type}: ${resource.id}, application: ${body.application} and language: ${body.language} already exists`);
        }
        logger.debug('Creating metadata');
        let metadata = new Metadata({
            dataset: dataset,
            resource: resource,
            application: body.application,
            language: body.language,
            userId: user.id,
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
            application: body.application,
            language: body.language
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
        logger.debug(`Getting metadata with ids ${resource.ids}`);
        let _query = {
            'resource.id': { $in: resource.ids },
            'resource.type': resource.type
        };
        let query = Object.assign(_query, MetadataService.getFilter(filter));
        let limit = (isNaN(parseInt(filter.limit))) ? 0:parseInt(filter.limit);
        logger.debug('Getting metadata');
        return yield Metadata.find(query).limit(limit).exec();
    }

    /*
    * @returns: hasPermission: <Boolean>
    */
    static * hasPermission(user, dataset, resource, body){
        let permission = true;
        let metadata = yield Metadata.findOne({
            dataset: dataset,
            'resource.id': resource.id,
            'resource.type': resource.type,
            application: body.application,
            language: body.language
        }).exec();
        if(metadata){
            if(metadata.userId !== 'legacy' && metadata.userId !== user.id){
                permission = false;
            }
        }
        return permission;
    }

}

module.exports = MetadataService;
