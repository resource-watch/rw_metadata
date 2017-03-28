
class MetadataSerializer {

    static serialize(data) {

        const result = {
            data: []
        };
        if (data) {
            let serializeData = data;
            if (!Array.isArray(data)) {
                serializeData = [data];
            }
            serializeData.forEach((el) => {
                result.data.push({
                    id: el._id,
                    type: 'metadata',
                    attributes: {
                        dataset: el.dataset,
                        application: el.application,
                        resource: el.resource,
                        language: el.language,
                        name: el.name,
                        description: el.description,
                        source: el.source,
                        citation: el.citation,
                        license: el.license,
                        units: el.units,
                        info: el.info,
                        createdAt: el.createdAt,
                        updatedAt: el.updatedAt,
                        status: el.status
                    }
                });
            });
        }
        return result;
    }

}

module.exports = MetadataSerializer;
