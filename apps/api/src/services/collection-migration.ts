import { CardCollectionModel, normalizeCollectionName } from '../models/card-collection.js';
import { ItemModel } from '../models/item.js';

const legacyCollectionName = 'Unsorted';

export async function assignLegacyCardsToCollection(): Promise<void> {
  await ItemModel.collection.updateMany({ kind: 'card' }, [
    {
      $set: {
        quantity: { $ifNull: ['$quantity', 1] },
        language: { $ifNull: ['$language', 'English'] },
        tags: { $ifNull: ['$tags', []] },
        cardNumber: {
          $ifNull: ['$cardNumber', { $concat: ['legacy-', { $toString: '$_id' }] }],
        },
        rarity: { $ifNull: ['$rarity', 'Unknown'] },
        colors: {
          $cond: [{ $gt: [{ $size: { $ifNull: ['$colors', []] } }, 0] }, '$colors', ['Other']],
        },
        cardType: { $ifNull: ['$cardType', 'Other'] },
        condition: { $ifNull: ['$condition', 'Near Mint'] },
        finish: { $ifNull: ['$finish', 'Regular'] },
        isGraded: { $ifNull: ['$isGraded', false] },
        grader: {
          $cond: [
            { $eq: [{ $ifNull: ['$isGraded', false] }, true] },
            {
              $cond: [
                {
                  $and: [
                    { $eq: ['$grader', 'PSA'] },
                    {
                      $in: [
                        { $toString: '$grade' },
                        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                      ],
                    },
                  ],
                },
                'PSA',
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$grader', 'BGS'] },
                        {
                          $in: [
                            { $toString: '$grade' },
                            [
                              '1',
                              '1.5',
                              '2',
                              '2.5',
                              '3',
                              '3.5',
                              '4',
                              '4.5',
                              '5',
                              '5.5',
                              '6',
                              '6.5',
                              '7',
                              '7.5',
                              '8',
                              '8.5',
                              '9',
                              '9.5',
                              '10',
                            ],
                          ],
                        },
                      ],
                    },
                    'BGS',
                    'Other',
                  ],
                },
              ],
            },
            '$$REMOVE',
          ],
        },
        grade: {
          $cond: [
            { $eq: [{ $ifNull: ['$isGraded', false] }, true] },
            {
              $cond: [
                { $ne: [{ $ifNull: ['$grade', ''] }, ''] },
                { $toString: '$grade' },
                'Unknown',
              ],
            },
            '$$REMOVE',
          ],
        },
      },
    },
  ]);

  const legacyCardCount = await ItemModel.countDocuments({
    kind: 'card',
    $or: [{ collectionId: { $exists: false } }, { collectionId: null }, { collectionId: '' }],
  });

  if (legacyCardCount === 0) {
    return;
  }

  const collection = await CardCollectionModel.findOneAndUpdate(
    { normalizedName: normalizeCollectionName(legacyCollectionName) },
    {
      $setOnInsert: {
        name: legacyCollectionName,
        normalizedName: normalizeCollectionName(legacyCollectionName),
      },
    },
    {
      upsert: true,
      new: true,
    },
  ).exec();

  await ItemModel.updateMany(
    {
      kind: 'card',
      $or: [{ collectionId: { $exists: false } }, { collectionId: null }, { collectionId: '' }],
    },
    {
      $set: {
        collectionId: collection._id.toHexString(),
      },
    },
  );

  console.log(`Moved ${legacyCardCount} legacy card records into "${legacyCollectionName}".`);
}
