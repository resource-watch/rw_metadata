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
    layerID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/${DEFAULT.datasetID}/layer/${DEFAULT.layerID}/metadata`,
    'patch',
    createMetadataResourceForUpdate('layer')
);

const updateLayer = (data = createMetadataResourceForUpdate('layer'), datasetID = DEFAULT.datasetID) => {
    mockGetUserFromToken(ROLES.ADMIN);

    return requester
        .patch(`/api/v1/dataset/${datasetID}/layer/${data.resource.id}/metadata`)
        .set('Authorization', `Bearer abcd`)
        .send(data);
};

describe('Update layer metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Update layer metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Update layer metadata while being authenticated as USER should fail', helpers.isUserForbidden());

    it('Update layer metadata while being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Update layer metadata while being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Update layer metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(COMMON_AUTH_ERROR_CASES.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResourceForUpdate('layer');
            const layer = await updateLayer({ ...defaultMetadata, ...data });
            layer.status.should.equal(400);
            ensureCorrectError(layer.body, expectedError);
        }));
    });

    it('Update layer metadata while being authenticated as MANAGER with right application should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.MANAGER);
        const metadata = await new Metadata(createMetadata('layer')).save();
        const defaultLayer = createMetadataResourceForUpdate('layer', metadata.resource.id);

        const layer = await requester
            .patch(`/api/v1/dataset/${metadata.dataset}/layer/${defaultLayer.resource.id}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultLayer);

        validateMetadata(layer.body.data[0], { ...defaultLayer, dataset: metadata.dataset });
    });

    it('Update layer metadata while being authenticated as ADMIN with right application should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        const metadata = await new Metadata(createMetadata('layer')).save();
        const defaultLayer = createMetadataResourceForUpdate('layer', metadata.resource.id);

        const layer = await requester
            .patch(`/api/v1/dataset/${metadata.dataset}/layer/${defaultLayer.resource.id}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultLayer);

        validateMetadata(layer.body.data[0], { ...defaultLayer, dataset: metadata.dataset });
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
