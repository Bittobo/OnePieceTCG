# Grand Line Vault

A locally hosted One Piece TCG tracker backed by MongoDB. Cards live inside user-created named
collections, while boxes and packs have their own combined page. Product data and images are
imported from TCGplayer and persisted in MongoDB GridFS.

## Features

- Create, rename, open, and delete named card collections
- Paste a TCGplayer One Piece URL to import a card, box, or pack
- Choose an existing collection when importing a card
- Send sealed products directly to the combined **Boxes & Packs** page
- Store imported product images inside MongoDB GridFS
- Search cards within a collection and search sealed products separately
- Move an imported card between existing collections
- Mark cards as graded, select PSA/BGS/Other, and store the grade
- View locally stored PSA and BGS badges on graded cards
- Pair booster boxes and packs by set, with a missing-half placeholder and highlighted complete pair
- Keep the web application bound to localhost

## Prerequisites

- Node.js 20 or newer
- npm
- No separate database installation is required for local development

## First-time setup

```bash
cd /Users/boazbitton/Dev/one-piece-tcg-collection
cp .env.example .env
```

Set `MONGODB_URI` to either MongoDB Atlas or a local MongoDB instance. Keep `.env` private and never
commit it.

Install dependencies:

```bash
npm install
```

If `MONGODB_URI` points to the included local MongoDB runtime, start it in one terminal:

```bash
npm run db:local
```

Start the frontend and API in another terminal:

```bash
npm run dev
```

- Web application: <http://127.0.0.1:5173>
- API health check: <http://127.0.0.1:3001/api/health>

The root development command also watches the shared TypeScript contracts.

## MongoDB Atlas

Create an Atlas database user, allow the Mac's current IP address in Atlas Network Access, and set:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
```

The application remains local, but records and GridFS images are stored in Atlas.

## Local MongoDB or Docker

The included `npm run db:local` command provides persistent local MongoDB under `.local/mongodb`.
Docker users can instead run `docker compose up -d`. Run only one database option at a time and
make sure `MONGODB_URI` matches it.

## Sample data

After MongoDB is running, insert one example card, pack, and box:

```bash
npm run seed
```

The seed command does nothing when the collection already contains records.

## Importing from TCGplayer

Open **Import**, paste a One Piece TCGplayer product URL, and select **Load product**. The app loads
the product name, set, card or sealed-product details, description, and image.

For cards, select one of the existing named collections. Boxes and packs require no collection.
Nothing is saved until the final add button is selected. The API then downloads the image into
GridFS and keeps a link to the original TCGplayer page.

This optional lookup requires internet access and depends on TCGplayer's current public product
page data.

## Card grading

Open a card and use its **Grading** section to mark it as graded or ungraded. PSA supports whole
grades from 1 through 10, while BGS supports half-point grades. The badge graphics are stored
locally under `apps/web/public/grading`.

## Box and pack pairs

The **Boxes & Packs** page groups products by TCGplayer set code, falling back to set name when
needed. Every set has a Box half and a Pack half. A missing half displays an import shortcut for
the expected product. Sets containing both halves receive a gold border and green completion glow.
The page uses a compact responsive grid with three set cards per desktop row, loads every matching
set in one scrollable view, and orders families numerically as OP, then EB, then PRB.

## Search behavior

Card collections and sealed-set groups are fetched once and retained in the React Query cache.
Typing in either search box filters the already-loaded list in browser memory and does not issue a
new API request for each character. Imports, deletes, moves, and grading changes invalidate the
cache so the next list reflects persisted Atlas data.

## Production-style local run

```bash
npm start
```

This builds all workspaces, starts the compiled API on port 3001, and serves the Vite preview on
<http://127.0.0.1:4173>. It still runs only on the local machine.

## Validation commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

## Images and GridFS

Images are not written into the repository or a separate upload folder. MongoDB stores each image
in the configured GridFS bucket (default: `itemImages`) and the related item stores the GridFS file
ID. The API streams images to the browser through `/api/images/:fileId`.

Failed image cleanup is recorded and retried the next time the API starts. To inspect GridFS for
unreferenced images:

```bash
npm run images:check
```

To remove reported orphan images:

```bash
npm run images:cleanup
```

## Backup and restore

Because images are in GridFS, a normal MongoDB database backup includes both collection records and
image chunks.

```bash
mongodump --uri="$MONGODB_URI" --out=./backup
mongorestore --uri="$MONGODB_URI" ./backup
```

Keep backups outside the repository. Test restores against a separate database before relying on
them.

## Environment variables

| Variable                | Purpose                         |
| ----------------------- | ------------------------------- |
| `MONGODB_URI`           | API connection string           |
| `API_HOST` / `API_PORT` | Local API bind address and port |
| `WEB_ORIGIN`            | Allowed browser origin          |
| `GRIDFS_BUCKET_NAME`    | MongoDB GridFS bucket prefix    |
| `MAX_UPLOAD_MB`         | Server upload limit             |

Never commit the real `.env` file.
