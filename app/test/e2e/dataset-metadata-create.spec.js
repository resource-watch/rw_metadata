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
    datasetID: 'test123'
};
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/${DEFAULT.datasetID}/metadata`,
    'post',
    createMetadataResource('dataset')
);

const createDataset = (data = createMetadataResource('dataset')) => {
    const { datasetID } = DEFAULT;

    return requester
        .post(`/api/v1/dataset/${datasetID}/metadata`)
        .send({ ...data, loggedUser: ROLES.ADMIN });
};

describe('Create metadata for dataset', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Creating dataset metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Creating dataset metadata being authenticated as USER should fail', helpers.isUserForbidden());

    it('Creating dataset metadata being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Creating dataset metadata being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Creating dataset metadata with wrong data should return error which specified in constant', async () => {
        await Promise.all(COMMON_AUTH_ERROR_CASES.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResource('dataset');
            const dataset = await createDataset({ ...defaultMetadata, ...data });
            dataset.status.should.equal(400);
            ensureCorrectError(dataset.body, expectedError);
        }));
    });

    it('Creating dataset metadata being authenticated as MANAGER with the right app should succeed (happy case)', async () => {
        const defaultWidget = createMetadataResource('dataset');

        const { datasetID } = DEFAULT;

        const dataset = await requester
            .post(`/api/v1/dataset/${datasetID}/metadata`)
            .send({ ...defaultWidget, loggedUser: ROLES.MANAGER });

        validateMetadata(dataset.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    it('Creating dataset metadata being authenticated as ADMIN with the right app should succeed (happy case)', async () => {
        const defaultWidget = createMetadataResource('dataset');

        const { datasetID } = DEFAULT;

        const dataset = await requester
            .post(`/api/v1/dataset/${datasetID}/metadata`)
            .send({ ...defaultWidget, loggedUser: ROLES.ADMIN });

        validateMetadata(dataset.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
