import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import { BrandProvider } from './context/BrandContext';
import './styles.css';
import './styles/theme.css';
import './styles/catalog.css';
import './styles/pages.css';
import './styles/admin.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CatalogProvider>
          <BrandProvider><CartProvider><App /></CartProvider></BrandProvider>
        </CatalogProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
