/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Metadata = require('models/metadata.model');
const { validateMetadata, deserializeDataset, createMetadata } = require('./utils');

const { getTestServer } = require('./test-server');

const should = chai.should();

let requester;

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

let metadataOne;
let metadataTwo;


describe('Find metadatas by IDs', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        Metadata.remove({}).exec();
    });

    it('Find metadatas without ids in body returns a 400 error', async () => {
        const response = await requester
            .post(`/api/v1/dataset/metadata/find-by-ids`)
            .send({});

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Bad request - Missing 'ids' from request body`);
    });

    it('Find metadatas with empty id list returns an empty list (empty db)', async () => {
        const response = await requester
            .post(`/api/v1/dataset/metadata/find-by-ids`)
            .send({
                ids: []
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
    });

    it('Find metadatas with id list containing metadata that does not exist returns an empty list (empty db)', async () => {
        const response = await requester
            .post(`/api/v1/dataset/metadata/find-by-ids`)
            .send({
                ids: ['abcd']
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
    });

    it('Find metadatas with id list containing metadata that does not exist returns an empty list (empty db)', async () => {
        const response = await requester
            .post(`/api/v1/dataset/metadata/find-by-ids`)
            .send({
                ids: ['abcd']
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
    });

    it('Find metadatas with id list containing a metadata that exists returns only the listed metadata', async () => {
        metadataOne = await new Metadata(createMetadata()).save();
        metadataTwo = await new Metadata(createMetadata()).save();

        const response = await requester
            .post(`/api/v1/dataset/metadata/find-by-ids`)
            .send({
                ids: [metadataOne.dataset]
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(1);

        const loadedDatasetOne = deserializeDataset(response)[0];

        loadedDatasetOne.should.have.property('attributes');

        validateMetadata(loadedDatasetOne, metadataOne);
    });

    it('Find metadatas with id list containing metadatas that exist returns the listed metadatas', async () => {
        const response = await requester
            .post(`/api/v1/dataset/metadata/find-by-ids`)
            .send({
                ids: [metadataOne.dataset, metadataTwo.dataset]
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        loadedDatasetOne.should.have.property('attributes');
        loadedDatasetTwo.should.have.property('attributes');

        validateMetadata(loadedDatasetOne, metadataOne);
        validateMetadata(loadedDatasetTwo, metadataTwo);
    });

    it('Find metadatas with id list containing metadatas that exist returns the listed metadatas', async () => {
        const response = await requester
            .post(`/api/v1/dataset/metadata/find-by-ids?ids=${metadataTwo.dataset}`)
            .send({
                ids: [metadataOne.dataset]
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(1);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        loadedDatasetOne.should.have.property('attributes');

        validateMetadata(loadedDatasetOne, metadataOne);
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
