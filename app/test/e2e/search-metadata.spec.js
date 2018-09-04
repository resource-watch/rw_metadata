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


describe('Search metadata', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Metadata.remove({}).exec();

        const metadataOne = createMetadata();
        const metadataTwo = createMetadata();

        metadataOne.name = `${metadataOne.name} nameUniqueWord keyword`;
        metadataTwo.description = `${metadataTwo.description} descriptionUniqueWord keyword keyword`;

        fakeMetadataOne = await new Metadata(metadataOne).save();
        fakeMetadataTwo = await new Metadata(metadataTwo).save();
    });

    it('Search for metadata by keyword in multiple names should return multiple results', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?search=name&sort=createdAt`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    it('Search for metadata by keyword in a single name should return a single result', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?search=nameUniqueWord`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(1);

        const loadedDatasetOne = deserializeDataset(response)[0];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
    });

    it('Search for metadata by keyword in multiple descriptions should return multiple results', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?search=description&sort=createdAt`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    it('Search for metadata by keyword in a single description should return a single result', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?search=descriptionUniqueWord&sort=createdAt`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(1);

        const loadedDatasetOne = deserializeDataset(response)[0];

        validateMetadata(loadedDatasetOne, fakeMetadataTwo);
    });

    it('Search for metadata by keyword in different fields of different results should prioritize results according to weight - test name weight > 2x description weight', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?search=keyword&sort=relevance`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    it('Search for metadata by keyword in different fields of different results should prioritize results according to weight - test name weight < 3x description weight', async () => {
        let currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const metadataThree = createMetadata();

        metadataThree.description = `${metadataThree.description} keyword keyword keyword`;

        const fakeMetadataThree = await new Metadata(metadataThree).save();

        currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(3);

        const response = await requester
            .get(`/api/v1/metadata?search=keyword&sort=relevance`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(3);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];
        const loadedDatasetThree = deserializeDataset(response)[2];

        validateMetadata(loadedDatasetOne, fakeMetadataThree);
        validateMetadata(loadedDatasetTwo, fakeMetadataOne);
        validateMetadata(loadedDatasetThree, fakeMetadataTwo);

        await Metadata.remove({ _id: fakeMetadataThree.id }).exec();
    });

    it('Search for metadata by keyword and sort by relevance non-specified should prioritize results according to weight - test name weight > 2x description weight', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?sort=relevance&search=keyword`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    it('Search for metadata by keyword and sort by relevance descending should prioritize results according to weight - test name weight > 2x description weight', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?sort=${encodeURIComponent('-')}relevance&search=keyword`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').with.lengthOf(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    it('Search for metadata by keyword and sort by relevance ascending should return an error', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?sort=${encodeURIComponent('+')}relevance&search=keyword`);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal(`Sort by relevance ascending not supported`);
    });

    it('Search for metadata by multiple keywords uses the "OR" approach', async () => {
        const currentMetadata = await Metadata.find({}).exec();
        currentMetadata.should.be.a('array').with.lengthOf(2);

        const response = await requester
            .get(`/api/v1/metadata?search=nameUniqueWord%20descriptionUniqueWord&sort=+name`);

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
