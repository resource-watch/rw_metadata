const Metadata = require('models/metadata.model');
const nock = require('nock');
const { ROLES } = require('./test.constants');
const { getTestServer } = require('./test-server');
const { createMetadataResource, WIDGET_WRONG_DATAS } = require('./test.constants');
const { validateMetadata, ensureCorrectError, initHelpers } = require('./utils');

const requester = getTestServer();
const prefix = '/api/v1/dataset';
const DEFAULT = {
    layerID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `${prefix}/${DEFAULT.datasetID}/layer/${DEFAULT.layerID}/metadata`,
    'post',
    createMetadataResource('layer'));

const createLayer = (data = createMetadataResource('layer')) => {
    const { widgetID, datasetID } = DEFAULT;

    return requester
        .post(`${prefix}/${datasetID}/layer/${widgetID}/metadata`)
        .send({ ...data, loggedUser: ROLES.ADMIN });
};

describe('METADATA LAYER POST endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Metadata.remove({}).exec();
    });

    it('create layer metadata without being authenticated should fall', helpers.isTokenRequired());

    it('create layer metadata being authenticated as USER should fall', helpers.isUserForbidden());

    it('create layer metadata being authenticated as ADMIN but with wrong application should fall', helpers.isRightAppRequired());

    it('create layer metadata with wrong data, should return error which specified in constant', async () => {
        await Promise.all(WIDGET_WRONG_DATAS.map(async ({ data, expectedError }) => {
            const defaultMetadata = createMetadataResource('layer');
            const layer = await createLayer({ ...defaultMetadata, ...data });
            layer.status.should.equal(400);
            ensureCorrectError(layer.body, expectedError);
        }));
    });

    it('create layer metadata should success', async () => {
        const defaultWidget = createMetadataResource('layer');
        const layer = await createLayer(defaultWidget);

        validateMetadata(layer.body.data[0], { ...defaultWidget, dataset: DEFAULT.datasetID });
    });

    afterEach(() => {
        Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
