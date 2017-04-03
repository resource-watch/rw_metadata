
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RESOURCES = require('app.constants').RESOURCES;
const STATUS = require('app.constants').STATUS;

const Metadata = new Schema({
    dataset: { type: String, required: true, trim: true },
    application: { type: String, required: true, trim: true },
    resource: {
        id: { type: String, required: true, trim: true },
        type: { type: String, required: true, trim: true, enum: RESOURCES }
    },
    userId: { type: String, required: true, trim: true },
    language: { type: String, required: true, trim: true },
    name: { type: String, required: false, trim: true },
    description: { type: String, required: false, trim: true },
    source: { type: String, required: false, trim: true },
    citation: { type: String, required: false, trim: true },
    license: { type: String, required: false, trim: true },
    units: { type: Schema.Types.Mixed },
    info: { type: Schema.Types.Mixed },
    fields: { type: Schema.Types.Mixed },
    applicationProperties: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: STATUS, default: 'published' }
});

module.exports = mongoose.model('Metadata', Metadata);
