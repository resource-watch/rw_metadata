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
    `/api/v1/dataset/${DEFAULT.datasetID}/widget/${DEFAULT.widgetID}/metadata`,
    'patch',
    createMetadataResourceForUpdate('widget')
);

const updateWidget = (data = createMetadataResourceForUpdate('widget'), datasetID = DEFAULT.datasetID) => {
    mockGetUserFromToken(ROLES.ADMIN);
    return requester
        .patch(`/api/v1/dataset/${datasetID}/widget/${data.resource.id}/metadata`)
        .set('Authorization', `Bearer abcd`)
        .send(data);
};

describe('Update widget metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Updating widget metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Updating widget metadata while being authenticated as USER should fail', helpers.isUserForbidden());

    it('Updating widget metadata while being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Updating widget metadata while being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Updating widget metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(COMMON_AUTH_ERROR_CASES.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResourceForUpdate('widget');
            const widget = await updateWidget({ ...defaultMetadata, ...data });
            widget.status.should.equal(400);
            ensureCorrectError(widget.body, expectedError);
        }));
    });

    it('Updating widget metadata while being authenticated as MANAGER should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.MANAGER);
        const metadata = await new Metadata(createMetadata('widget')).save();
        const defaultWidget = createMetadataResourceForUpdate('widget', metadata.resource.id);

        const widget = await requester
            .patch(`/api/v1/dataset/${metadata.dataset}/widget/${defaultWidget.resource.id}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultWidget);

        validateMetadata(widget.body.data[0], { ...defaultWidget, dataset: metadata.dataset });
    });

    it('Updating widget metadata while being authenticated as ADMIN should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        const metadata = await new Metadata(createMetadata('widget')).save();
        const defaultWidget = createMetadataResourceForUpdate('widget', metadata.resource.id);

        const widget = await requester
            .patch(`/api/v1/dataset/${metadata.dataset}/widget/${defaultWidget.resource.id}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .send(defaultWidget);

        validateMetadata(widget.body.data[0], { ...defaultWidget, dataset: metadata.dataset });
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
