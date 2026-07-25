import { describe, expect, it } from "vitest";

import {
  mapTcgplayerProductDetails,
  normalizeCardCode,
  parseTcgplayerProductUrl,
  TcgplayerClient,
} from "./tcgplayer.js";

describe("TCGplayer importer", () => {
  it("extracts a product ID and strips tracking parameters", () => {
    expect(
      parseTcgplayerProductUrl(
        "https://www.tcgplayer.com/product/646571/one-piece-card?page=1&Language=Japanese",
      ),
    ).toEqual({
      productId: 646571,
      canonicalUrl: "https://www.tcgplayer.com/product/646571/one-piece-card",
      language: "Japanese",
    });
  });

  it("maps a One Piece card product into an editable item", () => {
    const result = mapTcgplayerProductDetails(
      {
        productId: 646571,
        productLineName: "One Piece Card Game",
        productTypeName: "Cards",
        productName: "Portgas.D.Ace (SP)",
        productUrlName: "PortgasDAce SP",
        setName: "Legacy of the Master",
        setCode: "OP12",
        rarityName: "Super Rare",
        sealed: false,
        marketPrice: 147.72,
        imageCount: 1,
        customAttributes: {
          description:
            "[On Play] Gains <em>Rush</em>.<br>Review before saving.",
          color: ["Yellow"],
          number: "ST13-011",
          cardType: ["Character"],
          rarityDbName: "SR",
        },
        formattedAttributes: {},
      },
      "https://www.tcgplayer.com/product/646571/one-piece-card-game?Language=all",
    );

    expect(result.item).toMatchObject({
      kind: "card",
      isJapanese: false,
      name: "Portgas.D.Ace (SP)",
      setCode: "OP12",
      cardNumber: "ST13-011",
      colors: ["Yellow"],
      cardType: "Character",
      finish: "Alternate Art",
    });
    expect(result.item.notes).toContain("Gains Rush");
    expect(result.imageUrl).toContain("646571_in_1000x1000.jpg");
  });

  it("maps a booster box and extracts packs per box", () => {
    const result = mapTcgplayerProductDetails(
      {
        productId: 545399,
        productLineName: "One Piece Card Game",
        productTypeName: "Sealed Products",
        productName: "Premium Booster - Booster Box",
        setName: "Premium Booster -The Best-",
        setCode: "PRB-01",
        rarityName: "None",
        sealed: true,
        marketPrice: 948.81,
        imageCount: 1,
        customAttributes: {
          description:
            "Each box contains 20 Booster Packs and 2 foil DON!! cards.",
        },
        formattedAttributes: {},
      },
      "https://www.tcgplayer.com/product/545399/one-piece-booster-box",
    );

    expect(result.item).toMatchObject({
      kind: "box",
      boxType: "Booster Box",
      packsPerBox: 20,
      isSealed: true,
    });
  });

  it("downloads an allowed TCGplayer CDN image within the size limit", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const fetchImplementation: typeof fetch = async () =>
      new Response(jpeg, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": String(jpeg.length),
        },
      });
    const client = new TcgplayerClient(1_024, fetchImplementation);

    await expect(
      client.downloadImage(
        "https://tcgplayer-cdn.tcgplayer.com/product/646571_in_1000x1000.jpg",
        646571,
      ),
    ).resolves.toMatchObject({
      originalname: "646571.jpg",
      mimetype: "image/jpeg",
      size: jpeg.length,
    });
  });

  it("normalizes card codes and searches related printings", async () => {
    const fetchImplementation: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/Catalog/SetNames")) {
        return Response.json({
          results: [
            {
              categoryId: 68,
              name: "Legacy of the Master",
              abbreviation: "OP12",
            },
            {
              categoryId: 68,
              name: "Legacy of the Master Release Event Cards",
              abbreviation: "OP12 RE",
            },
          ],
        });
      }
      if (url.includes("/search/request")) {
        const body = JSON.parse(String(init?.body)) as {
          filters: { term: { setName: string[] } };
        };
        const releaseEvent =
          body.filters.term.setName[0]?.includes("Release Event");
        return Response.json({
          results: [
            {
              totalResults: 1,
              results: [
                {
                  productId: releaseEvent ? 649258 : 643835,
                  productLineName: "One Piece Card Game",
                  setName: body.filters.term.setName[0],
                  customAttributes: { number: "OP12-091" },
                },
              ],
            },
          ],
        });
      }

      const productId = Number(url.match(/product\/(\d+)\/details/)?.[1]);
      const releaseEvent = productId === 649258;
      return Response.json({
        productId,
        productLineName: "One Piece Card Game",
        productTypeName: "Cards",
        productName: releaseEvent ? "Poker (Release Event)" : "Poker",
        setName: releaseEvent
          ? "Legacy of the Master Release Event Cards"
          : "Legacy of the Master",
        setCode: releaseEvent ? "OP12 RE" : "OP12",
        rarityName: "Common",
        sealed: false,
        imageCount: 1,
        customAttributes: {
          number: "OP12-091",
          rarityDbName: "C",
          color: ["Black"],
          cardType: ["Character"],
        },
        formattedAttributes: {},
      });
    };
    const client = new TcgplayerClient(1_024, fetchImplementation);

    expect(normalizeCardCode(" op12–091 ")).toBe("OP12-091");
    const response = await client.searchCardsByCode("op12-091");

    expect(response.code).toBe("OP12-091");
    expect(response.warnings).toEqual([]);
    expect(
      response.results.map((result) => result.item.source?.productId),
    ).toEqual([643835, 649258]);
  });
});
