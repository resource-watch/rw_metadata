
const logger = require('logger');
const ResourceNotFound = require('errors/resourceNotFound.error');
const ctRegisterMicroservice = require('ct-register-microservice-node');

const deserializer = (obj) => {
    if (obj instanceof Array) {
        return obj.data[0].attributes;
    } else if (obj instanceof Object) {
        return obj.data.attributes;
    }
    return obj;
};

class ResourceService {

    /*
    * @returns: hasPermission: <Boolean>
    */
    static async hasPermission(application, user, dataset, pResource) {
        let permission = true;
        let resource;
        logger.debug(application);
        logger.debug(pResource);
        try {
            resource = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/${pResource.type}/${pResource.id}`,
                method: 'GET',
                application,
                json: true
            });
        } catch (err) {
            throw err;
        }
        resource = deserializer(resource);
        if (!resource) {
            logger.error('Error getting resource from microservice');
            throw new ResourceNotFound(`REAL Resource ${pResource.type} - ${pResource.id} and dataset: ${dataset} doesn't exist`);
        }
        if ((user.role === 'MANAGER') && (!resource.userId || resource.userId !== user.id)) {
            permission = false;
        }
        return permission;
    }

}

module.exports = ResourceService;
