
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { RESOURCES } = require('app.constants');
const { STATUS } = require('app.constants');

const Metadata = new Schema({
    dataset: { type: String, required: true, trim: true },
    application: { type: String, required: true, trim: true },
    resource: {
        id: { type: String, required: true, trim: true },
        type: {
            type: String, required: true, trim: true, enum: RESOURCES
        }
    },
    userId: { type: String, required: true, trim: true },
    language: { type: String, required: true, trim: true },
    name: { type: String, required: false, trim: true, index: true },
    description: { type: String, required: false, trim: true, index: true },
    source: { type: String, required: false, trim: true },
    citation: { type: String, required: false, trim: true },
    license: { type: String, required: false, trim: true },
    units: { type: Schema.Types.Mixed },
    info: { type: Schema.Types.Mixed },
    columns: { type: Schema.Types.Mixed },
    applicationProperties: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: STATUS, default: 'published' }
});

Metadata.index(
    {
        name: 'text',
        description: 'text',
    }, {
        name: 'TextIndex',
        default_language: 'english',
        language_override: 'none',
        weights:
            {
                name: 2,
                description: 1
            }
    }
);

module.exports = mongoose.model('Metadata', Metadata);
