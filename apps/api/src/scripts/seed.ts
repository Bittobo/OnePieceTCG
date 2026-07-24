import { itemInputSchema } from '@one-piece-tcg/shared';

import { loadEnvironmentFiles, parseConfig } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { CardCollectionModel, normalizeCollectionName } from '../models/card-collection.js';
import { ItemModel } from '../models/item.js';

loadEnvironmentFiles();

async function seed(): Promise<void> {
  const config = parseConfig();
  await connectDatabase(config.mongoUri);

  if ((await ItemModel.countDocuments()) > 0) {
    console.log('Seed skipped because the collection already contains items.');
    return;
  }

  const collection = await CardCollectionModel.findOneAndUpdate(
    { normalizedName: normalizeCollectionName('Favorites') },
    {
      $setOnInsert: {
        name: 'Favorites',
        normalizedName: normalizeCollectionName('Favorites'),
      },
    },
    { upsert: true, new: true },
  ).exec();

  const items = [
    itemInputSchema.parse({
      kind: 'card',
      collectionId: collection._id.toHexString(),
      name: 'Monkey D. Luffy',
      setName: 'Romance Dawn',
      setCode: 'OP01',
      quantity: 1,
      language: 'English',
      tags: ['favorite'],
      cardNumber: 'OP01-003',
      rarity: 'Leader',
      colors: ['Red'],
      cardType: 'Leader',
      condition: 'Near Mint',
      finish: 'Regular',
      isGraded: false,
    }),
    itemInputSchema.parse({
      kind: 'pack',
      name: 'Wings of the Captain Booster Pack',
      setName: 'Wings of the Captain',
      setCode: 'OP06',
      quantity: 3,
      language: 'English',
      tags: ['sealed'],
      productCode: 'OP-06',
      isSealed: true,
    }),
    itemInputSchema.parse({
      kind: 'box',
      name: '500 Years in the Future Booster Box',
      setName: '500 Years in the Future',
      setCode: 'OP07',
      quantity: 1,
      language: 'English',
      tags: ['sealed'],
      productCode: 'OP-07',
      boxType: 'Booster Box',
      isSealed: true,
      packsPerBox: 24,
    }),
  ];

  await ItemModel.insertMany(items);
  console.log(`Inserted ${items.length} sample collection items.`);
}

seed()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
