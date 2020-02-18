const Metadata = require('models/metadata.model');
const nock = require('nock');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const {
    validateMetadata, deserializeDataset, createMetadata, ensureCorrectError, initHelpers
} = require('./utils/helpers');

const requester = getTestServer();
const prefix = '/api/v1/dataset';
const helpers = initHelpers(
    requester,
    `${prefix}/123/metadata/clone`,
    'post',
    { newDataset: 'test123' }
);

describe('DATASET CLONE endpint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.remove({}).exec();
    });

    it('close without being authenticated should fall', helpers.isTokenRequired());

    it('close with being authenticated as USER should fall', helpers.isUserForbidden());

    it('close with being authenticated as ADMIN but with wrong application should fall', helpers.isRightAppRequired());

    it('close without body should fall', async () => {
        const response = await requester.post(`${prefix}/123/metadata/clone`).send();
        response.status.should.equal(400);
        ensureCorrectError(response.body, '- newDataset: newDataset can not be empty. - ');
    });

    it('close should success', async () => {
        const newDataset = 'test123';
        const fakeMetadata = await new Metadata(createMetadata()).save();
        const response = await requester
            .post(`${prefix}/${fakeMetadata.dataset}/metadata/clone`)
            .send({ newDataset, loggedUser: ROLES.ADMIN, application: 'rw' });

        const clonedMetadata = deserializeDataset(response)[0];
        validateMetadata(clonedMetadata, Object.assign(fakeMetadata, { dataset: newDataset }));
    });

    afterEach(async () => {
        await Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
