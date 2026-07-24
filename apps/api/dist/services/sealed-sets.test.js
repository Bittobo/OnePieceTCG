import { describe, expect, it } from 'vitest';
import { groupSealedItems } from './sealed-sets.js';
const common = {
    quantity: 1,
    language: 'English',
    tags: [],
    isSealed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};
describe('groupSealedItems', () => {
    it('pairs a box and pack by set code', () => {
        const items = [
            {
                ...common,
                id: 'box-1',
                kind: 'box',
                name: 'Legacy Booster Box',
                setName: 'Legacy of the Master',
                setCode: 'OP12',
                boxType: 'Booster Box',
            },
            {
                ...common,
                id: 'pack-1',
                kind: 'pack',
                name: 'Legacy Booster Pack',
                setName: 'Legacy of the Master',
                setCode: 'OP12',
            },
        ];
        expect(groupSealedItems(items)).toMatchObject([
            {
                setCode: 'OP12',
                isComplete: true,
                boxes: [{ id: 'box-1' }],
                packs: [{ id: 'pack-1' }],
            },
        ]);
    });
    it('keeps a missing half incomplete', () => {
        const items = [
            {
                ...common,
                id: 'pack-1',
                kind: 'pack',
                name: 'Romance Dawn Pack',
                setName: 'Romance Dawn',
                setCode: 'OP01',
            },
        ];
        expect(groupSealedItems(items)[0]).toMatchObject({
            isComplete: false,
            boxes: [],
            packs: [{ id: 'pack-1' }],
        });
    });
    it('pairs by set name when one product is missing a set code', () => {
        const items = [
            {
                ...common,
                id: 'box-1',
                kind: 'box',
                name: 'Romance Dawn Box',
                setName: 'Romance Dawn',
                setCode: 'OP01',
                boxType: 'Booster Box',
            },
            {
                ...common,
                id: 'pack-1',
                kind: 'pack',
                name: 'Romance Dawn Pack',
                setName: 'Romance Dawn',
            },
        ];
        expect(groupSealedItems(items)).toMatchObject([
            {
                setCode: 'OP01',
                isComplete: true,
                boxes: [{ id: 'box-1' }],
                packs: [{ id: 'pack-1' }],
            },
        ]);
    });
    it('sorts OP sets numerically before EB and PRB sets', () => {
        const sealed = (id, setCode, setName) => ({
            ...common,
            id,
            kind: 'pack',
            name: `${setName} Pack`,
            setName,
            setCode,
        });
        const items = [
            sealed('prb', 'PRB-01', 'Premium Booster'),
            sealed('op10', 'OP10', 'Royal Blood'),
            sealed('eb', 'EB-02', 'Anime 25th Collection'),
            sealed('op2', 'OP02', 'Paramount War'),
            sealed('op15', 'OP15-EB04', "Adventure on Kami's Island"),
        ];
        expect(groupSealedItems(items).map((group) => group.setCode)).toEqual([
            'OP02',
            'OP10',
            'OP15-EB04',
            'EB-02',
            'PRB-01',
        ]);
    });
});
//# sourceMappingURL=sealed-sets.test.js.map