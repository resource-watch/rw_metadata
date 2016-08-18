'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const APPLICATIONS = require('appConstants').APPLICATIONS;

var Metadata = new Schema({
    dataset: {type: String, required: true, trim: true},
    application: {type: String, required: true, trim: true, enum: APPLICATIONS },
    info: {type: Schema.Types.Mixed, default: {}}
});


module.exports = mongoose.model('Metadata', Metadata);
