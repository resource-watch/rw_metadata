const Metadata = require('models/metadata.model');
const nock = require('nock');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { createMetadataResourceForUpdate, WIDGET_WRONG_DATAS } = require('./utils/test.constants');
const {
    validateMetadata, ensureCorrectError, initHelpers, createMetadata
} = require('./utils/helpers');

const requester = getTestServer();
const prefix = '/api/v1/dataset';
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `${prefix}/${DEFAULT.datasetID}/widget/${DEFAULT.widgetID}/metadata`,
    'patch',
    createMetadataResourceForUpdate('widget')
);

const updateWidget = (data = createMetadataResourceForUpdate('widget'), datasetID = DEFAULT.datasetID) => requester
    .patch(`${prefix}/${datasetID}/widget/${data.resource.id}/metadata`)
    .send({ ...data, loggedUser: ROLES.ADMIN });

describe('METADATA WIDGET PATCH endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.remove({}).exec();
    });

    it('update widget without being authenticated should fall', helpers.isTokenRequired());

    it('update widget being authenticated as USER should fall', helpers.isUserForbidden());

    it('update widget being authenticated as ADMIN but with wrong application should fall', helpers.isRightAppRequired());

    it('update widget with wrong data, should return error which specified in constant', async () => {
        await Promise.all(WIDGET_WRONG_DATAS.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResourceForUpdate('widget');
            const widget = await updateWidget({ ...defaultMetadata, ...data });
            widget.status.should.equal(400);
            ensureCorrectError(widget.body, expectedError);
        }));
    });

    it('update widget should success', async () => {
        const metadata = await new Metadata(createMetadata('widget')).save();
        const defaultWidget = createMetadataResourceForUpdate('widget', metadata.resource.id);
        const widget = await updateWidget(defaultWidget, metadata.dataset);
        validateMetadata(widget.body.data[0], { ...defaultWidget, dataset: metadata.dataset });
    });

    afterEach(async () => {
        await Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
