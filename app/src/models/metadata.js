'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const RESOURCES = require('appConstants').RESOURCES;
const STATUS = require('appConstants').STATUS;

var Metadata = new Schema({
    dataset: {type: String, required: true, trim: true},
    application: {type: String, required: true, trim: true},
    resource: {
        id: {type: String, required: true, trim: true},
        type: {type: String, required: true, trim: true, enum: RESOURCES}
    },
    userId: {type: String, required: true, trim: true},
    language: {type: String, required: true, trim: true},
    name: {type: String, required: false, trim: true},
    description: {type: String, required: false, trim: true},
    source: {type: String, required: false, trim: true},
    citation: {type: String, required: false, trim: true},
    license: {type: String, required: false, trim: true},
    info: {type: Schema.Types.Mixed},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    status: {type: String, enum: STATUS, default: 'published'}
});

module.exports = mongoose.model('Metadata', Metadata);
