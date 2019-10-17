/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const Metadata = require('models/metadata.model');
const {
    ROLES
} = require('./test.constants');

const should = chai.should();

const { validateMetadata, deserializeDataset, createMetadata } = require('./utils');
const { getTestServer } = require('./test-server');

const requester = getTestServer();

let fakeMetadataOne = null;
let fakeMetadataTwo = null;
let fakeMetadataThree = null;

describe('EDIT METADATA:', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        nock.cleanAll();

        Metadata.remove({}).exec();

        fakeMetadataOne = createMetadata();
        fakeMetadataTwo = createMetadata();
        fakeMetadataThree = createMetadata();
    });

    it('Create metadata for a dataset', async () => {
        const metadatas = [fakeMetadataOne, fakeMetadataTwo, fakeMetadataThree];

        for (const metadata of metadatas) {
            const response = await requester
                .post(`/api/v1/dataset/${metadata.dataset}/metadata`)
                .send(Object.assign({}, metadata, { loggedUser: ROLES.ADMIN }));
            const createdDataset = deserializeDataset(response)[0];

            response.status.should.equal(200);
            response.body.should.have.property('data').and.be.a('array');

            validateMetadata(createdDataset, metadata);
        }
    });

    it('Update metadata for a dataset', async () => {
        const response = await requester
            .patch(`/api/v1/dataset/${fakeMetadataOne.dataset}/metadata`)
            .send(Object.assign({}, fakeMetadataTwo, { loggedUser: ROLES.ADMIN }));

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.a('array');

        const createdDataset = deserializeDataset(response)[0];

        const updatedDatasetOne = Object.assign({}, fakeMetadataTwo, { dataset: fakeMetadataOne.dataset });
        validateMetadata(createdDataset, updatedDatasetOne);


        // Below we test if the user can empty the string fields correctly
        {
            const fieldsToTest = ['description', 'source', 'citation', 'license'];

            const body = Object.assign(
                {},
                fakeMetadataThree,
                fieldsToTest.reduce((res, field) => Object.assign({}, res, { [field]: '' }), {}),
                { loggedUser: ROLES.ADMIN }
            );

            const response = await requester
                .patch(`/api/v1/dataset/${fakeMetadataThree.dataset}/metadata`)
                .send(body);

            response.status.should.equal(200);
            response.body.should.have.property('data').and.be.a('array');

            const actual = deserializeDataset(response)[0];
            const expected = Object.assign(
                {},
                fakeMetadataThree,
                fieldsToTest.reduce((res, field) => Object.assign({}, res, { [field]: '' }), {})
            );

            validateMetadata(actual, expected);
        }
    });

    it('Delete metadata for a dataset', async () => {
        const responseOne = await requester
            .delete(`/api/v1/dataset/${fakeMetadataOne.dataset}/metadata`)
            .query({ language: 'en', application: 'rw', loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();

        responseOne.status.should.equal(200);
        responseOne.body.should.have.property('data').and.be.a('array');

        const loadedDatasetOne = deserializeDataset(responseOne)[0];

        const responseTwo = await requester
            .delete(`/api/v1/dataset/${fakeMetadataTwo.dataset}/metadata`)
            .query({ language: 'en', application: 'rw', loggedUser: JSON.stringify(ROLES.ADMIN) })
            .send();

        responseTwo.status.should.equal(200);
        responseTwo.body.should.have.property('data').and.be.a('array');

        const loadedDatasetTwo = deserializeDataset(responseTwo)[0];

        const updatedDatasetOne = Object.assign({}, fakeMetadataTwo, { dataset: fakeMetadataOne.dataset });

        validateMetadata(loadedDatasetOne, updatedDatasetOne);
        validateMetadata(loadedDatasetTwo, fakeMetadataTwo);
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
