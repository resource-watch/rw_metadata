'use strict';

const logger = require('logger');
const config = require('config');
const MetadataNotValid = require('errors/metadataNotValid');

class MetadataValidator{

    static * validateCreation(koaObj){
        logger.info('Validating Metadata Creation');
        koaObj.checkBody('language').notEmpty().toLow();
        koaObj.checkBody('application').notEmpty().toLow();
        koaObj.checkBody('name').optional();
        koaObj.checkBody('description').optional();
        koaObj.checkBody('source').optional();
        koaObj.checkBody('citation').optional();
        koaObj.checkBody('license').optional();
        //koaObj.checkBody('info').isJSON();
        if(koaObj.errors){
            logger.error('Error validating metadata creation');
            throw new MetadataNotValid(koaObj.errors);
        }
        return true;
    }

    static * validateUpdate(req){
        logger.info('Validating Metadata Update');
        return yield;
    }

}

module.exports = MetadataValidator;
