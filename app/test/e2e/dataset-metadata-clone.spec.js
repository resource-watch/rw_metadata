const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const {
    validateMetadata, deserializeDataset, createMetadata, ensureCorrectError, initHelpers, mockGetUserFromToken
} = require('./utils/helpers');

chai.should();

const requester = getTestServer();
const helpers = initHelpers(
    requester,
    `/api/v1/dataset/123/metadata/clone`,
    'post',
    { newDataset: 'test123' }
);

describe('Clone dataset metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Cloning dataset metadata without being authenticated should fail', helpers.isTokenRequired());

    it('Cloning dataset metadata while being authenticated as USER should fail', helpers.isUserForbidden());

    it('Cloning dataset metadata while being authenticated as MANAGER with the wrong app should fail', helpers.isManagerWithWrongAppForbidden());

    it('Cloning dataset metadata while being authenticated as ADMIN but with wrong application should fail', helpers.isAdminWithWrongAppForbidden());

    it('Cloning dataset metadata without body should fail', async () => {
        const response = await requester.post(`/api/v1/dataset/123/metadata/clone`).send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, '- newDataset: newDataset can not be empty. - ');
    });

    it('Cloning dataset metadata while being authenticated as MANAGER with the right app should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.MANAGER);
        const newDataset = 'test123';
        const fakeMetadata = await new Metadata(createMetadata()).save();
        const response = await requester
            .post(`/api/v1/dataset/${fakeMetadata.dataset}/metadata/clone`)
            .set('Authorization', `Bearer abcd`)
            .send({ newDataset, application: 'rw' });

        const clonedMetadata = deserializeDataset(response)[0];
        validateMetadata(clonedMetadata, Object.assign(fakeMetadata, { dataset: newDataset }));
    });

    it('Cloning dataset metadata while being authenticated as ADMIN with the right app should succeed (happy case)', async () => {
        mockGetUserFromToken(ROLES.ADMIN);
        const newDataset = 'test123';
        const fakeMetadata = await new Metadata(createMetadata()).save();
        const response = await requester
            .post(`/api/v1/dataset/${fakeMetadata.dataset}/metadata/clone`)
            .set('Authorization', `Bearer abcd`)
            .send({ newDataset, application: 'rw' });

        const clonedMetadata = deserializeDataset(response)[0];
        validateMetadata(clonedMetadata, Object.assign(fakeMetadata, { dataset: newDataset }));
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
