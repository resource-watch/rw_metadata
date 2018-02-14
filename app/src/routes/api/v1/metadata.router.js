
const Router = require('koa-router');
const logger = require('logger');
const MetadataService = require('services/metadata.service');
const ResourceService = require('services/resource.service');
const MetadataSerializer = require('serializers/metadata.serializer');
const MetadataValidator = require('validators/metadata.validator');
const MetadataNotFound = require('errors/metadataNotFound.error');
const MetadataDuplicated = require('errors/metadataDuplicated.error');
const MetadataNotValid = require('errors/metadataNotValid.error');
const CloneNotValid = require('errors/cloneNotValid.error');
const USER_ROLES = require('app.constants').USER_ROLES;

const router = new Router();

class MetadataRouter {

    static getUser(ctx) {
        return JSON.parse(ctx.headers.user_key) ? JSON.parse(ctx.headers.user_key) : { id: null };
    }

    static getApplication(ctx) {
        return JSON.parse(ctx.headers.app_key).application;
    }

    static getResource(params) {
        let resource = { id: params.dataset, type: 'dataset' };
        if (params.layer) {
            resource = { id: params.layer, type: 'layer' };
        } else if (params.widget) {
            resource = { id: params.widget, type: 'widget' };
        } else {
            // do nothing
        }
        return resource;
    }

    static getResourceTypeByPath(path) {
        let type = 'dataset';
        if (path.indexOf('layer') > -1) {
            type = 'layer';
        } else if (path.indexOf('widget') > -1) {
            type = 'widget';
        } else {
            // do nothing
        }
        return type;
    }

    static async get(ctx) {
        const resource = MetadataRouter.getResource(ctx.params);
        logger.info(`Getting metadata of ${resource.type}: ${resource.id}`);
        const application = MetadataRouter.getApplication(ctx);
        const dataset = ctx.params.dataset;
        const filter = {};
        if (ctx.query.language) { filter.language = ctx.query.language; }
        if (ctx.query.limit) { filter.limit = ctx.query.limit; }
        const result = await MetadataService.get(application, dataset, resource, filter);
        ctx.body = MetadataSerializer.serialize(result);
    }

    static async create(ctx) {
        const resource = MetadataRouter.getResource(ctx.params);
        logger.info(`Creating metadata of ${resource.type}: ${resource.id}`);
        try {
            const application = MetadataRouter.getApplication(ctx);
            const user = MetadataRouter.getUser(ctx);
            const dataset = ctx.params.dataset;
            const result = await MetadataService.create(application, user, dataset, resource, ctx.request.body);
            ctx.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataDuplicated) {
                ctx.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static async update(ctx) {
        const resource = MetadataRouter.getResource(ctx.params);
        logger.info(`Updating metadata of ${resource.type}: ${resource.id}`);
        try {
            const application = MetadataRouter.getApplication(ctx);
            const dataset = ctx.params.dataset;
            const result = await MetadataService.update(application, dataset, resource, ctx.request.body);
            ctx.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataNotFound) {
                ctx.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static async delete(ctx) {
        const resource = MetadataRouter.getResource(ctx.params);
        logger.info(`Deleting metadata of ${resource.type}: ${resource.id}`);
        const filter = {};
        if (ctx.query.language) { filter.language = ctx.query.language; }
        try {
            const application = MetadataRouter.getApplication(ctx);
            const dataset = ctx.params.dataset;
            const result = await MetadataService.delete(application, dataset, resource, filter);
            ctx.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataNotFound) {
                ctx.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static async getAll(ctx) {
        logger.info('Getting all metadata');
        const application = MetadataRouter.getApplication(ctx);
        const filter = {};
        const extendedFilter = {};
        if (ctx.query.language) { filter.language = ctx.query.language; }
        if (ctx.query.limit) { filter.limit = ctx.query.limit; }
        if (ctx.query.type) { extendedFilter.type = ctx.query.type; }
        const result = await MetadataService.getAll(application, filter, extendedFilter);
        ctx.body = MetadataSerializer.serialize(result);
    }

    static async getByIds(ctx) {
        if (!ctx.request.body.ids) {
            ctx.throw(400, 'Bad request');
            return;
        }
        logger.info(`Getting metadata by ids: ${ctx.request.body.ids}`);
        const resource = {
            ids: ctx.request.body.ids
        };
        if (typeof resource.ids === 'string') {
            resource.ids = resource.ids.split(',').map((elem) => elem.trim());
        }
        resource.type = MetadataRouter.getResourceTypeByPath(ctx.path);
        const application = MetadataRouter.getApplication(ctx);
        const filter = {};
        if (ctx.query.language) { filter.language = ctx.query.language; }
        const result = await MetadataService.getByIds(application, resource, filter);
        ctx.body = MetadataSerializer.serialize(result);
    }

    static async clone(ctx) {
        const resource = MetadataRouter.getResource(ctx.params);
        const newDataset = ctx.request.body.newDataset;
        logger.info(`Cloning metadata of ${resource.type}: ${resource.id} in ${newDataset}`);
        try {
            const application = MetadataRouter.getApplication(ctx);
            const user = MetadataRouter.getUser(ctx);
            const dataset = ctx.params.dataset;
            const result = await MetadataService.clone(application, user, dataset, resource, ctx.request.body);
            ctx.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataDuplicated) {
                ctx.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

}

// Negative checking
const authorizationMiddleware = async (ctx, next) => {
    // Check delete
    if (ctx.request.method === 'DELETE' && (!ctx.request.query.language)) {
        ctx.throw(400, 'Bad request');
        return;
    }
    // Get user from query (delete) or body (post-patch)
    const user = MetadataRouter.getUser(ctx);
    if (user.id === 'microservice') {
        await next();
        return;
    }
    if (!user || USER_ROLES.indexOf(user.role) === -1) {
        ctx.throw(401, 'Unauthorized'); // if not logged or invalid ROLE-> out
        return;
    }
    if (user.role === 'USER') {
        ctx.throw(403, 'Forbidden'); // if USER -> out
        return;
    }
    // Get application from query (delete) or body (post-patch)
    const application = MetadataRouter.getApplication(ctx);
    const dataset = ctx.params.dataset;
    const resource = MetadataRouter.getResource(ctx.params);
    let permission;
    try {
        permission = await ResourceService.hasPermission(application, user, dataset, resource);
        if (!permission) {
            ctx.throw(403, 'Forbidden');
            return;
        }
    } catch (err) {
        logger.error(err);
        ctx.throw(403, 'Forbidden');
        return;
    }
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        if (user.extraUserData.apps.indexOf(application) === -1) {
            ctx.throw(403, 'Forbidden'); // if manager or admin but no application -> out
            return;
        }
        if (user.role === 'MANAGER' && ctx.request.method !== 'POST') { // extra check if a MANAGER wants to update or delete
            permission = await MetadataService.hasPermission(application, user, dataset, resource, ctx.request.body);
            if (!permission) {
                ctx.throw(403, 'Forbidden');
                return;
            }
        }
    }
    await next(); // SUPERADMIN is included here
};

// Validator Wrapper
const validationMiddleware = async (ctx, next) => {
    try {
        MetadataValidator.validate(ctx);
    } catch (err) {
        if (err instanceof MetadataNotValid) {
            ctx.throw(400, err.getMessages());
            return;
        }
        throw err;
    }
    await next();
};

// Validator Wrapper
const cloneValidationMiddleware = async (ctx, next) => {
    try {
        MetadataValidator.validateClone(ctx);
    } catch (err) {
        if (err instanceof CloneNotValid) {
            ctx.throw(400, err.getMessages());
            return;
        }
        throw err;
    }
    await next();
};

// dataset
router.get('/dataset/:dataset/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/metadata', validationMiddleware, authorizationMiddleware, MetadataRouter.create);
router.post('/dataset/:dataset/metadata/clone', cloneValidationMiddleware, authorizationMiddleware, MetadataRouter.clone);
router.patch('/dataset/:dataset/metadata', validationMiddleware, authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/metadata', authorizationMiddleware, MetadataRouter.delete);
// widget
router.get('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/widget/:widget/metadata', validationMiddleware, authorizationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/widget/:widget/metadata', validationMiddleware, authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/widget/:widget/metadata', authorizationMiddleware, MetadataRouter.delete);
// layer
router.get('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/layer/:layer/metadata', validationMiddleware, authorizationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/layer/:layer/metadata', validationMiddleware, authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/layer/:layer/metadata', authorizationMiddleware, MetadataRouter.delete);
// generic
router.get('/metadata', MetadataRouter.getAll);
// get by id
router.post('/dataset/metadata/get-by-ids', MetadataRouter.getByIds);
router.post('/dataset/:dataset/widget/metadata/get-by-ids', MetadataRouter.getByIds);
router.post('/dataset/:dataset/layer/metadata/get-by-ids', MetadataRouter.getByIds);

module.exports = router;
