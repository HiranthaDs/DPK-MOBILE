import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

export default function CatalogNotice() {
  const { products, error, refreshing, source, retry } = useCatalog();
  if (error && !products.length) return (
    <div className="catalog-error"><AlertCircle /><div><strong>We couldn’t reach the live inventory.</strong><p>{error}</p></div><button onClick={retry}>Try again</button></div>
  );
  if (source === 'cache' || source === 'stale-cache' || refreshing || error) return (
    <div className="data-note"><RefreshCw className={refreshing ? 'spin' : ''} size={15} /><span>{refreshing ? 'Refreshing live stock…' : error ? 'Showing the last saved catalog while the sheet reconnects.' : 'Showing saved stock.'}</span></div>
  );
  return null;
}
