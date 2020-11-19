const ROLES = {
    USER: {
        id: '1a10d7c6e0a37126611fd7a7',
        role: 'USER',
        provider: 'local',
        email: 'user@control-tower.org',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    MANAGER: {
        id: '1a10d7c6e0a37126611fd7a7',
        role: 'MANAGER',
        provider: 'local',
        email: 'user@control-tower.org',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    ADMIN: {
        id: '1a10d7c6e0a37126611fd7a7',
        role: 'ADMIN',
        provider: 'local',
        email: 'user@control-tower.org',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    }
};

const COMMON_AUTH_ERROR_CASES = [
    { expectedError: '- language: language check failed. - ', data: { language: 123 } },
    { expectedError: '- application: application check failed. - ', data: { application: {} } },
    { expectedError: '- description: should be a valid string - ', data: { description: 123 } },
    { expectedError: '- name: should be a valid string - ', data: { name: {} } },
    { expectedError: '- source: should be a valid string - ', data: { source: 123 } },
    { expectedError: '- citation: should be a valid string - ', data: { citation: 123 } },
    { expectedError: '- license: should be a valid string - ', data: { license: 123 } },
    { expectedError: '- units: should be a valid object - ', data: { units: [] } },
    { expectedError: '- columns: should be a valid object - ', data: { columns: [] } },
];

const createMetadataResource = (type, resourceID = Math.random().toString(36).substring(7)) => ({
    application: 'rw',
    resource: {
        id: resourceID,
        type
    },
    userId: ROLES.ADMIN.id,
    language: 'en',
    name: `Fake metadata name`,
    description: `Fake metadata ${resourceID} description`,
    source: `Fake source ${resourceID}`,
    citation: `Fake citation ${resourceID}`,
    license: `Fake license ${resourceID}`,
    info: {
        too: 'par'
    },
    units: {
        foo: 'bar'
    },
    columns: {
        noo: 'zar'
    },
    applicationProperties: {
        hoo: 'iar'
    },
    status: 'published'
});

const createMetadataResourceForUpdate = (type, resourceID = Math.random().toString(36).substring(7), additionalData = {}) => ({
    application: 'rw',
    resource: {
        id: resourceID,
        type
    },
    userId: ROLES.ADMIN.id,
    language: 'en',
    name: `Fake metadata name update`,
    description: `Fake metadata ${resourceID} description update`,
    source: `Fake source ${resourceID} update`,
    citation: `Fake citation ${resourceID} update`,
    license: `Fake license ${resourceID} update`,
    info: {
        too: 'par update'
    },
    units: {
        foo: 'bar update'
    },
    columns: {
        noo: 'zar update'
    },
    applicationProperties: {
        hoo: 'iar update'
    },
    status: 'unpublished',
    ...additionalData
});

module.exports = {
    ROLES,
    createMetadataResource,
    createMetadataResourceForUpdate,
    COMMON_AUTH_ERROR_CASES,
};
