'use strict';

var Router = require('koa-router');
var logger = require('logger');
var config = require('config');
var MetadataService = require('services/metadataService');
var MetadataSerializer = require('serializers/metadataSerializer');
const MetadataNotFound = require('errors/metadataNotFound');
const MetadataDuplicated = require('errors/metadataDuplicated');
const APPLICATIONS = require('appConstants').APPLICATIONS;

var router = new Router({
    prefix: '/metadata'
});


class MetadataRouter {
    static * query(){
        logger.info(`Obtaining metadata with params dataset ${this.params.dataset} and application ${this.params.application}`);
        let result = yield MetadataService.query(this.params.dataset, this.params.application);
        this.body = MetadataSerializer.serialize(result);
    }

    static * findByIds(){
        logger.info(`Find metadata by ids with body ${this.request.body}`);
        this.assert(this.request.body, 400, 'Filters required');
        this.assert(this.request.body.ids, 400, 'Ids array field required');
        let result = yield MetadataService.findByIds(this.request.body);
        this.body = MetadataSerializer.serialize(result);
    }

    static * create(){
        logger.info(`Creating metadata with params dataset ${this.params.dataset} and application ${this.params.application} and body ${this.request.body}`);
        this.assert(this.request.body, 400, 'Body required');
        try{
            if(this.request.body.loggedUser){
                delete this.request.body.loggedUser;
            }
            let metadata = yield MetadataService.create(this.params.dataset, this.params.application, this.request.body);
            this.body = MetadataSerializer.serialize(metadata);
        } catch(err) {
            if(err instanceof MetadataDuplicated){
                this.throw(400, err.message);
                return;
            }
            throw err;
        }
    }

    static * delete(){
        logger.info(`Deleting metadata with params dataset ${this.params.dataset} and application ${this.params.application}`);
        try{
            let result = yield MetadataService.delete(this.params.dataset, this.params.application);
            this.body = MetadataSerializer.serialize(result);
        } catch(err) {
            if(err instanceof MetadataNotFound){
                this.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

    static * update(){
        logger.info(`Updating metadata with params dataset ${this.params.dataset} and application ${this.params.application} and body ${this.request.body}`);
        this.assert(this.request.body, 400, 'Body required');
        try{
            let result = yield MetadataService.update(this.params.dataset, this.params.application, this.request.body);
            this.body = MetadataSerializer.serialize(result);
        } catch(err) {
            if(err instanceof MetadataNotFound){
                this.throw(404, err.message);
                return;
            }
            throw err;
        }
    }

}

var validateApplication = function *(next){
    logger.debug('Apps', APPLICATIONS);
    if(this.params.application && APPLICATIONS.indexOf(this.params.application) > -1){
        yield next;
    } else {
        this.throw(400, `Application not found. Available applications ${APPLICATIONS.join(',')}`);
    }
};


router.get('/:dataset', MetadataRouter.query);
router.get('/:dataset/:application', MetadataRouter.query);
router.post('/:dataset/:application', validateApplication,  MetadataRouter.create);
router.delete('/:dataset/:application', validateApplication, MetadataRouter.delete);
router.delete('/:dataset', MetadataRouter.delete);
router.patch('/:dataset/:application', validateApplication, MetadataRouter.update);
router.post('/find-by-ids', MetadataRouter.findByIds);

module.exports = router;
