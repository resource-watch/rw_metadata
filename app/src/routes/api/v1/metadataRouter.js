'use strict';

var Router = require('koa-router');
var logger = require('logger');
var config = require('config');
var MetadataService = require('services/metadataService');
var MetadataSerializer = require('serializers/metadataSerializer');
var MetadataValidator = require('validators/MetadataValidator');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');
const MetadataNotValid = require('errors/metadataNotValid');
const USER_ROLES = require('appConstants').USER_ROLES;

var router = new Router();

class MetadataRouter {

    static getResource(params){
        let resource = {id: params.dataset, type: 'dataset'};
        if(params.layer){
            resource = {id: params.layer, type: 'layer'};
        }
        else if(params.widget){
            resource = {id: params.widget, type: 'widget'};
        }
        else{}
        return resource;
    }

    static getResourceTypeByPath(path){
        let type = 'dataset';
        if(path.indexOf('layer') > -1){
            type = 'layer';
        }
        else if(path.indexOf('widget') > -1){
            type = 'widget';
        }
        else{}
        return type;
    }

    static * get(){
        let resource = MetadataRouter.getResource(this.params);
        logger.info(`Getting metadata of ${resource.type}: ${resource.id}`);
        let filter = {};
        if(this.query.application){filter.application = this.query.application;}
        if(this.query.language){filter.language = this.query.language;}
        if(this.query.limit){filter.limit = this.query.limit;}
        let result = yield MetadataService.get(this.params.dataset, resource, filter);
        this.body = MetadataSerializer.serialize(result);
    }

    static * create(){
        let resource = MetadataRouter.getResource(this.params);
        logger.info(`Creating metadata of ${resource.type}: ${resource.id}`);
        try{
            let user = this.request.body.loggedUser;
            let result = yield MetadataService.create(user, this.params.dataset, resource, this.request.body);
            this.body = MetadataSerializer.serialize(result);
        } catch(err) {
            if(err instanceof MetadataDuplicated){
                this.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static * update(){
        let resource = MetadataRouter.getResource(this.params);
        logger.info(`Updating metadata of ${resource.type}: ${resource.id}`);
        try{
            let result = yield MetadataService.update(this.params.dataset, resource, this.request.body);
            this.body = MetadataSerializer.serialize(result);
        } catch(err) {
            if(err instanceof MetadataNotFound){
                this.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static * delete(){
        let resource = MetadataRouter.getResource(this.params);
        logger.info(`Deleting metadata of ${resource.type}: ${resource.id}`);
        let filter = {};
        if(this.query.application){filter.application = this.query.application;}
        if(this.query.language){filter.language = this.query.language;}
        try{
            let result = yield MetadataService.delete(this.params.dataset, resource, filter);
            this.body = MetadataSerializer.serialize(result);
        } catch(err) {
            if(err instanceof MetadataNotFound){
                this.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static * getAll(){
        logger.info('Getting all metadata');
        let filter = {};
        let extendedFilter = {};
        if(this.query.application){filter.application = this.query.application;}
        if(this.query.language){filter.language = this.query.language;}
        if(this.query.limit){filter.limit = this.query.limit;}
        if(this.query.type){extendedFilter.type = this.query.type;}
        let result = yield MetadataService.getAll(filter, extendedFilter);
        this.body = MetadataSerializer.serialize(result);
    }

    static * getByIds(){
        if(!this.request.body.ids){
            this.throw(400, 'Bad request');
            return;
        }
        logger.info(`Getting metadata by ids: ${this.request.body.ids}`);
        let resource = {
            ids: this.request.body.ids
        };
        if(typeof resource.ids === 'string'){
            resource.ids = resource.ids.split(',').map(function(elem){return elem.trim();});
        }
        resource.type = MetadataRouter.getResourceTypeByPath(this.path);
        let filter = {};
        if(this.query.application){filter.application = this.query.application;}
        if(this.query.language){filter.language = this.query.language;}
        if(this.query.limit){filter.limit = this.query.limit;}
        let result = yield MetadataService.getByIds(resource, filter);
        this.body = MetadataSerializer.serialize(result);
    }

}

// Negative checking
const authorizationMiddleware = function*(next) {
    if(!this.request.body.loggedUser || USER_ROLES.indexOf(this.request.body.loggedUser.role) === -1){
        this.throw(401, 'Unauthorized'); //if not logged or invalid ROLE-> out
        return;
    }
    let user = this.request.body.loggedUser;
    if(user.role === 'USER'){
        this.throw(403, 'Forbidden'); // if USER -> out
        return;
    }
    if(user.role === 'MANAGER' || user.role === 'ADMIN'){
        if(user.extraUserData.apps.indexOf(this.request.body.application) === -1){
            this.throw(403, 'Forbidden'); // if manager or admin but no application -> out
            return;
        }
        if(user.role === 'MANAGER' && this.request.method !== 'POST'){ // extra check if a MANAGER wants to update or delete
            let resource = MetadataRouter.getResource(this.params);
            let permission = yield MetadataService.hasPermission(user, this.params.dataset, resource, this.request.body);
            if(!permission){
                this.throw(403, 'Forbidden');
                return;
            }
        }
    }
    yield next; // SUPERADMIN is included here
};

// Validator Wrapper
const validationMiddleware = function*(next){
    if(!this.request.body || !this.request.body.application || !this.request.body.language){
        this.throw(400, 'Bad request');
        return;
    }
    if(this.request.method === 'POST'){
        try{
            yield MetadataValidator.validateCreation(this);
        } catch(err) {
            if(err instanceof MetadataNotValid){
                this.throw(400, err.getMessages());
                return;
            }
            throw err;
        }
    }
    else if (this.request.method === 'PATCH') {
        MetadataValidator.validateUpdate(this);
    }
    else{
        //foo
    }
    yield next;
};

// dataset
router.get('/dataset/:dataset/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/metadata', authorizationMiddleware, validationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/metadata', authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/metadata', authorizationMiddleware, MetadataRouter.delete);
// widget
router.get('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/widget/:widget/metadata', authorizationMiddleware, validationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/widget/:widget/metadata', authorizationMiddleware,  MetadataRouter.update);
router.delete('/dataset/:dataset/widget/:widget/metadata', authorizationMiddleware, MetadataRouter.delete);
// layer
router.get('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/layer/:layer/metadata', authorizationMiddleware, validationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/layer/:layer/metadata', authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/layer/:layer/metadata', authorizationMiddleware, MetadataRouter.delete);
// generic
router.get('/metadata', MetadataRouter.getAll);
// get by id
router.post('/dataset/metadata/get-by-ids', MetadataRouter.getByIds);
router.post('/dataset/:dataset/widget/metadata/get-by-ids', MetadataRouter.getByIds);
router.post('/dataset/:dataset/layer/metadata/get-by-ids', MetadataRouter.getByIds);

module.exports = router;
