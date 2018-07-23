function deserializeDataset(response) {
    // if (isArray(response.body.data)) {
    //     return response.body.data.map(el => el.attributes);
    // } else if (isObject(response.body.data)) {
    //     return response.body.data.attributes;
    // }
    return response.body.data;
}

function validateMetadata(actual, expected) {
    actual.should.have.property('attributes').and.be.a('object');

    actual.attributes.should.have.property('dataset').and.equal(expected.dataset);
    actual.attributes.should.have.property('language').and.equal(expected.language);
    actual.attributes.should.have.property('name').and.equal(expected.name);
    actual.attributes.should.have.property('description').and.equal(expected.description);
    actual.attributes.should.have.property('info').and.be.a('object');
    actual.attributes.should.have.property('units').and.be.a('object');
    actual.attributes.should.have.property('columns').and.be.a('object');
    actual.attributes.should.have.property('status').and.equal(expected.status);
    actual.attributes.should.have.property('createdAt').and.be.a('string');
    actual.attributes.should.have.property('updatedAt').and.be.a('string');

    new Date(actual.attributes.createdAt).should.beforeTime(new Date());
    new Date(actual.attributes.updatedAt).should.beforeTime(new Date());
}

module.exports = {
    deserializeDataset,
    validateMetadata
};
