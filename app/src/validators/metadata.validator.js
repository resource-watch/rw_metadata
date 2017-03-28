
const logger = require('logger');
const MetadataNotValid = require('errors/metadataNotValid.error');
const CloneNotValid = require('errors/cloneNotValid.error');
const METADATA_FIELDS = require('app.constants').METADATA_FIELDS;

class MetadataValidator {

    static isArray(property) {
        if (property instanceof Array) {
            return true;
        }
        return false;
    }

    static isString(property) {
        if (typeof property === 'string' && property.length > 0) {
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

    static isValidProperty(field, type) {
        let isValid = false;
        switch (type) {

        case 'string':
            if (MetadataValidator.isString(field)) {
                isValid = true;
            } else {
                isValid = false;
            }
            break;
        default:

        }
        return isValid;
    }

    static checkApplicationProperties(applicationProperties, koaObj) {
        const application = koaObj.request.body.application;
        if (Object.keys(METADATA_FIELDS).indexOf(application) >= 0) {
            const requiredFields = Object.keys(METADATA_FIELDS[application]);
            const properties = applicationProperties;
            if (properties) {
                return requiredFields.every((field) => {
                    if (!properties[field] || !MetadataValidator.isValidProperty(properties[field], METADATA_FIELDS[application][field].type)) {
                        return false;
                    }
                    return true;
                });
            }
            return false;
        }
        return true;
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
        koaObj.checkBody('applicationProperties').optional()
        .check(applicationProperties => MetadataValidator.checkApplicationProperties(applicationProperties, koaObj), `Required fields - ${Object.keys(METADATA_FIELDS[koaObj.request.body.application])}`);
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
