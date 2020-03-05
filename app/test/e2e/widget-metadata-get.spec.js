const Metadata = require('models/metadata.model');
const nock = require('nock');
const chai = require('chai');
const { getTestServer } = require('./utils/test-server');
const { createMetadata, validateMetadata } = require('./utils/helpers');

chai.should();

const requester = getTestServer();

describe('Get widget metadata endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.deleteMany({}).exec();
    });

    it('Getting metadata for a widget should return empty array without creating metadata', async () => {
        const response = await requester.get('/api/v1/dataset/test123/widget/test123/metadata');
        response.status.should.equal(200);
        response.body.data.should.lengthOf(0);
    });

    it('Getting metadata for a widget should return result with creating metadata', async () => {
        const fakeMetadata = await new Metadata(createMetadata('widget')).save();
        const { dataset, resource: { id } } = fakeMetadata;
        const response = await requester.get(`/api/v1/dataset/${dataset}/widget/${id}/metadata`);
        response.status.should.equal(200);
        validateMetadata(response.body.data[0], fakeMetadata);
    });

    afterEach(async () => {
        await Metadata.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
