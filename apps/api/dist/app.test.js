import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase, getDatabase } from './db/connection.js';
import { CardCollectionModel } from './models/card-collection.js';
import { ItemModel } from './models/item.js';
import { GridFsImageStore } from './storage/gridfs.js';
const config = {
    mongoUri: '',
    apiHost: '127.0.0.1',
    apiPort: 3001,
    webOrigin: 'http://127.0.0.1:5173',
    gridFsBucketName: 'testImages',
    maxUploadBytes: 1024 * 1024,
    nodeEnv: 'test',
};
const card = {
    kind: 'card',
    name: 'Roronoa Zoro',
    setName: 'Romance Dawn',
    setCode: 'OP01',
    quantity: 2,
    language: 'English',
    tags: ['straw-hats'],
    cardNumber: 'OP01-025',
    rarity: 'Super Rare',
    colors: ['Green'],
    cardType: 'Character',
    condition: 'Near Mint',
    finish: 'Foil',
    isGraded: false,
};
describe('collection API', () => {
    let mongoServer;
    let server;
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        config.mongoUri = mongoServer.getUri('one_piece_test');
        await connectDatabase(config.mongoUri);
        const imageStore = new GridFsImageStore(getDatabase(), config.gridFsBucketName);
        server = createApp(config, imageStore).listen();
    }, 60_000);
    afterEach(async () => {
        await Promise.all([ItemModel.deleteMany({}), CardCollectionModel.deleteMany({})]);
        const database = getDatabase();
        const collections = (await database.collections()).filter((collection) => collection.collectionName.startsWith(`${config.gridFsBucketName}.`));
        for (const collection of collections) {
            await collection.deleteMany({});
        }
    });
    afterAll(async () => {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        await disconnectDatabase();
        await mongoServer.stop();
    });
    it('creates, lists, streams, and deletes an item with a GridFS image', async () => {
        const collectionResponse = await request(server)
            .post('/api/collections')
            .send({ name: 'Straw Hats' })
            .expect(201);
        const cardWithCollection = {
            ...card,
            collectionId: collectionResponse.body.collection.id,
        };
        const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const createResponse = await request(server)
            .post('/api/items')
            .field('payload', JSON.stringify({ item: cardWithCollection }))
            .attach('image', Buffer.concat([pngHeader, Buffer.from('test-image')]), {
            filename: 'zoro.png',
            contentType: 'image/png',
        })
            .expect(201);
        expect(createResponse.body.item).toMatchObject({
            kind: 'card',
            name: 'Roronoa Zoro',
            quantity: 2,
        });
        expect(createResponse.body.item.image.url).toMatch(/^\/api\/images\//);
        const listResponse = await request(server).get('/api/items?kind=card&search=Zoro').expect(200);
        expect(listResponse.body.pagination.totalItems).toBe(1);
        const updateResponse = await request(server)
            .patch(`/api/items/${createResponse.body.item.id}`)
            .field('payload', JSON.stringify({ item: { ...cardWithCollection, quantity: 4 } }))
            .expect(200);
        expect(updateResponse.body.item.quantity).toBe(4);
        expect(updateResponse.body.item.image.fileId).toBe(createResponse.body.item.image.fileId);
        await request(server)
            .get(createResponse.body.item.image.url)
            .expect('Content-Type', /image\/png/)
            .expect(200);
        await request(server).delete(`/api/items/${createResponse.body.item.id}`).expect(200);
        await request(server).get(createResponse.body.item.image.url).expect(404);
    });
    it('rejects a spoofed image MIME type', async () => {
        const collectionResponse = await request(server)
            .post('/api/collections')
            .send({ name: 'Worst Generation' })
            .expect(201);
        const response = await request(server)
            .post('/api/items')
            .field('payload', JSON.stringify({
            item: { ...card, collectionId: collectionResponse.body.collection.id },
        }))
            .attach('image', Buffer.from('not-a-real-png'), {
            filename: 'fake.png',
            contentType: 'image/png',
        })
            .expect(400);
        expect(response.body.error.code).toBe('invalid_image_content');
    });
});
//# sourceMappingURL=app.test.js.map