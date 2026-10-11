import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem('dpk_mobile_cart') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  useEffect(() => {
    try { localStorage.setItem('dpk_mobile_cart', JSON.stringify(items)); } catch { /* Storage can be blocked. */ }
  }, [items]);

  const addItem = (product, variant, price) => {
    const variantKey = [variant?.ram, variant?.rom, variant?.color].filter(Boolean).join('-');
    const cartItemId = variantKey ? `${product.Product_ID}-${variantKey}` : product.Product_ID;
    setItems((current) => {
      const found = current.find((item) => item.cartItemId === cartItemId);
      if (found) return current.map((item) => item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item);
      return [...current, {
        cartItemId,
        Product_ID: product.Product_ID,
        Product_Name: product.Product_Name,
        Brand: product.Brand,
        Image_URL1: product.Image_URL1,
        selectedVariant: variant || null,
        cartPrice: price,
        qty: 1,
      }];
    });
  };

  const updateQty = (id, qty) => setItems((current) => qty < 1 ? current.filter((item) => item.cartItemId !== id) : current.map((item) => item.cartItemId === id ? { ...item, qty } : item));
  const removeItem = (id) => setItems((current) => current.filter((item) => item.cartItemId !== id));
  const clear = () => setItems([]);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.cartPrice * item.qty, 0);

  const value = useMemo(() => ({ items, addItem, updateQty, removeItem, clear, count, total }), [items, count, total]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
