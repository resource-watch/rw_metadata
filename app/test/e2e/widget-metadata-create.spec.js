const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { createMetadataResource, COMMON_AUTH_ERROR_CASES } = require('./utils/test.constants');
const {
    validateMetadata, ensureCorrectError, initHelpers, mockGetUserFromToken
} = require('./utils/helpers');

chai.should();

const requester = getTestServer();
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/${DEFAULT.datasetID}/widget/${DEFAULT.widgetID}/metadata`,
    'post',
    createMetadataResource('widget')
);

const createWidget = (data = createMetadataResource('widget')) => {
    mockGetUserFromToken(ROLES.ADMIN);
    const { widgetID, datasetID } = DEFAULT;

    return requester
        .post(`/api/v1/dataset/${datasetID}/widget/${widgetID}/metadata`)
        .set('Authorization', `Bearer abcd`)
        .send(data);
};

describe('Create widget metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Create widget metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Create widget metadata while being authenticated as USER should fail', helpers.isUserForbidden());

    it('Create widget metadata while being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Create widget metadata while being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Create widget metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(COMMON_AUTH_ERROR_CASES.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResource('widget');
            const widget = await createWidget({ ...defaultMetadata, ...data });
            widget.status.should.equal(400);
            ensureCorrectError(widget.body, expectedError);
        }));
    });

    it('Create widget metadata while being authenticated as MANAGER with the right app should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.MANAGER);
        const defaultWidget = createMetadataResource('widget');

        const { widgetID, datasetID } = DEFAULT;

        const widget = await requester
            .post(`/api/v1/dataset/${datasetID}/widget/${widgetID}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultWidget);

        validateMetadata(widget.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    it('Create widget metadata while being authenticated as ADMIN with the right app should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        const defaultWidget = createMetadataResource('widget');

        const { widgetID, datasetID } = DEFAULT;

        const widget = await requester
            .post(`/api/v1/dataset/${datasetID}/widget/${widgetID}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultWidget);

        validateMetadata(widget.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
