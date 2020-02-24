const nock = require('nock');
const chai = require('chai');
const MetadataModel = require('models/metadata.model');
const {
    ROLES
} = require('./utils/test.constants');

chai.should();

const {
    validateMetadata, deserializeDataset, createMetadata, createMetadataInDB
} = require('./utils/helpers');
const { getTestServer } = require('./utils/test-server');

const requester = getTestServer();

describe('Update dataset metadata endpoint', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        await MetadataModel.deleteMany({}).exec();
    });

    it('Create metadata for a dataset', async () => {
        const fakeMetadataOne = createMetadata();
        const fakeMetadataTwo = createMetadata();
        const fakeMetadataThree = createMetadata();

        const metadatas = [fakeMetadataOne, fakeMetadataTwo, fakeMetadataThree];

        metadatas.forEach(async (metadata) => {
            const response = await requester
                .post(`/api/v1/dataset/${metadata.dataset}/metadata`)
                .send({ ...metadata, loggedUser: ROLES.ADMIN });
            const createdDataset = deserializeDataset(response)[0];

            response.status.should.equal(200);
            response.body.should.have.property('data').and.be.a('array');

            validateMetadata(createdDataset, metadata);
        });
    });

    it('Update metadata for a dataset should return a 200 HTTP code with the updated data (happy case)', async () => {
        const fakeMetadataOne = await createMetadataInDB();

        const response = await requester
            .patch(`/api/v1/dataset/${fakeMetadataOne.dataset}/metadata`)
            .send({
                language: fakeMetadataOne.language,
                application: fakeMetadataOne.application,
                loggedUser: ROLES.ADMIN
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array');

        const createdDataset = deserializeDataset(response)[0];

        const updatedDatasetOne = { ...fakeMetadataOne.toObject(), dataset: fakeMetadataOne.dataset };
        validateMetadata(createdDataset, updatedDatasetOne);
    });

    it('Update metadata with empty fields for a dataset should return a 200 HTTP code with the updated data', async () => {
        const fakeMetadataOne = await createMetadataInDB();

        const response = await requester
            .patch(`/api/v1/dataset/${fakeMetadataOne.dataset}/metadata`)
            .send({
                language: fakeMetadataOne.language,
                application: fakeMetadataOne.application,
                loggedUser: ROLES.ADMIN,
                description: '',
                source: '',
                citation: '',
                license: ''
            });

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array');

        const responseDataset = deserializeDataset(response)[0];

        const expectedDataset = {
            ...fakeMetadataOne.toObject(),
            dataset: fakeMetadataOne.dataset,
            description: '',
            source: '',
            citation: '',
            license: ''
        };

        validateMetadata(responseDataset, expectedDataset);
    });

    it('Delete metadata for a dataset', async () => {
        const fakeMetadataOne = await createMetadataInDB();
        const fakeMetadataTwo = await createMetadataInDB();

        const responseOne = await requester
            .delete(`/api/v1/dataset/${fakeMetadataOne.dataset}/metadata`)
            .query({ language: 'en', application: 'rw', loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();

        responseOne.status.should.equal(200);
        responseOne.body.should.have.property('data').and.be.a('array');

        const loadedDatasetOne = deserializeDataset(responseOne)[0];

        validateMetadata(loadedDatasetOne, fakeMetadataOne.toObject());


        const responseTwo = await requester
            .delete(`/api/v1/dataset/${fakeMetadataTwo.dataset}/metadata`)
            .query({ language: 'en', application: 'rw', loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();

        responseTwo.status.should.equal(200);
        responseTwo.body.should.have.property('data').and.be.a('array');

        const loadedDatasetTwo = deserializeDataset(responseTwo)[0];

        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
    });

    afterEach(async () => {
        await MetadataModel.deleteMany({}).exec();


        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
