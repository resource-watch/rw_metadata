const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { createMetadataResource, COMMON_AUTH_ERROR_CASES } = require('./utils/test.constants');
const { validateMetadata, ensureCorrectError, initHelpers } = require('./utils/helpers');

chai.should();

const requester = getTestServer();
const DEFAULT = {
    layerID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/${DEFAULT.datasetID}/layer/${DEFAULT.layerID}/metadata`,
    'post',
    createMetadataResource('layer')
);

const createLayer = (data = createMetadataResource('layer')) => {
    const { widgetID, datasetID } = DEFAULT;

    return requester
        .post(`/api/v1/dataset/${datasetID}/layer/${widgetID}/metadata`)
        .send({ ...data, loggedUser: ROLES.ADMIN });
};

describe('Create layer metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Creating a layer metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Creating a layer metadata while being authenticated as USER should fail', helpers.isUserForbidden());

    it('Creating a layer metadata while being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Creating a layer metadata while being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Creating a layer metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(COMMON_AUTH_ERROR_CASES.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResource('layer');
            const layer = await createLayer({ ...defaultMetadata, ...data });
            layer.status.should.equal(400);
            ensureCorrectError(layer.body, expectedError);
        }));
    });

    it('Creating a layer metadata while being authenticated as MANAGER with the right application should succeed (happy case)', async () => {
        const defaultWidget = createMetadataResource('layer');

        const { widgetID, datasetID } = DEFAULT;

        const layer = await requester
            .post(`/api/v1/dataset/${datasetID}/layer/${widgetID}/metadata`)
            .send({ ...defaultWidget, loggedUser: ROLES.ADMIN });

        validateMetadata(layer.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    it('Creating a layer metadata while being authenticated as ADMIN with the right application should succeed (happy case)', async () => {
        const defaultWidget = createMetadataResource('layer');

        const { widgetID, datasetID } = DEFAULT;

        const layer = await requester
            .post(`/api/v1/dataset/${datasetID}/layer/${widgetID}/metadata`)
            .send({ ...defaultWidget, loggedUser: ROLES.ADMIN });

        validateMetadata(layer.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
