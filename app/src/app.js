const Koa = require('koa');
const logger = require('logger');
const koaLogger = require('koa-logger');
const koaValidate = require('koa-validate');
const config = require('config');
const loader = require('loader');
const mongoose = require('mongoose');
const sleep = require('sleep');
const koaSimpleHealthCheck = require('koa-simple-healthcheck');
const { RWAPIMicroservice } = require('rw-api-microservice-node');
const ErrorSerializer = require('serializers/error.serializer');
const koaBody = require('koa-body');

const mongooseOptions = require('../../config/mongoose');

const mongoUri = process.env.MONGO_URI || `mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`;

let retries = 10;

const onDbReady = (err) => {
    if (err) {
        if (retries >= 0) {
            // eslint-disable-next-line no-plusplus
            retries--;
            logger.error(`Failed to connect to MongoDB uri ${mongoUri} with error message "${err.message}", retrying...`);
            sleep.sleep(5);
            mongoose.connect(mongoUri, mongooseOptions, onDbReady);
        } else {
            logger.error('MongoURI', mongoUri);
            logger.error(err);
            throw new Error(err);
        }
    }
};

mongoose.connect(mongoUri, mongooseOptions, onDbReady);

const app = new Koa();

app.use(koaBody({
    multipart: true,
    jsonLimit: '50mb',
    formLimit: '50mb',
    textLimit: '50mb'
}));

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (inErr) {
        let error = inErr;
        try {
            error = JSON.parse(inErr);
        } catch (e) {
            logger.debug('Could not parse error message - is it JSON?: ', inErr);
            error = inErr;
        }
        ctx.status = error.status || ctx.status || 500;
        if (ctx.status >= 500) {
            logger.error(error);
        } else {
            logger.info(error);
        }
        ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
        if (process.env.NODE_ENV === 'prod' && ctx.status === 500) {
            ctx.body = 'Unexpected error';
        }
        ctx.response.type = 'application/vnd.api+json';
    }
});

app.use(koaLogger());
app.use(koaSimpleHealthCheck());

koaValidate(app);

app.use(RWAPIMicroservice.bootstrap({
    name: config.get('service.name'),
    info: require('../microservice/register.json'),
    swagger: require('../microservice/public-swagger.json'),
    logger,
    baseURL: process.env.CT_URL,
    url: process.env.LOCAL_URL,
    token: process.env.CT_TOKEN,
    fastlyEnabled: process.env.FASTLY_ENABLED,
    fastlyServiceId: process.env.FASTLY_SERVICEID,
    fastlyAPIKey: process.env.FASTLY_APIKEY
}));

loader.loadRoutes(app);

const server = app.listen(process.env.PORT, () => {
    if (process.env.CT_REGISTER_MODE === 'auto') {
        RWAPIMicroservice.register().then(() => {
            logger.info('CT registration process started');
        }, (error) => {
            logger.error(error);
            process.exit(1);
        });
    }
});

logger.info('Server started in ', process.env.PORT);

module.exports = server;
