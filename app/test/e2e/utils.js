const { ROLES } = require('./test.constants');

function deserializeDataset(response) {
    return response.body.data;
}

function validateMetadata(actual, expected) {
    actual.should.have.property('attributes').and.be.a('object');

    actual.attributes.should.have.property('dataset').and.equal(expected.dataset);
    actual.attributes.should.have.property('language').and.equal(expected.language);
    actual.attributes.should.have.property('name').and.equal(expected.name);
    actual.attributes.should.have.property('description').and.equal(expected.description);
    actual.attributes.should.have.property('info').and.be.a('object');
    actual.attributes.should.have.property('units').and.be.a('object');
    actual.attributes.should.have.property('columns').and.be.a('object');
    actual.attributes.should.have.property('status').and.equal(expected.status);
    actual.attributes.should.have.property('createdAt').and.be.a('string');
    actual.attributes.should.have.property('updatedAt').and.be.a('string');

    new Date(actual.attributes.createdAt).should.beforeTime(new Date());
    new Date(actual.attributes.updatedAt).should.beforeTime(new Date());
}

const getUUID = () => Math.random().toString(36).substring(7);

const createMetadata = () => {
    const uuid = getUUID();

    return {
        dataset: uuid,
        application: 'rw',
        resource: {
            id: uuid,
            type: 'dataset'
        },
        userId: ROLES.ADMIN.id,
        language: 'en',
        name: `Fake metadata ${uuid} name`,
        description: `Fake metadata ${uuid} description`,
        source: `Fake source ${uuid}`,
        citation: `Fake citation ${uuid}`,
        license: `Fake license ${uuid}`,
        info: {
            too: 'par'
        },
        units: {
            foo: 'bar'
        },
        columns: {
            noo: 'zar'
        },
        applicationProperties: {
            hoo: 'iar'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'published'
    };
};

module.exports = {
    deserializeDataset,
    validateMetadata,
    createMetadata
};
