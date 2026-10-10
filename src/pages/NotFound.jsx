import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function NotFound() {
  useDocumentMeta('Page not found | DPK Mobile', 'Find your way back to the DPK Mobile collection.');
  return <main className="not-found dpk-empty-page shell"><div className="empty-state-icon"><Search size={34} /></div><span className="eyebrow">404 · A wrong turn</span><h1>Let’s get you back on track.</h1><p>We couldn’t find the page you’re looking for. Your next favourite might be waiting in our collection.</p><div className="empty-state-actions"><Link className="button button--dark" to="/shop">Explore products <ArrowRight size={17} /></Link><Link className="button button--outline" to="/"><ArrowLeft size={17} /> Back home</Link></div></main>;
}
