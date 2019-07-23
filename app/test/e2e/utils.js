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

const ensureCorrectError = (body, errMessage) => {
    body.should.have.property('errors').and.be.an('array');
    body.errors[0].should.have.property('detail').and.equal(errMessage);
};

const getUUID = () => Math.random().toString(36).substring(7);

const initHelpers = (requester, url, initMethod, initialData = {}, queryParams = '?language=en') => {
    const isUserForbidden = (method = initMethod) => async () => {
        const response = await requester[method](`${url + queryParams}&loggedUser=${JSON.stringify(ROLES.USER)}`)
            .send(initialData);
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Forbidden');
    };

    const isRightAppRequired = (method = initMethod) => async () => {
        const response = await requester[method](`${url}?language=en&application=test123&loggedUser=${JSON.stringify(ROLES.USER)}`)
            .send(initialData);
        response.status.should.equal(403);
        ensureCorrectError(response.body, 'Forbidden');
    };

    const isTokenRequired = (method = initMethod) => async () => {
        const response = await requester[method](url + queryParams).send(initialData);
        response.status.should.equal(401);
        ensureCorrectError(response.body, 'Unauthorized');
    };

    return {
        isRightAppRequired,
        isUserForbidden,
        isTokenRequired,
    };
};

const createMetadata = (type) => {
    const uuid = getUUID();

    return {
        dataset: uuid,
        application: 'rw',
        resource: {
            id: uuid,
            type: type || 'dataset'
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
    createMetadata,
    initHelpers,
    getUUID,
    ensureCorrectError
};
