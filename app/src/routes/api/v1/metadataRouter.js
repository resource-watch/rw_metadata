'use strict';

var Router = require('koa-router');
var logger = require('logger');
var config = require('config');
var MetadataService = require('services/metadataService');
var MetadataSerializer = require('serializers/metadataSerializer');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');

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
        if(this.query.app){filter.app = this.query.app;}
        if(this.query.lang){filter.lang = this.query.lang;}
        if(this.query.limit){filter.limit = this.query.limit;}
        let result = yield MetadataService.get(this.params.dataset, resource, filter);
        this.body = MetadataSerializer.serialize(result);
    }

    static * create(){
        if(!this.request.body || !this.request.body.app || !this.request.body.lang){
            this.throw(400, 'Bad request');
            return;
        }
        let resource = MetadataRouter.getResource(this.params);
        logger.info(`Creating metadata of ${resource.type}: ${resource.id}`);
        try{
            let result = yield MetadataService.create(this.params.dataset, resource, this.request.body);
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
        if(!this.request.body || !this.request.body.app || !this.request.body.lang){
            this.throw(400, 'Bad request');
            return;
        }
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
        if(this.query.app){filter.app = this.query.app;}
        if(this.query.lang){filter.lang = this.query.lang;}
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
        if(this.query.app){filter.app = this.query.app;}
        if(this.query.lang){filter.lang = this.query.lang;}
        if(this.query.limit){filter.limit = this.query.limit;}
        if(this.query.type){extendedFilter.type = this.query.type;}
        let result = yield MetadataService.getAll(filter, extendedFilter);
        this.body = MetadataSerializer.serialize(result);
    }

    static * getByIds(){
        if(!this.query.ids){
            this.throw(400, 'Bad request');
            return;
        }
        logger.info(`Getting metadata by ids: ${this.query.ids}`);
        let resource = {
            ids: this.query.ids.split(',')
        };
        resource.type = MetadataRouter.getResourceTypeByPath(this.path);
        let filter = {};
        if(this.query.app){filter.app = this.query.app;}
        if(this.query.lang){filter.lang = this.query.lang;}
        if(this.query.limit){filter.limit = this.query.limit;}
        let result = yield MetadataService.getByIds(resource, filter);
        this.body = MetadataSerializer.serialize(result);
    }

}

const authorizationMiddleware = function*(next) {
    // if(!this.request.body.loggedUser){
    //     this.throw(401, 'Unauthorized');
    //     return;
    // }
    yield next;
};

// dataset
router.get('/dataset/:dataset/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/metadata', authorizationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/metadata', authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/metadata', authorizationMiddleware, MetadataRouter.delete);
// widget
router.get('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/widget/:widget/metadata', authorizationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/widget/:widget/metadata', authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/widget/:widget/metadata', authorizationMiddleware, MetadataRouter.delete);
// layer
router.get('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/layer/:layer/metadata', authorizationMiddleware, MetadataRouter.create);
router.patch('/dataset/:dataset/layer/:layer/metadata', authorizationMiddleware, MetadataRouter.update);
router.delete('/dataset/:dataset/layer/:layer/metadata', authorizationMiddleware, MetadataRouter.delete);
// generic
router.get('/metadata', MetadataRouter.getAll);
// get by id
router.get('/dataset/metadata/get-by-ids', MetadataRouter.getByIds);
router.get('/dataset/:dataset/widget/metadata/get-by-ids', MetadataRouter.getByIds);
router.get('/dataset/:dataset/layer/metadata/get-by-ids', MetadataRouter.getByIds);

module.exports = router;
