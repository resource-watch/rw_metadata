const Metadata = require('models/metadata.model');
const nock = require('nock');
const { expect } = require('chai');
const { ROLES } = require('./test.constants');
const { getTestServer } = require('./test-server');
const { initHelpers, createMetadata } = require('./utils');

const requester = getTestServer();
const prefix = '/api/v1/dataset';
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `${prefix}/${DEFAULT.datasetID}/widget/${DEFAULT.widgetID}/metadata`,
    'delete',
    {},
    '?language=en&application=rw'
);

describe('METADATA WIDGET DELETE endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Metadata.remove({}).exec();
    });

    it('delete widget without being authenticated should fall', helpers.isTokenRequired());

    it('delete widget being authenticated as USER should fall', helpers.isUserForbidden());

    it('delete widget being authenticated as ADMIN but with wrong application should fall', helpers.isRightAppRequired());

    it('delete widget should success', async () => {
        const metadata = await new Metadata(createMetadata('widget')).save();
        await requester
            .delete(`${prefix}/${metadata.dataset}/widget/${metadata.resource.id}/metadata?language=en&application=rw&loggedUser=${JSON.stringify(ROLES.ADMIN)}`)
            .send({ loggedUser: ROLES.ADMIN });
        const widgets = await Metadata.find({});
        expect(widgets).to.be.length(0);
    });

    afterEach(() => {
        Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
