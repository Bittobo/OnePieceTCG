import mongoose from 'mongoose';
export async function connectDatabase(uri) {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
    });
}
export async function disconnectDatabase() {
    await mongoose.disconnect();
}
export function getDatabase() {
    const database = mongoose.connection.db;
    if (!database) {
        throw new Error('MongoDB is not connected');
    }
    return database;
}
export function isDatabaseReady() {
    return mongoose.connection.readyState === 1;
}
//# sourceMappingURL=connection.js.map