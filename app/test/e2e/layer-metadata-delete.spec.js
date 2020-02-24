const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { expect } = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { initHelpers, createMetadata } = require('./utils/helpers');

chai.should();

const requester = getTestServer();
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/${DEFAULT.datasetID}/layer/${DEFAULT.widgetID}/metadata`,
    'delete',
    {},
    '?language=en&application=rw'
);

describe('Delete layer metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Delete layer metadata metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Delete layer metadata being authenticated as USER should fail', helpers.isUserForbidden());

    it('Delete layer metadata being authenticated as ADMIN but with wrong application should fail', helpers.isRightAppRequired());

    it('Delete layer metadata should success', async () => {
        const metadata = await new Metadata(createMetadata('layer')).save();
        await requester
            .delete(`/api/v1/dataset/${metadata.dataset}/layer/${metadata.resource.id}/metadata?language=en&application=rw&loggedUser=${JSON.stringify(ROLES.ADMIN)}`)
            .send({ loggedUser: ROLES.ADMIN });
        const layers = await Metadata.find({});
        expect(layers).to.be.length(0);
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
