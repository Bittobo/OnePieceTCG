import { Routes, Route } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { CollectionPage } from './pages/CollectionPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { ImportPage } from './pages/ImportPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SealedProductsPage } from './pages/SealedProductsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<CollectionsPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="collections/:collectionId" element={<CollectionPage />} />
        <Route path="sealed" element={<SealedProductsPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="items/:itemId" element={<ItemDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
