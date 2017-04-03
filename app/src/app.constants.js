const RESOURCES = ['dataset', 'layer', 'widget'];
const USER_ROLES = ['USER', 'MANAGER', 'ADMIN', 'SUPERADMIN'];
const STATUS = ['published', 'unpublished'];
const METADATA_FIELDS = {
    'forest-atlas': {
        agol_id: {
            type: 'string',
        },
        agol_link: {
            type: 'string',
        },
        amazon_link: {
            type: 'string',
        },
        sql_api: {
            type: 'string',
        },
        carto_link: {
            type: 'string',
        },
        map_service: {
            type: 'string',
        },
        download_data: {
            type: 'string',
        },
        cautions: {
            type: 'string',
        },
        date_of_content: {
            type: 'string',
        },
        frequency_of_updates: {
            type: 'string',
        },
        function: {
            type: 'string',
        },
        geographic_coverage: {
            type: 'string',
        },
        learn_more: {
            type: 'string',
        },
        other: {
            type: 'string',
        },
        resolution: {
            type: 'string',
        },
        subtitle: {
            type: 'string',
        },
        tags: {
            type: 'string',
        }
    }
};

module.exports = {
    RESOURCES,
    USER_ROLES,
    STATUS,
    METADATA_FIELDS
};
