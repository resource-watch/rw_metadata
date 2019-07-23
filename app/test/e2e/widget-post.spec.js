const Metadata = require('models/metadata.model');
const nock = require('nock');
const { ROLES } = require('./test.constants');
const { getTestServer } = require('./test-server');
const { createMetadataResource, WIDGET_WRONG_DATAS } = require('./test.constants');
const { validateMetadata, ensureCorrectError, initHelpers } = require('./utils');

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
    createMetadataResource('widget'));

const createWidget = (data = createMetadataResource('widget')) => {
    const { widgetID, datasetID } = DEFAULT;

    return requester
        .post(`${prefix}/${datasetID}/widget/${widgetID}/metadata`)
        .send(Object.assign({}, data, { loggedUser: ROLES.ADMIN }));
};

describe('METADATA WIDGET POST endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Metadata.remove({}).exec();
    });

    it('create widget without being authenticated should fall', helpers.isTokenRequired());

    it('create widget being authenticated as USER should fall', helpers.isUserForbidden());

    it('create widget being authenticated as ADMIN but with wrong application should fall', helpers.isRightAppRequired());

    it('create widget with wrong data, should return error which specified in constant', async () => {
        await Promise.all(WIDGET_WRONG_DATAS.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResource('widget');
            const widget = await createWidget(Object.assign({}, defaultMetadata, data));
            widget.status.should.equal(400);
            ensureCorrectError(widget.body, expectedError);
        }));
    });

    it('create widget should success', async () => {
        const defaultWidget = createMetadataResource('widget');
        const widget = await createWidget(defaultWidget);

        validateMetadata(widget.body.data[0], Object.assign({}, defaultWidget, { dataset: DEFAULT.datasetID }));
    });

    afterEach(() => {
        Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
