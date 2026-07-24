import {
  boxTypes,
  cardColors,
  cardFinishes,
  cardTypes,
  languages,
  tcgplayerImportedItemSchema,
  type TcgplayerImportedItem,
  type TcgplayerImportResult,
} from '@one-piece-tcg/shared';
import { z } from 'zod';

import { AppError } from '../errors/app-error.js';
import type { ImageUpload } from '../middleware/upload.js';

const tcgplayerProductSchema = z
  .object({
    productId: z.number().int().positive(),
    productLineName: z.string(),
    productTypeName: z.string(),
    productName: z.string(),
    productUrlName: z.string().optional(),
    setName: z.string(),
    setCode: z.string().nullable().optional(),
    rarityName: z.string().nullable().optional(),
    sealed: z.boolean(),
    marketPrice: z.number().nonnegative().nullable().optional(),
    imageCount: z.number().int().nonnegative().default(0),
    foilOnly: z.boolean().optional(),
    customAttributes: z.record(z.unknown()).default({}),
    formattedAttributes: z.record(z.unknown()).default({}),
  })
  .passthrough();

type TcgplayerProduct = z.infer<typeof tcgplayerProductSchema>;

interface ParsedTcgplayerUrl {
  productId: number;
  canonicalUrl: string;
  language: (typeof languages)[number];
}

const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function attributeText(attributes: Record<string, unknown>, key: string): string | undefined {
  const value = attributes[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function attributeList(attributes: Record<string, unknown>, key: string): string[] {
  const value = attributes[key];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  return typeof value === 'string' ? [value] : [];
}

function decodeHtmlText(value: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&apos;': "'",
    '&#39;': "'",
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
  };

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|apos|#39|quot|lt|gt|nbsp);/g, (entity) => entities[entity] ?? entity)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2_000);
}

function inferLanguage(url: URL): (typeof languages)[number] {
  const requestedLanguage = url.searchParams.get('Language');
  if (!requestedLanguage || requestedLanguage.toLowerCase() === 'all') {
    return 'English';
  }

  return (
    languages.find((language) => language.toLowerCase() === requestedLanguage.toLowerCase()) ??
    'Other'
  );
}

export function parseTcgplayerProductUrl(input: string): ParsedTcgplayerUrl {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new AppError(400, 'invalid_tcgplayer_url', 'Enter a valid TCGplayer product URL');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    (hostname !== 'tcgplayer.com' && hostname !== 'www.tcgplayer.com') ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new AppError(
      400,
      'invalid_tcgplayer_url',
      'Only HTTPS product links from www.tcgplayer.com are supported',
    );
  }

  const match = url.pathname.match(/^\/product\/(\d+)(?:\/[^/]+)?\/?$/i);
  if (!match?.[1]) {
    throw new AppError(400, 'invalid_tcgplayer_url', 'The link must be a TCGplayer product page');
  }

  const productId = Number(match[1]);
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw new AppError(400, 'invalid_tcgplayer_url', 'The TCGplayer product ID is invalid');
  }

  return {
    productId,
    canonicalUrl: `https://www.tcgplayer.com${url.pathname.replace(/\/$/, '')}`,
    language: inferLanguage(url),
  };
}

function inferCardFinish(product: TcgplayerProduct): (typeof cardFinishes)[number] {
  const label = `${product.productName} ${product.productUrlName ?? ''}`.toLowerCase();
  if (label.includes('manga')) return 'Manga';
  if (label.includes('alternate art') || label.includes('alt art') || /\bsp\b/.test(label)) {
    return 'Alternate Art';
  }
  if (label.includes('parallel')) return 'Parallel';
  if (label.includes('promo')) return 'Promo';
  if (product.foilOnly) return 'Foil';
  return 'Regular';
}

function inferCardType(product: TcgplayerProduct): (typeof cardTypes)[number] {
  const rawType = attributeList(product.customAttributes, 'cardType')[0];
  if (!rawType) return 'Other';
  if (rawType.toLowerCase().startsWith('don')) return 'Don';

  return cardTypes.find((cardType) => cardType.toLowerCase() === rawType.toLowerCase()) ?? 'Other';
}

function inferCardColors(product: TcgplayerProduct): (typeof cardColors)[number][] {
  const colors = attributeList(product.customAttributes, 'color')
    .map((rawColor) =>
      cardColors.find((cardColor) => cardColor.toLowerCase() === rawColor.toLowerCase()),
    )
    .filter((color): color is (typeof cardColors)[number] => Boolean(color));

  return colors.length > 0 ? colors : ['Other'];
}

function inferBoxType(productName: string): (typeof boxTypes)[number] {
  const name = productName.toLowerCase();
  if (name.includes('booster box')) return 'Booster Box';
  if (name.includes('display')) return 'Display';
  if (name.includes('starter deck')) return 'Starter Deck';
  if (name.includes('gift collection')) return 'Gift Collection';
  if (name.includes('case')) return 'Case';
  return 'Other';
}

function inferPacksPerBox(description: string | undefined): number | undefined {
  if (!description) return undefined;
  const match = description.match(/\b(\d{1,3})\s+booster packs?\b/i);
  return match?.[1] ? Number(match[1]) : undefined;
}

function isPackProduct(productName: string): boolean {
  const name = productName.toLowerCase();
  return /\bbooster pack\b/.test(name) && !/\bbox\b|\bdisplay\b|\bcase\b/.test(name);
}

export function mapTcgplayerProductDetails(
  rawProduct: unknown,
  sourceUrl: string,
): TcgplayerImportResult {
  const parsedUrl = parseTcgplayerProductUrl(sourceUrl);
  const product = tcgplayerProductSchema.parse(rawProduct);

  if (product.productId !== parsedUrl.productId) {
    throw new AppError(502, 'tcgplayer_product_mismatch', 'TCGplayer returned a different product');
  }
  if (product.productLineName.toLowerCase() !== 'one piece card game') {
    throw new AppError(
      400,
      'unsupported_product_line',
      'Only One Piece Card Game TCGplayer products are supported',
    );
  }

  const descriptionValue = attributeText(product.customAttributes, 'description');
  const notes = descriptionValue ? decodeHtmlText(descriptionValue) : undefined;
  const common = {
    name: product.productName,
    setName: product.setName,
    setCode: product.setCode ?? undefined,
    quantity: 1,
    language: parsedUrl.language,
    tags: ['tcgplayer'],
    notes,
    source: {
      provider: 'tcgplayer' as const,
      productId: product.productId,
      url: parsedUrl.canonicalUrl,
      importedAt: new Date().toISOString(),
    },
  };
  let item: TcgplayerImportedItem;
  const warnings: string[] = [];

  if (product.productTypeName.toLowerCase() === 'cards') {
    const cardNumber =
      attributeText(product.customAttributes, 'number') ??
      attributeText(product.formattedAttributes, 'Number');
    if (!cardNumber) {
      throw new AppError(
        422,
        'tcgplayer_card_number_missing',
        'TCGplayer did not provide a card number for this product',
      );
    }

    item = tcgplayerImportedItemSchema.parse({
      ...common,
      kind: 'card',
      cardNumber,
      rarity:
        attributeText(product.customAttributes, 'rarityDbName') ?? product.rarityName ?? 'Unknown',
      colors: inferCardColors(product),
      cardType: inferCardType(product),
      condition: 'Near Mint',
      finish: inferCardFinish(product),
      isGraded: false,
    });
  } else if (product.productTypeName.toLowerCase() === 'sealed products') {
    const packProduct = isPackProduct(product.productName);
    if (packProduct) {
      item = tcgplayerImportedItemSchema.parse({
        ...common,
        kind: 'pack',
        productCode: product.setCode ?? undefined,
        isSealed: true,
        packVariant: product.productName,
      });
    } else {
      const boxType = inferBoxType(product.productName);
      if (boxType === 'Other') {
        warnings.push('The sealed product type was set to Other; review it before saving.');
      }
      item = tcgplayerImportedItemSchema.parse({
        ...common,
        kind: 'box',
        productCode: product.setCode ?? undefined,
        boxType,
        isSealed: true,
        packsPerBox: inferPacksPerBox(notes),
      });
    }
  } else {
    throw new AppError(
      422,
      'unsupported_tcgplayer_product',
      `TCGplayer product type "${product.productTypeName}" is not supported`,
    );
  }

  if (product.marketPrice === null || product.marketPrice === undefined) {
    warnings.push('TCGplayer did not provide a current market price.');
  }

  return {
    item,
    imageUrl:
      product.imageCount > 0
        ? `https://tcgplayer-cdn.tcgplayer.com/product/${product.productId}_in_1000x1000.jpg`
        : undefined,
    warnings,
  };
}

export class TcgplayerClient {
  constructor(
    private readonly maxImageBytes: number,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async importProduct(sourceUrl: string): Promise<TcgplayerImportResult> {
    const parsedUrl = parseTcgplayerProductUrl(sourceUrl);
    const endpoint = `https://mp-search-api.tcgplayer.com/v1/product/${parsedUrl.productId}/details`;
    let response: Response;

    try {
      response = await this.fetchImplementation(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GrandLineVault/0.1 local collection importer',
        },
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      console.error('TCGplayer product request failed', error);
      throw new AppError(502, 'tcgplayer_unavailable', 'TCGplayer could not be reached');
    }

    if (!response.ok) {
      throw new AppError(
        response.status === 404 ? 404 : 502,
        response.status === 404 ? 'tcgplayer_product_not_found' : 'tcgplayer_request_failed',
        response.status === 404
          ? 'TCGplayer product not found'
          : `TCGplayer returned status ${response.status}`,
      );
    }

    try {
      return mapTcgplayerProductDetails(await response.json(), sourceUrl);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('TCGplayer returned invalid product data', error);
      throw new AppError(
        502,
        'tcgplayer_invalid_response',
        'TCGplayer returned product data in an unsupported format',
      );
    }
  }

  async downloadImage(imageUrl: string, expectedProductId: number): Promise<ImageUpload> {
    const parsed = this.parseImageUrl(imageUrl);
    const productId = parsed.pathname.match(/\/product\/(\d+)/)?.[1];
    if (!productId || Number(productId) !== expectedProductId) {
      throw new AppError(
        400,
        'tcgplayer_image_mismatch',
        'The imported image does not belong to the selected TCGplayer product',
      );
    }
    let response: Response;

    try {
      response = await this.fetchImplementation(parsed.toString(), {
        headers: {
          Accept: 'image/jpeg,image/png,image/webp',
          'User-Agent': 'GrandLineVault/0.1 local collection importer',
        },
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      console.error('TCGplayer image request failed', error);
      throw new AppError(
        502,
        'tcgplayer_image_unavailable',
        'TCGplayer image could not be downloaded',
      );
    }

    if (!response.ok || !response.body) {
      throw new AppError(
        502,
        'tcgplayer_image_unavailable',
        `TCGplayer image returned status ${response.status}`,
      );
    }

    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    if (!supportedImageTypes.has(mimeType)) {
      throw new AppError(
        502,
        'tcgplayer_image_type',
        'TCGplayer returned an unsupported image type',
      );
    }

    const declaredLength = Number(response.headers.get('content-length') ?? 0);
    if (declaredLength > this.maxImageBytes) {
      throw new AppError(400, 'image_too_large', 'The TCGplayer image exceeds the upload limit');
    }

    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;

    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > this.maxImageBytes) {
        await reader.cancel();
        throw new AppError(400, 'image_too_large', 'The TCGplayer image exceeds the upload limit');
      }
      chunks.push(Buffer.from(result.value));
    }

    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    return {
      originalname: `${productId}.${extension}`,
      mimetype: mimeType,
      size,
      buffer: Buffer.concat(chunks, size),
    };
  }

  private parseImageUrl(imageUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      throw new AppError(400, 'invalid_remote_image', 'The imported image URL is invalid');
    }

    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'tcgplayer-cdn.tcgplayer.com' ||
      parsed.port ||
      !/^\/product\/\d+(?:_\d+)?_in_\d+x\d+\.(?:jpg|jpeg|png|webp)$/i.test(parsed.pathname)
    ) {
      throw new AppError(
        400,
        'invalid_remote_image',
        'Only TCGplayer product CDN images can be imported',
      );
    }

    return parsed;
  }
}
