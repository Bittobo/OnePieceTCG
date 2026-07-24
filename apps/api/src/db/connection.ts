import mongoose from 'mongoose';
import type { mongo } from 'mongoose';

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function getDatabase(): mongo.Db {
  const database = mongoose.connection.db;
  if (!database) {
    throw new Error('MongoDB is not connected');
  }

  return database;
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
