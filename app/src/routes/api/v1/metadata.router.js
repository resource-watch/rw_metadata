
const Router = require('koa-router');
const logger = require('logger');
const MetadataService = require('services/metadata.service');
const MetadataSerializer = require('serializers/metadata.serializer');
const MetadataValidator = require('validators/metadata.validator');
const MetadataNotFound = require('errors/metadataNotFound.error');
const MetadataDuplicated = require('errors/metadataDuplicated.error');
const MetadataNotValid = require('errors/metadataNotValid.error');
const InvalidSortParameter = require('errors/invalidSortParameter.error');
const CloneNotValid = require('errors/cloneNotValid.error');
const { USER_ROLES } = require('app.constants');

const router = new Router();

class MetadataRouter {

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
        const filter = {};
        if (ctx.query.application) { filter.application = ctx.query.application; }
        if (ctx.query.language) { filter.language = ctx.query.language; }
        if (ctx.query.limit) { filter.limit = ctx.query.limit; }
        const result = await MetadataService.get(ctx.params.dataset, resource, filter);
        ctx.set('cache', `${resource.id}-metadata-all`);
        ctx.body = MetadataSerializer.serialize(result);
    }

    static async create(ctx) {
        const resource = MetadataRouter.getResource(ctx.params);
        logger.info(`Creating metadata of ${resource.type}: ${resource.id}`);
        try {
            const user = ctx.request.body.loggedUser;
            const result = await MetadataService.create(user, ctx.params.dataset, resource, ctx.request.body);
            ctx.set('uncache', `metadata ${resource.id}-metadata ${resource.id}-metadata-all`);
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
            const result = await MetadataService.update(ctx.params.dataset, resource, ctx.request.body);
            ctx.set('uncache', `metadata ${resource.id}-metadata ${resource.id}-metadata-all ${result.id}`);
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
        if (ctx.query.application) { filter.application = ctx.query.application; }
        if (ctx.query.language) { filter.language = ctx.query.language; }
        try {
            const result = await MetadataService.delete(ctx.params.dataset, resource, filter);
            ctx.set('uncache', `metadata ${resource.id}-metadata ${resource.id}-metadata-all ${result.id}`);
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
        const filter = {};
        const extendedFilter = {};
        filter.search = ctx.query.search ? ctx.query.search.split(' ').map(elem => elem.trim()) : [];
        if (ctx.query.application) { filter.application = ctx.query.application; }
        if (ctx.query.language) { filter.language = ctx.query.language; }
        if (ctx.query.limit) { filter.limit = ctx.query.limit; }
        if (ctx.query.type) { extendedFilter.type = ctx.query.type; }
        if (ctx.query.sort) { filter.sort = ctx.query.sort; }
        try {
            const result = await MetadataService.getAll(filter, extendedFilter);
            ctx.set('cache', `metadata`);
            ctx.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof InvalidSortParameter) {
                ctx.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static async findByIds(ctx) {
        if (!ctx.request.body.ids) {
            ctx.throw(400, 'Bad request - Missing \'ids\' from request body');
            return;
        }
        logger.info(`Getting metadata by ids: ${ctx.request.body.ids}`);
        const resource = {
            ids: ctx.request.body.ids
        };
        if (typeof resource.ids === 'string') {
            resource.ids = resource.ids.split(',').map(elem => elem.trim());
        }
        resource.type = MetadataRouter.getResourceTypeByPath(ctx.path);
        const filter = {};
        if (ctx.query.application) { filter.application = ctx.query.application; }
        if (ctx.query.language) { filter.language = ctx.query.language; }
        const result = await MetadataService.getByIds(resource, filter);
        ctx.body = MetadataSerializer.serialize(result);
    }

    static async clone(ctx) {
        const resource = MetadataRouter.getResource(ctx.params);
        const { newDataset } = ctx.request.body;
        logger.info(`Cloning metadata of ${resource.type}: ${resource.id} in ${newDataset}`);
        try {
            const user = ctx.request.body.loggedUser;
            const result = await MetadataService.clone(user, ctx.params.dataset, resource, ctx.request.body);
            ctx.set('uncache', `metadata`);
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
    if (ctx.request.method === 'DELETE' && (!ctx.request.query.language || !ctx.request.query.application)) {
        ctx.throw(400, 'Bad request');
        return;
    }
    // Get user from query (delete) or body (post-patch)
    const user = Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
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
    const application = ctx.request.query.application ? ctx.request.query.application : ctx.request.body.application;
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        if (user.extraUserData.apps.indexOf(application) === -1) {
            ctx.throw(403, 'Forbidden'); // if manager or admin but no application -> out
            return;
        }
        if (user.role === 'MANAGER' && ctx.request.method !== 'POST') { // extra check if a MANAGER wants to update or delete
            const resource = MetadataRouter.getResource(ctx.params);
            const permission = await MetadataService.hasPermission(user, ctx.params.dataset, resource, ctx.request.body);
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
// find by id
router.post('/dataset/metadata/find-by-ids', MetadataRouter.findByIds);
router.post('/dataset/:dataset/widget/metadata/find-by-ids', MetadataRouter.findByIds);
router.post('/dataset/:dataset/layer/metadata/find-by-ids', MetadataRouter.findByIds);

module.exports = router;
