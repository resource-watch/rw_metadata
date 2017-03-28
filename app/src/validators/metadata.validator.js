
const logger = require('logger');
const MetadataNotValid = require('errors/metadataNotValid.error');
const CloneNotValid = require('errors/cloneNotValid.error');

class MetadataValidator {

    static isArray(property) {
        if (property instanceof Array) {
            return true;
        }
        return false;
    }

    static isObject(property) {
        if (property instanceof Object && property.length === undefined) {
            return true;
        }
        return false;
    }

    static validate(koaObj) {
        logger.info('Validating Metadata Creation');
        koaObj.checkBody('language').notEmpty().toLow();
        koaObj.checkBody('application').notEmpty().isAscii()
        .toLow();
        koaObj.checkBody('name').optional().isAscii();
        koaObj.checkBody('description').optional().isAscii();
        koaObj.checkBody('source').optional().isAscii();
        koaObj.checkBody('citation').optional().isAscii();
        koaObj.checkBody('license').optional().isAscii();
        koaObj.checkBody('units').optional().check((units) => {
            if (MetadataValidator.isObject(units)) {
                return true;
            }
            return false;
        });
        koaObj.checkBody('info').optional().check((info) => {
            if (MetadataValidator.isObject(info)) {
                return true;
            }
            return false;
        });
        koaObj.checkBody('fields').optional().check((fields) => {
            if (MetadataValidator.isObject(fields)) {
                return true;
            }
            return false;
        });
        if (koaObj.errors) {
            logger.error('Error validating metadata creation');
            throw new MetadataNotValid(koaObj.errors);
        }
        return true;
    }

    static validateClone(koaObj) {
        logger.info('Validating Metadata Cloning');
        koaObj.checkBody('newDataset').notEmpty().toLow();
        if (koaObj.errors) {
            logger.error('Error validating metadata cloning');
            throw new CloneNotValid(koaObj.errors);
        }
        return true;
    }

}

module.exports = MetadataValidator;
