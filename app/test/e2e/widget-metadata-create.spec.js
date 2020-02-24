const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { createMetadataResource, COMMON_AUTH_ERROR_CASES } = require('./utils/test.constants');
const { validateMetadata, ensureCorrectError, initHelpers } = require('./utils/helpers');

chai.should();

const requester = getTestServer();
const prefix = '/api/v1/dataset';
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `${prefix}/${DEFAULT.datasetID}/widget/${DEFAULT.widgetID}/metadata`,
    'post',
    createMetadataResource('widget')
);

const createWidget = (data = createMetadataResource('widget')) => {
    const { widgetID, datasetID } = DEFAULT;

    return requester
        .post(`${prefix}/${datasetID}/widget/${widgetID}/metadata`)
        .send({ ...data, loggedUser: ROLES.ADMIN });
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

    it('Create widget metadata being authenticated as USER should fail', helpers.isUserForbidden());

    it('Create widget metadata being authenticated as ADMIN but with wrong application should fail', helpers.isRightAppRequired());

    it('Create widget metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(COMMON_AUTH_ERROR_CASES.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResource('widget');
            const widget = await createWidget({ ...defaultMetadata, ...data });
            widget.status.should.equal(400);
            ensureCorrectError(widget.body, expectedError);
        }));
    });

    it('Create widget  metadata should success', async () => {
        const defaultWidget = createMetadataResource('widget');
        const widget = await createWidget(defaultWidget);

        validateMetadata(widget.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
