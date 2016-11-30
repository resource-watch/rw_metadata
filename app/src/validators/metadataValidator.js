'use strict';

const logger = require('logger');
const config = require('config');
const MetadataNotValid = require('errors/metadataNotValid');

class MetadataValidator{

    static * validate(koaObj){
        logger.info('Validating Metadata Creation');
        koaObj.checkBody('language').notEmpty().toLow();
        koaObj.checkBody('application').notEmpty().toLow();
        koaObj.checkBody('name').optional().isAscii();
        koaObj.checkBody('description').optional().isAscii();
        koaObj.checkBody('source').optional().isAscii();
        koaObj.checkBody('citation').optional().isAscii();
        koaObj.checkBody('license').optional().isAscii();
        koaObj.checkBody('info').optional();
        if(koaObj.errors){
            logger.error('Error validating metadata creation');
            throw new MetadataNotValid(koaObj.errors);
        }
        return true;
    }

}

module.exports = MetadataValidator;
