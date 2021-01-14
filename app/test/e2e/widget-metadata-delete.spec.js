const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { expect } = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { initHelpers, createMetadata, mockGetUserFromToken } = require('./utils/helpers');

chai.should();

const requester = getTestServer();
const DEFAULT = {
    widgetID: 'test123',
    datasetID: 'test123',
};
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/${DEFAULT.datasetID}/widget/${DEFAULT.widgetID}/metadata`,
    'delete',
    {},
    { language: 'en', application: 'rw' }
);

describe('Delete widget metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Deleting widget while metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Deleting widget while metadata being authenticated as USER should fail', helpers.isUserForbidden());

    it('Deleting widget while metadata being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Deleting widget while metadata being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Deleting widget while metadata being authenticated as MANAGER with the right app should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.MANAGER);
        const metadata = await new Metadata(createMetadata('widget')).save();

        const response = await requester
            .delete(`/api/v1/dataset/${metadata.dataset}/widget/${metadata.resource.id}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .query({
                language: 'en',
                application: 'rw',
            })
            .send();

        response.status.should.equal(200);

        const widgets = await Metadata.find({});
        expect(widgets).to.be.length(0);
    });

    it('Deleting widget while metadata being authenticated as ADMIN with the right app should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        const metadata = await new Metadata(createMetadata('widget')).save();

        const response = await requester
            .delete(`/api/v1/dataset/${metadata.dataset}/widget/${metadata.resource.id}/metadata`)
            .set('Authorization', `Bearer abcd`)
            .query({
                language: 'en',
                application: 'rw',
            })
            .send();

        response.status.should.equal(200);

        const widgets = await Metadata.find({});
        expect(widgets).to.be.length(0);
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
