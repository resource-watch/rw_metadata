const nock = require('nock');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiDatetime = require('chai-datetime');
const Metadata = require('models/metadata.model');

chai.should();

const { validateMetadata, deserializeDataset, createMetadata } = require('./utils/helpers');
const { getTestServer } = require('./utils/test-server');

const requester = getTestServer();

chai.use(chaiHttp);
chai.use(chaiDatetime);

describe('Get dataset metadata', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Get metadata for a single dataset', async () => {
        const fakeMetadataOne = await new Metadata(createMetadata()).save();
        await new Metadata(createMetadata()).save();

        const response = await requester
            .get(`/api/v1/dataset/${fakeMetadataOne.dataset}/metadata`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').and.length(1);

        const loadedDataset = deserializeDataset(response)[0];

        loadedDataset.should.have.property('attributes');

        validateMetadata(loadedDataset, fakeMetadataOne);
    });

    it('Get metadata for multiple datasets', async () => {
        const fakeMetadataOne = await new Metadata(createMetadata()).save();
        const fakeMetadataTwo = await new Metadata(createMetadata()).save();


        const response = await requester
            .get(`/api/v1/metadata`);
        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array').and.length(2);

        const loadedDatasetOne = deserializeDataset(response)[0];
        const loadedDatasetTwo = deserializeDataset(response)[1];

        loadedDatasetOne.should.have.property('attributes');
        loadedDatasetTwo.should.have.property('attributes');


        validateMetadata(loadedDatasetOne, fakeMetadataOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
