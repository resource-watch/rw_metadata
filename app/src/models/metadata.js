'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const APPLICATIONS = require('appConstants').APPLICATIONS;
const RESOURCES = require('appConstants').RESOURCES;

var Resource = new Schema({
    id: {type: String, required: true, trim: true},
    type: {type: String, required: true, trim: true, enum: RESOURCES},
});

var Metadata = new Schema({
    dataset: {type: String, required: true, trim: true},
    app: {type: String, required: true, trim: true, enum: APPLICATIONS},
    resource: {type: Resource, required: true},
    language: {type: String, required: true, trim: true},
    name: {type: String, required: false, trim: true},
    description: {type: String, required: false, trim: true},
    source: {type: String, required: false, trim: true},
    citation: {type: String, required: false, trim: true},
    license: {type: String, required: false, trim: true},
    info: {type: Schema.Types.Mixed, default: {}}
});

module.exports = mongoose.model('Metadata', Metadata);
