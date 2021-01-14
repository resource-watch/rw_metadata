const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { createMetadataResourceForUpdate, COMMON_AUTH_ERROR_CASES } = require('./utils/test.constants');
const {
    validateMetadata, ensureCorrectError, initHelpers, createMetadata, mockGetUserFromToken
} = require('./utils/helpers');

chai.should();

const requester = getTestServer();
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/${DEFAULT.datasetID}/metadata`,
    'patch',
    createMetadataResourceForUpdate('dataset')
);

const updateDataset = (data = createMetadataResourceForUpdate('dataset'), datasetID = DEFAULT.datasetID) => {
    mockGetUserFromToken(ROLES.ADMIN);

    return requester
        .patch(`/api/v1/dataset/${datasetID}/metadata`)
        .set('Authorization', `Bearer abcd`)
        .send(data);
};

describe('Update dataset metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Update dataset metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Update dataset metadata while being authenticated as USER should fail', helpers.isUserForbidden());

    it('Update dataset metadata while being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Update dataset metadata while being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Update dataset metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(COMMON_AUTH_ERROR_CASES.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResourceForUpdate('dataset');
            const dataset = await updateDataset({ ...defaultMetadata, ...data });
            dataset.status.should.equal(400);
            ensureCorrectError(dataset.body, expectedError);
        }));
    });

    it('Update dataset metadata while being authenticated as MANAGER with right application should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.MANAGER);
        const metadata = await new Metadata(createMetadata('dataset')).save();
        const defaultDataset = createMetadataResourceForUpdate('dataset', metadata.resource.id);

        const dataset = await requester
            .patch(`/api/v1/dataset/${metadata.dataset}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultDataset);

        validateMetadata(dataset.body.data[0], { ...defaultDataset, dataset: metadata.dataset });
    });

    it('Update dataset metadata while being authenticated as ADMIN with right application should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        const metadata = await new Metadata(createMetadata('dataset')).save();
        const defaultDataset = createMetadataResourceForUpdate('dataset', metadata.resource.id);

        const dataset = await requester
            .patch(`/api/v1/dataset/${metadata.dataset}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultDataset);

        validateMetadata(dataset.body.data[0], { ...defaultDataset, dataset: metadata.dataset });
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
