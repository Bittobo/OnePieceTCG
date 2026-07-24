import { describe, expect, it } from 'vitest';
import { mapTcgplayerProductDetails, parseTcgplayerProductUrl, TcgplayerClient, } from './tcgplayer.js';
describe('TCGplayer importer', () => {
    it('extracts a product ID and strips tracking parameters', () => {
        expect(parseTcgplayerProductUrl('https://www.tcgplayer.com/product/646571/one-piece-card?page=1&Language=Japanese')).toEqual({
            productId: 646571,
            canonicalUrl: 'https://www.tcgplayer.com/product/646571/one-piece-card',
            language: 'Japanese',
        });
    });
    it('maps a One Piece card product into an editable item', () => {
        const result = mapTcgplayerProductDetails({
            productId: 646571,
            productLineName: 'One Piece Card Game',
            productTypeName: 'Cards',
            productName: 'Portgas.D.Ace (SP)',
            productUrlName: 'PortgasDAce SP',
            setName: 'Legacy of the Master',
            setCode: 'OP12',
            rarityName: 'Super Rare',
            sealed: false,
            marketPrice: 147.72,
            imageCount: 1,
            customAttributes: {
                description: '[On Play] Gains <em>Rush</em>.<br>Review before saving.',
                color: ['Yellow'],
                number: 'ST13-011',
                cardType: ['Character'],
                rarityDbName: 'SR',
            },
            formattedAttributes: {},
        }, 'https://www.tcgplayer.com/product/646571/one-piece-card-game?Language=all');
        expect(result.item).toMatchObject({
            kind: 'card',
            name: 'Portgas.D.Ace (SP)',
            setCode: 'OP12',
            cardNumber: 'ST13-011',
            colors: ['Yellow'],
            cardType: 'Character',
            finish: 'Alternate Art',
        });
        expect(result.item.notes).toContain('Gains Rush');
        expect(result.imageUrl).toContain('646571_in_1000x1000.jpg');
    });
    it('maps a booster box and extracts packs per box', () => {
        const result = mapTcgplayerProductDetails({
            productId: 545399,
            productLineName: 'One Piece Card Game',
            productTypeName: 'Sealed Products',
            productName: 'Premium Booster - Booster Box',
            setName: 'Premium Booster -The Best-',
            setCode: 'PRB-01',
            rarityName: 'None',
            sealed: true,
            marketPrice: 948.81,
            imageCount: 1,
            customAttributes: {
                description: 'Each box contains 20 Booster Packs and 2 foil DON!! cards.',
            },
            formattedAttributes: {},
        }, 'https://www.tcgplayer.com/product/545399/one-piece-booster-box');
        expect(result.item).toMatchObject({
            kind: 'box',
            boxType: 'Booster Box',
            packsPerBox: 20,
            isSealed: true,
        });
    });
    it('downloads an allowed TCGplayer CDN image within the size limit', async () => {
        const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
        const fetchImplementation = async () => new Response(jpeg, {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Length': String(jpeg.length),
            },
        });
        const client = new TcgplayerClient(1_024, fetchImplementation);
        await expect(client.downloadImage('https://tcgplayer-cdn.tcgplayer.com/product/646571_in_1000x1000.jpg', 646571)).resolves.toMatchObject({
            originalname: '646571.jpg',
            mimetype: 'image/jpeg',
            size: jpeg.length,
        });
    });
});
//# sourceMappingURL=tcgplayer.test.js.map