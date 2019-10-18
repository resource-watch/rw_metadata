const Metadata = require('models/metadata.model');
const nock = require('nock');
const { ROLES } = require('./test.constants');
const { getTestServer } = require('./test-server');
const { createMetadataResourceForUpdate, WIDGET_WRONG_DATAS } = require('./test.constants');
const {
    validateMetadata, ensureCorrectError, initHelpers, createMetadata
} = require('./utils');

const requester = getTestServer();
const prefix = '/api/v1/dataset';
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `${prefix}/${DEFAULT.datasetID}/layer/${DEFAULT.widgetID}/metadata`,
    'patch',
    createMetadataResourceForUpdate('layer')
);

const updateLayer = (data = createMetadataResourceForUpdate('layer'), datasetID = DEFAULT.datasetID) => requester
    .patch(`${prefix}/${datasetID}/layer/${data.resource.id}/metadata`)
    .send(Object.assign({}, data, { loggedUser: ROLES.ADMIN }));

describe('METADATA LAYER PATCH endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.remove({}).exec();
    });

    it('update layer metadata without being authenticated should fall', helpers.isTokenRequired());

    it('update layer metadata being authenticated as USER should fall', helpers.isUserForbidden());

    it('update layer metadata being authenticated as ADMIN but with wrong application should fall', helpers.isRightAppRequired());

    it('update layer metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(WIDGET_WRONG_DATAS.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResourceForUpdate('layer');
            const layer = await updateLayer(Object.assign({}, defaultMetadata, data));
            layer.status.should.equal(400);
            ensureCorrectError(layer.body, expectedError);
        }));
    });

    it('update layer should success', async () => {
        const metadata = await new Metadata(createMetadata('layer')).save();
        const defaultWidget = createMetadataResourceForUpdate('layer', metadata.resource.id);
        const layer = await updateLayer(defaultWidget, metadata.dataset);
        validateMetadata(layer.body.data[0], Object.assign({}, defaultWidget, { dataset: metadata.dataset }));
    });

    afterEach(async () => {
        await Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
