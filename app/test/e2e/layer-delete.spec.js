const Metadata = require('models/metadata.model');
const nock = require('nock');
const { expect } = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { initHelpers, createMetadata } = require('./utils/helpers');

const requester = getTestServer();
const prefix = '/api/v1/dataset';
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `${prefix}/${DEFAULT.datasetID}/layer/${DEFAULT.widgetID}/metadata`,
    'delete',
    {},
    '?language=en&application=rw'
);

describe('METADATA LAYER DELETE endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.remove({}).exec();
    });

    it('delete layer without being authenticated should fall', helpers.isTokenRequired());

    it('delete layer being authenticated as USER should fall', helpers.isUserForbidden());

    it('delete layer being authenticated as ADMIN but with wrong application should fall', helpers.isRightAppRequired());

    it('delete layer should success', async () => {
        const metadata = await new Metadata(createMetadata('layer')).save();
        await requester
            .delete(`${prefix}/${metadata.dataset}/layer/${metadata.resource.id}/metadata?language=en&application=rw&loggedUser=${JSON.stringify(ROLES.ADMIN)}`)
            .send({ loggedUser: ROLES.ADMIN });
        const layers = await Metadata.find({});
        expect(layers).to.be.length(0);
    });

    afterEach(async () => {
        await Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
