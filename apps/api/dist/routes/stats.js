import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { ItemModel, toInventoryItem } from '../models/item.js';
export function createStatsRouter() {
    const router = Router();
    router.get('/', asyncHandler(async (_request, response) => {
        const [aggregates, recentDocuments] = await Promise.all([
            ItemModel.aggregate([
                {
                    $group: {
                        _id: {
                            kind: '$kind',
                            currency: '$currency',
                        },
                        uniqueItems: { $sum: 1 },
                        ownedQuantity: { $sum: '$quantity' },
                        purchaseCost: {
                            $sum: {
                                $multiply: ['$quantity', { $ifNull: ['$purchasePrice', 0] }],
                            },
                        },
                        estimatedValue: {
                            $sum: {
                                $multiply: ['$quantity', { $ifNull: ['$estimatedValue', 0] }],
                            },
                        },
                    },
                },
            ]),
            ItemModel.find().sort({ createdAt: -1 }).limit(6).exec(),
        ]);
        const byKind = {
            card: { uniqueItems: 0, ownedQuantity: 0 },
            pack: { uniqueItems: 0, ownedQuantity: 0 },
            box: { uniqueItems: 0, ownedQuantity: 0 },
        };
        const totals = {
            uniqueItems: 0,
            ownedQuantity: 0,
        };
        const valueByCurrency = {};
        for (const aggregate of aggregates) {
            const kindTotals = byKind[aggregate._id.kind];
            kindTotals.uniqueItems += aggregate.uniqueItems;
            kindTotals.ownedQuantity += aggregate.ownedQuantity;
            totals.uniqueItems += aggregate.uniqueItems;
            totals.ownedQuantity += aggregate.ownedQuantity;
            const currencyTotals = valueByCurrency[aggregate._id.currency] ?? {
                purchaseCost: 0,
                estimatedValue: 0,
            };
            currencyTotals.purchaseCost += aggregate.purchaseCost;
            currencyTotals.estimatedValue += aggregate.estimatedValue;
            valueByCurrency[aggregate._id.currency] = currencyTotals;
        }
        response.json({
            totals,
            valueByCurrency,
            byKind,
            recentItems: recentDocuments.map(toInventoryItem),
        });
    }));
    return router;
}
//# sourceMappingURL=stats.js.map