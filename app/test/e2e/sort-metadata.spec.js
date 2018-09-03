/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiDatetime = require('chai-datetime');
const Metadata = require('models/metadata.model');

const should = chai.should();
const { validateMetadata, deserializeDataset, createMetadata } = require('./utils');
const { getTestServer } = require('./test-server');

const requester = getTestServer();

chai.use(chaiHttp);
chai.use(chaiDatetime);

let fakeMetadataOne = null;
let fakeMetadataTwo = null;


describe('Sort metadata', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Metadata.remove({}).exec();

        const metadataOne = createMetadata();
        const metadataTwo = createMetadata();

        metadataOne.name = `Dataset ${metadataOne.name}`;
        metadataOne.description = `Bescription ${metadataOne.description}`;
        metadataTwo.name = `Bataset ${metadataTwo.name}`;
        metadataTwo.description = `Description ${metadataTwo.description}`;

        fakeMetadataOne = await new Metadata(metadataOne).save();
        fakeMetadataTwo = await new Metadata(metadataTwo).save();
    });

    it('Sort metadata by name non-specified order should return multiple results in ascending order', async () => {
        const response = await requester
            .get(`/api/v1/metadata?sort=name&type=dataset`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataTwo);
        validateMetadata(loadedDatasetTwo, fakeMetadataOne);
    });

    it('Sort metadata by name descending should return multiple results in expected order', async () => {
        const response = await requester
            .get(`/api/v1/metadata?sort=${encodeURIComponent('-')}name&type=dataset`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    it('Sort metadata by name ascending should return multiple results in expected order', async () => {
        const response = await requester
            .get(`/api/v1/metadata?sort=${encodeURIComponent('+')}name&type=dataset`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataTwo);
        validateMetadata(loadedDatasetTwo, fakeMetadataOne);
    });

    it('Sort metadata by description non-specified order should return multiple results in ascending order', async () => {
        const response = await requester
            .get(`/api/v1/metadata?sort=description&type=dataset`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    it('Sort metadata by description descending should return multiple results in expected order', async () => {
        const response = await requester
            .get(`/api/v1/metadata?sort=${encodeURIComponent('-')}description&type=dataset`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataTwo);
        validateMetadata(loadedDatasetTwo, fakeMetadataOne);
    });

    it('Sort metadata by description ascending should return multiple results in expected order', async () => {
        const response = await requester
            .get(`/api/v1/metadata?sort=${encodeURIComponent('+')}description&type=dataset`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    afterEach(() => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(async () => {
        Metadata.remove({}).exec();
    });
});
