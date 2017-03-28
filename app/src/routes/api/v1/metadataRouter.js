
const Router = require('koa-router');
const logger = require('logger');
const MetadataService = require('services/metadataService');
const MetadataSerializer = require('serializers/metadataSerializer');
const MetadataValidator = require('validators/metadataValidator');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');
const MetadataNotValid = require('errors/metadataNotValid');
const CloneNotValid = require('errors/cloneNotValid');
const USER_ROLES = require('appConstants').USER_ROLES;

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

    static * get() {
        const resource = MetadataRouter.getResource(this.params);
        logger.info(`Getting metadata of ${resource.type}: ${resource.id}`);
        const filter = {};
        if (this.query.application) { filter.application = this.query.application; }
        if (this.query.language) { filter.language = this.query.language; }
        if (this.query.limit) { filter.limit = this.query.limit; }
        const result = yield MetadataService.get(this.params.dataset, resource, filter);
        this.body = MetadataSerializer.serialize(result);
    }

    static * create() {
        const resource = MetadataRouter.getResource(this.params);
        logger.info(`Creating metadata of ${resource.type}: ${resource.id}`);
        try {
            const user = this.request.body.loggedUser;
            const result = yield MetadataService.create(user, this.params.dataset, resource, this.request.body);
            this.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataDuplicated) {
                this.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static * update() {
        const resource = MetadataRouter.getResource(this.params);
        logger.info(`Updating metadata of ${resource.type}: ${resource.id}`);
        try {
            const result = yield MetadataService.update(this.params.dataset, resource, this.request.body);
            this.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataNotFound) {
                this.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static * delete() {
        const resource = MetadataRouter.getResource(this.params);
        logger.info(`Deleting metadata of ${resource.type}: ${resource.id}`);
        const filter = {};
        if (this.query.application) { filter.application = this.query.application; }
        if (this.query.language) { filter.language = this.query.language; }
        try {
            const result = yield MetadataService.delete(this.params.dataset, resource, filter);
            this.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataNotFound) {
                this.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static * getAll() {
        logger.info('Getting all metadata');
        const filter = {};
        const extendedFilter = {};
        if (this.query.application) { filter.application = this.query.application; }
        if (this.query.language) { filter.language = this.query.language; }
        if (this.query.limit) { filter.limit = this.query.limit; }
        if (this.query.type) { extendedFilter.type = this.query.type; }
        const result = yield MetadataService.getAll(filter, extendedFilter);
        this.body = MetadataSerializer.serialize(result);
    }

    static * getByIds() {
        if (!this.request.body.ids) {
            this.throw(400, 'Bad request');
            return;
        }
        logger.info(`Getting metadata by ids: ${this.request.body.ids}`);
        const resource = {
            ids: this.request.body.ids
        };
        if (typeof resource.ids === 'string') {
            resource.ids = resource.ids.split(',').map((elem) => elem.trim());
        }
        resource.type = MetadataRouter.getResourceTypeByPath(this.path);
        const filter = {};
        if (this.query.application) { filter.application = this.query.application; }
        if (this.query.language) { filter.language = this.query.language; }
        const result = yield MetadataService.getByIds(resource, filter);
        this.body = MetadataSerializer.serialize(result);
    }

    static * clone() {
        const resource = MetadataRouter.getResource(this.params);
        const newDataset = this.request.body.newDataset;
        logger.info(`Cloning metadata of ${resource.type}: ${resource.id} in ${newDataset}`);
        try {
            const user = this.request.body.loggedUser;
            const result = yield MetadataService.clone(user, this.params.dataset, resource, this.request.body);
            this.body = MetadataSerializer.serialize(result);
        } catch (err) {
            if (err instanceof MetadataDuplicated) {
                this.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

}

// Negative checking
function * authorizationMiddleware(next) {
    // Check delete
    if (this.request.method === 'DELETE' && (!this.request.query.language || !this.request.query.application)) {
        this.throw(400, 'Bad request');
        return;
    }
    // Get user from query (delete) or body (post-patch)
    const user = Object.assign({}, this.request.query.loggedUser ? JSON.parse(this.request.query.loggedUser) : {}, this.request.body.loggedUser);
    if (user.id === 'microservice') {
        yield next;
        return;
    }
    if (!user || USER_ROLES.indexOf(user.role) === -1) {
        this.throw(401, 'Unauthorized'); // if not logged or invalid ROLE-> out
        return;
    }
    if (user.role === 'USER') {
        this.throw(403, 'Forbidden'); // if USER -> out
        return;
    }
    // Get application from query (delete) or body (post-patch)
    const application = this.request.query.application ? this.request.query.application : this.request.body.application;
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        if (user.extraUserData.apps.indexOf(application) === -1) {
            this.throw(403, 'Forbidden'); // if manager or admin but no application -> out
            return;
        }
        if (user.role === 'MANAGER' && this.request.method !== 'POST') { // extra check if a MANAGER wants to update or delete
            const resource = MetadataRouter.getResource(this.params);
            const permission = yield MetadataService.hasPermission(user, this.params.dataset, resource, this.request.body);
            if (!permission) {
                this.throw(403, 'Forbidden');
                return;
            }
        }
    }
    yield next; // SUPERADMIN is included here
}

// Validator Wrapper
function * validationMiddleware(next) {
    try {
        MetadataValidator.validate(this);
    } catch (err) {
        if (err instanceof MetadataNotValid) {
            this.throw(400, err.getMessages());
            return;
        }
        throw err;
    }
    yield next;
}

// Validator Wrapper
function * cloneValidationMiddleware(next) {
    try {
        MetadataValidator.validateClone(this);
    } catch (err) {
        if (err instanceof CloneNotValid) {
            this.throw(400, err.getMessages());
            return;
        }
        throw err;
    }
    yield next;
}

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
