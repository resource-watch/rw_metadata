'use strict';

const logger = require('logger');
const config = require('config');
const MetadataNotValid = require('errors/metadataNotValid');
const CloneNotValid = require('errors/cloneNotValid');

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
        koaObj.checkBody('units').optional().check(function(){
            if(this.units instanceof Object && this.units.length === undefined){
                return true;
            }
            return false;
        }.bind(koaObj.request.body));
        koaObj.checkBody('info').optional().check(function(){
            if(this.info instanceof Object && this.info.length === undefined){
                return true;
            }
            return false;
        }.bind(koaObj.request.body));
        if(koaObj.errors){
            logger.error('Error validating metadata creation');
            throw new MetadataNotValid(koaObj.errors);
        }
        return true;
    }

    static * validateClone(koaObj){
        logger.info('Validating Metadata Cloning');
        koaObj.checkBody('newDataset').notEmpty().toLow();
        if(koaObj.errors){
            logger.error('Error validating metadata cloning');
            throw new CloneNotValid(koaObj.errors);
        }
        return true;
    }

}

module.exports = MetadataValidator;
