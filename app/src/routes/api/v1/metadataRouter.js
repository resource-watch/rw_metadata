'use strict';

var Router = require('koa-router');
var logger = require('logger');
var config = require('config');
var MetadataService = require('services/metadataService');
var MetadataSerializer = require('serializers/metadataSerializer');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');
const APPLICATIONS = require('appConstants').APPLICATIONS;

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
            if(this.request.body.loggedUser){
                delete this.request.body.loggedUser;
            }
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
            if(this.request.body.loggedUser){
                delete this.request.body.loggedUser;
            }
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

    static * findByIds(){
        logger.info(`Find metadata by ids with body ${this.request.body}`);
        this.assert(this.request.body, 400, 'Filters required');
        this.assert(this.request.body.ids, 400, 'Ids array field required');
        let result = yield MetadataService.findByIds(this.request.body);
        this.body = MetadataSerializer.serialize(result);
    }

}

// var validateApplication = function *(next){
//     logger.debug('Apps', APPLICATIONS);
//     if(this.params.application && APPLICATIONS.indexOf(this.params.application) > -1){
//         yield next;
//     } else {
//         this.throw(400, `Application not found. Available applications ${APPLICATIONS.join(',')}`);
//     }
// };

router.get('/dataset/:dataset/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/metadata', MetadataRouter.create);
router.patch('/dataset/:dataset/metadata', MetadataRouter.update);
//router.put('/dataset/:dataset/metadata', MetadataRouter.update); // @TODO
router.delete('/dataset/:dataset/metadata', MetadataRouter.delete);

router.get('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.create);
router.patch('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.update);
//router.put('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.update);
router.delete('/dataset/:dataset/widget/:widget/metadata', MetadataRouter.delete);

router.get('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.get);
router.post('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.create);
router.patch('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.update);
//router.put('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.update);
router.delete('/dataset/:dataset/layer/:layer/metadata', MetadataRouter.delete);

// router.get('/:dataset/:application', MetadataRouter.query);
// router.post('/:dataset/:application', validateApplication,  MetadataRouter.create);
// router.delete('/:dataset/:application', validateApplication, MetadataRouter.delete);
// router.patch('/:dataset/:application', validateApplication, MetadataRouter.update);

router.post('/find-by-ids', MetadataRouter.findByIds);

module.exports = router;
