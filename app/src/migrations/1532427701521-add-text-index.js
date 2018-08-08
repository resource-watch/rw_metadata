/* eslint-disable import/prefer-default-export */
// const Metadata = require('models/metadata.model');

export async function up() {
    return Promise().resolve();
    // await Metadata.schema.createIndex(
    //     {
    //         name: 'text',
    //         description: 'text',
    //     }, {
    //         name: 'TextIndex',
    //         default_language: 'english',
    //         language_override: 'none',
    //         weights:
    //             {
    //                 name: 2,
    //                 description: 1
    //             }
    //     }
    // );
}
