
const logger = require('logger');
const Metadata = require('models/metadata.model');
const MetadataNotFound = require('errors/metadataNotFound.error');
const MetadataDuplicated = require('errors/metadataDuplicated.error');

class MetadataService {

    static getFilter(filter) {
        const finalFilter = {};
        if (filter && filter.language) {
            finalFilter.language = { $in: filter.language.split(',') };
        }
        return finalFilter;
    }

    static async get(application, dataset, resource, filter) {
        const query = {
            application,
            dataset,
            'resource.id': resource.id,
            'resource.type': resource.type
        };
        const finalQuery = Object.assign(query, MetadataService.getFilter(filter));
        const limit = (isNaN(parseInt(filter.limit, 10))) ? 0 : parseInt(filter.limit, 10);
        logger.debug('Getting metadata');
        return await Metadata.find(finalQuery).limit(limit).exec();
    }

    static async create(application, user, dataset, resource, body) {
        logger.debug('Checking if metadata exists');
        const currentMetadata = await Metadata.findOne({
            application,
            dataset,
            'resource.id': resource.id,
            'resource.type': resource.type,
            language: body.language
        }).exec();
        if (currentMetadata) {
            logger.error('Error creating metadata');
            throw new MetadataDuplicated(`Metadata of resource ${resource.type}: ${resource.id}, and language: ${body.language} already exists`);
        }
        logger.debug('Creating metadata');
        const metadata = new Metadata({
            dataset,
            resource,
            application,
            language: body.language,
            userId: user.id,
            name: body.name,
            description: body.description,
            source: body.source,
            citation: body.citation,
            license: body.license,
            units: body.units,
            info: body.info,
            columns: body.columns,
            applicationProperties: body.applicationProperties
        });
        return await metadata.save();
    }

    static async createSome(application, user, metadatas, dataset, resource) {
        for (let i = 0; i < metadatas.length; i++) {
            await MetadataService.create(application, user, dataset, resource, metadatas[i]);
        }
        return await MetadataService.get(application, dataset, resource, {});
    }

    static async update(application, dataset, resource, body) {
        const metadata = await Metadata.findOne({
            application,
            dataset,
            'resource.id': resource.id,
            'resource.type': resource.type,
            language: body.language
        }).exec();
        if (!metadata) {
            logger.error('Error updating metadata');
            throw new MetadataNotFound(`Metadata of resource ${resource.type}: ${resource.id} doesn't exist`);
        }
        logger.debug('Updating metadata');
        metadata.name = body.name ? body.name : metadata.name;
        metadata.description = body.description ? body.description : metadata.description;
        metadata.source = body.source ? body.source : metadata.source;
        metadata.citation = body.citation ? body.citation : metadata.citation;
        metadata.license = body.license ? body.license : metadata.license;
        metadata.info = body.info ? body.info : metadata.info;
        metadata.columns = body.columns ? body.columns : metadata.columns;
        metadata.applicationProperties = body.applicationProperties ? body.applicationProperties : metadata.applicationProperties;
        metadata.updatedAt = new Date();
        return await metadata.save();
    }

    static async delete(application, dataset, resource, filter) {
        const query = {
            application,
            dataset,
            'resource.id': resource.id,
            'resource.type': resource.type
        };
        const finalQuery = Object.assign(query, MetadataService.getFilter(filter));
        const metadata = await Metadata.findOne(query).exec();
        if (!metadata) {
            logger.error('Error deleting metadata');
            throw new MetadataNotFound(`Metadata of resource ${resource.type}: ${resource.id} and ${filter.language} doesn't exist`);
        }
        logger.debug('Deleting metadata');
        await Metadata.remove(finalQuery).exec();
        return metadata;
    }

    static async getAll(application, filter, extendedFilter) {
        const finalFilter = MetadataService.getFilter(filter);
        finalFilter.application = application;
        if (extendedFilter && extendedFilter.type) {
            finalFilter['resource.type'] = extendedFilter.type;
        }
        const limit = (isNaN(parseInt(filter.limit, 10))) ? 0 : parseInt(filter.limit, 10);
        logger.debug('Getting metadata');
        return await Metadata.find(finalFilter).limit(limit).exec();
    }

    static async getByIds(application, resource, filter) {
        logger.debug(`Getting metadata with ids ${resource.ids}`);
        const query = {
            application,
            'resource.id': { $in: resource.ids },
            'resource.type': resource.type
        };
        const finalQuery = Object.assign(query, MetadataService.getFilter(filter));
        logger.debug('Getting metadata');
        return await Metadata.find(finalQuery).exec();
    }

    static async clone(application, user, dataset, resource, body) {
        logger.debug('Checking if metadata exists');
        let metadatas = await MetadataService.get(application, dataset, resource, {});
        metadatas = metadatas.map(metadata => metadata.toObject());
        if (metadatas.length === 0) {
            throw new MetadataNotFound(`No metadata of resource ${resource.type}: ${resource.id}`);
        }
        try {
            return await MetadataService.createSome(application, user, metadatas, body.newDataset, { type: 'dataset', id: body.newDataset });
        } catch (err) {
            throw err;
        }
    }

    /*
    * @returns: hasPermission: <Boolean>
    */
    static async hasPermission(application, user, dataset, resource, body) {
        let permission = true;
        const metadata = await Metadata.findOne({
            application,
            dataset,
            'resource.id': resource.id,
            'resource.type': resource.type,
            language: body.language
        }).exec();
        if (metadata) {
            if (metadata.userId !== 'legacy' && metadata.userId !== user.id) {
                permission = false;
            }
        }
        return permission;
    }

}

module.exports = MetadataService;
