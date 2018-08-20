
const logger = require('logger');
const MetadataNotValid = require('errors/metadataNotValid.error');
const CloneNotValid = require('errors/cloneNotValid.error');
const { METADATA_FIELDS } = require('app.constants');

class MetadataValidator {

    static isArray(property) {
        if (property instanceof Array) {
            return true;
        }
        return false;
    }

    static isString(property) {
        if (typeof property === 'string' && property.length >= 0) {
            return true;
        }
        return false;
    }

    static notEmptyString(property) {
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
        const { application } = koaObj.request.body;
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
        koaObj.checkBody('application').notEmpty().check(application => MetadataValidator.notEmptyString(application));
        koaObj.checkBody('name').optional().check(name => MetadataValidator.isString(name), 'should be a valid string');
        koaObj.checkBody('description').optional().check(description => MetadataValidator.isString(description), 'should be a valid string');
        koaObj.checkBody('source').optional().check(source => MetadataValidator.isString(source), 'should be a valid string');
        koaObj.checkBody('citation').optional().check(citation => MetadataValidator.isString(citation), 'should be a valid string');
        koaObj.checkBody('license').optional().check(license => MetadataValidator.isString(license), 'should be a valid string');
        koaObj.checkBody('units').optional().check((units) => {
            if (MetadataValidator.isObject(units)) {
                return true;
            }
            return false;
        }, 'should be a valid object');
        koaObj.checkBody('info').optional().check((info) => {
            if (MetadataValidator.isObject(info)) {
                return true;
            }
            return false;
        }, 'should be a valid object');
        koaObj.checkBody('columns').optional().check((columns) => {
            if (MetadataValidator.isObject(columns)) {
                return true;
            }
            return false;
        }, 'should be a valid object');
        if (koaObj.application) {
            koaObj.checkBody('applicationProperties').optional()
                .check(applicationProperties => MetadataValidator.checkApplicationProperties(applicationProperties, koaObj), `Required fields - ${Object.keys(METADATA_FIELDS[koaObj.request.body.application])}`);
        }
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
