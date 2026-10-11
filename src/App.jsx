import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import About from './pages/About';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProductDetail from './pages/ProductDetail';
import Brands from './pages/Brands';
import Admin from './pages/Admin';
import StoreLocation from './pages/StoreLocation';

function LegacyProductRedirect() {
  const [params] = useSearchParams();
  const id = params.get('id');
  return <Navigate replace to={id ? `/product/${encodeURIComponent(id)}` : '/shop'} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Catalog />} />
        <Route path="phones" element={<Catalog />} />
        <Route path="tablets" element={<Catalog />} />
        <Route path="laptops" element={<Catalog />} />
        <Route path="smart-watches" element={<Catalog />} />
        <Route path="accessories" element={<Catalog />} />
        <Route path="brands" element={<Brands />} />
        <Route path="brands/:brandSlug" element={<Catalog />} />
        <Route path="admin-key.html" element={<Admin />} />
        <Route path="admin" element={<Navigate replace to="/admin-key.html" />} />
        <Route path="admin.html" element={<Navigate replace to="/admin-key.html" />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="about" element={<About />} />
        <Route path="stores/ja-ela" element={<StoreLocation storeSlug="ja-ela" />} />
        <Route path="stores/kandana" element={<StoreLocation storeSlug="kandana" />} />
        <Route path="category.html" element={<Catalog />} />
        <Route path="product-details.html" element={<LegacyProductRedirect />} />
        <Route path="cart.html" element={<Cart />} />
        <Route path="about-us.html" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
