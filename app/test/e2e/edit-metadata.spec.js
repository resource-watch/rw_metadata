const { ROLES, DATASET_METADATA_ONE, DATASET_METADATA_TWO, DATASET_METADATA_ONE_RESPONSE_MOCK, DATASET_METADATA_TWO_RESPONSE_MOCK } = require('./test.constants');
const nock = require('nock');
const chai = require('chai');
const Metadata = require('models/metadata.model');

const should = chai.should();

const { validateMetadata, deserializeDataset } = require('./helpers');
const { getTestServer } = require('./test-server');

const requester = getTestServer();


describe('EDIT METADATA:', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        Metadata.remove({}).exec();

        nock.cleanAll();
    });

    it('Create metadata for a dataset', async () => {
        const responseOne = await requester
            .post(`/api/v1/dataset/${DATASET_METADATA_ONE.dataset}/metadata`)
            .send(DATASET_METADATA_ONE);
        const createdDatasetOne = deserializeDataset(responseOne)[0];

        responseOne.status.should.equal(200);
        responseOne.body.should.have.property('data').and.be.a('array');

        validateMetadata(createdDatasetOne, DATASET_METADATA_ONE);

        const responseTwo = await requester
            .post(`/api/v1/dataset/${DATASET_METADATA_TWO.dataset}/metadata`)
            .send(DATASET_METADATA_TWO);

        responseTwo.status.should.equal(200);
        responseTwo.body.should.have.property('data').and.be.a('array');

        const createdDatasetTwo = deserializeDataset(responseTwo)[0];

        validateMetadata(createdDatasetTwo, DATASET_METADATA_TWO);
    });

    it('Update metadata for a dataset', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${DATASET_METADATA_ONE.dataset}/metadata`)
            .send(DATASET_METADATA_TWO);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array');

        const createdDataset = deserializeDataset(response)[0];

        const updatedDatasetOne = Object.assign({}, DATASET_METADATA_TWO, { dataset: DATASET_METADATA_ONE.dataset });
        validateMetadata(createdDataset, updatedDatasetOne);
    });

    it('Delete metadata for a dataset', async () => {
        const responseOne = await requester
            .delete(`/api/v1/dataset/${DATASET_METADATA_ONE.dataset}/metadata`)
            .query({ language: 'en', application: 'rw', loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();

        responseOne.status.should.equal(200);
        responseOne.body.should.have.property('data').and.be.a('array');

        const loadedDatasetOne = deserializeDataset(responseOne)[0];

        const responseTwo = await requester
            .delete(`/api/v1/dataset/${DATASET_METADATA_TWO.dataset}/metadata`)
            .query({ language: 'en', application: 'rw', loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();

        responseTwo.status.should.equal(200);
        responseTwo.body.should.have.property('data').and.be.a('array');

        const loadedDatasetTwo = deserializeDataset(responseTwo)[0];

        const updatedDatasetOne = Object.assign({}, DATASET_METADATA_TWO, { dataset: DATASET_METADATA_ONE.dataset });

        validateMetadata(loadedDatasetOne, updatedDatasetOne);
        validateMetadata(loadedDatasetTwo, DATASET_METADATA_TWO);
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(() => {
        Metadata.remove({}).exec();
    });
});
