const Koa = require('koa');
const logger = require('logger');
const koaLogger = require('koa-logger');
const koaValidate = require('koa-validate');
const config = require('config');
const loader = require('loader');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const ctRegisterMicroservice = require('sd-ct-register-microservice-node');
const ErrorSerializer = require('serializers/error.serializer');
const MigrateMongoose = require('migrate-mongoose');

const mongoUri = process.env.MONGO_URI || `mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`;

const koaBody = require('koa-body')({
    multipart: true,
    jsonLimit: '50mb',
    formLimit: '50mb',
    textLimit: '50mb'
});

const onDbReady = (err) => {
    logger.info('Connected to MongoDB at ', mongoUri);
    if (err) {
        logger.error(err);
        throw new Error(err);
    }
};

mongoose.connect(mongoUri, onDbReady);

const connectToMongoDB = async () => {
    const migrator = new MigrateMongoose({
        migrationsPath: `${__dirname}/migrations`, // Path to migrations directory
        dbConnectionUri: mongoUri, // mongo url
        es6Templates: true, // Should migrations be assumed to be using ES6?
        collectionName: 'migrations', // collection name to use for migrations (defaults to 'migrations')
        autosync: true // if making a CLI app, set this to false to prompt the user, otherwise true
    });

    const list = await migrator.list();

    const pendingMigrations = list.filter(e => (e.state === 'down'));

    pendingMigrations.forEach(async (migration) => {
        logger.info(`MIGRATIONS: Mongoose update ${migration.name} pending execution`);

        try {
            await migrator.run('up', migration.name);
            logger.info(`MIGRATIONS: Mongoose update ${migration.name} ran successfully`);
        } catch (err) {
            logger.error(`MIGRATIONS: Mongoose update ${migration.name} failed with result: ${err}`);
        }
    });

    const onDbReady = (err) => {
        logger.info('Connected to MongoDB at ', mongoUri);
        if (err) {
            logger.error(err);
            throw new Error(err);
        }
    };

    mongoose.connect(mongoUri, onDbReady);
};

connectToMongoDB();

const app = new Koa();

app.use(koaBody);

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (inErr) {
        let error = inErr;
        try {
            error = JSON.parse(inErr);
        } catch (e) {
            logger.error('Error parse');
            error = inErr;
        }
        ctx.status = error.status || ctx.status || 500;
        logger.error(error);
        ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
        if (process.env.NODE_ENV === 'prod' && ctx.status === 500) {
            ctx.body = 'Unexpected error';
        }
        ctx.response.type = 'application/vnd.api+json';
    }
});

app.use(koaLogger());

koaValidate(app);

loader.loadRoutes(app);

const server = app.listen(process.env.PORT, () => {
    ctRegisterMicroservice.register({
        info: require('../microservice/register.json'),
        swagger: require('../microservice/public-swagger.json'),
        mode: (process.env.CT_REGISTER_MODE && process.env.CT_REGISTER_MODE === 'auto') ? ctRegisterMicroservice.MODE_AUTOREGISTER : ctRegisterMicroservice.MODE_NORMAL,
        framework: ctRegisterMicroservice.KOA2,
        app,
        logger,
        name: config.get('service.name'),
        ctUrl: process.env.CT_URL,
        url: process.env.LOCAL_URL,
        token: process.env.CT_TOKEN,
        active: true,
    }).then(() => {
    }, (error) => {
        logger.error(error);
        process.exit(1);
    });
});

logger.info('Server started in ', process.env.PORT);

module.exports = server;
