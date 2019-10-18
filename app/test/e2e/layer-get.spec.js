const Metadata = require('models/metadata.model');
const nock = require('nock');
const { getTestServer } = require('./test-server');
const { createMetadata, validateMetadata } = require('./utils');

const requester = getTestServer();

describe('METADATA LAYER GET endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await Metadata.remove({}).exec();
    });

    it('should return empty array without creating metadata', async () => {
        const response = await requester.get('/api/v1/dataset/test123/layer/test123/metadata');
        response.status.should.equal(200);
        response.body.data.should.lengthOf(0);
    });

    it('should return result with creating metadata', async () => {
        const fakeMetadata = await new Metadata(createMetadata('layer')).save();
        const { dataset, resource: { id } } = fakeMetadata;
        const response = await requester.get(`/api/v1/dataset/${dataset}/layer/${id}/metadata`);
        response.status.should.equal(200);
        validateMetadata(response.body.data[0], fakeMetadata);
    });

    afterEach(async () => {
        await Metadata.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
