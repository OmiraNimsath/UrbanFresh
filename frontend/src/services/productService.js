/**
 * Service Layer – API calls for product data.
 * Covers the public landing page endpoints and the product listing/search page.
 * Uses the shared Axios instance so auth headers are attached automatically
 * when a token exists, but these endpoints work without one too.
 */
import api from './api';

/* ── Mock data for Figma design preview ── */
const MOCK_PRODUCTS = [
  { id: 1, name: 'Organic Bananas', category: 'Fruits', price: 2.49, unit: 'bunch', description: 'Sweet and ripe organic bananas.', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80', inStock: true, discountPercentage: null, hasNearExpiryBatches: false },
  { id: 2, name: 'Fresh Spinach', category: 'Vegetables', price: 1.99, unit: '200g', description: 'Tender baby spinach leaves.', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80', inStock: true, discountPercentage: 15, hasNearExpiryBatches: true, earliestExpiryDate: '2026-04-25' },
  { id: 3, name: 'Cherry Tomatoes', category: 'Vegetables', price: 3.49, unit: '500g', description: 'Juicy vine-ripened cherry tomatoes.', imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80', inStock: true, discountPercentage: null, hasNearExpiryBatches: false },
  { id: 4, name: 'Red Apples', category: 'Fruits', price: 4.99, unit: 'kg', description: 'Crisp and sweet red apples.', imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80', inStock: true, discountPercentage: 10, hasNearExpiryBatches: false },
  { id: 5, name: 'Avocado', category: 'Fruits', price: 2.99, unit: 'each', description: 'Perfectly ripe Hass avocados.', imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80', inStock: true, discountPercentage: null, hasNearExpiryBatches: false },
  { id: 6, name: 'Cucumber', category: 'Vegetables', price: 1.49, unit: 'each', description: 'Cool and refreshing cucumbers.', imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=80', inStock: true, discountPercentage: 20, hasNearExpiryBatches: true, earliestExpiryDate: '2026-04-23' },
  { id: 7, name: 'Bell Peppers Mix', category: 'Vegetables', price: 5.49, unit: '3 pack', description: 'Colourful mix of red, yellow and green peppers.', imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80', inStock: true, discountPercentage: null, hasNearExpiryBatches: false },
  { id: 8, name: 'Sweet Corn', category: 'Vegetables', price: 3.29, unit: '3 pack', description: 'Golden sweet corn cobs.', imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80', inStock: false, discountPercentage: null, hasNearExpiryBatches: false },
  { id: 9, name: 'Blueberries', category: 'Fruits', price: 6.99, unit: '125g', description: 'Antioxidant-rich fresh blueberries.', imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80', inStock: true, discountPercentage: null, hasNearExpiryBatches: false },
  { id: 10, name: 'Broccoli', category: 'Vegetables', price: 2.29, unit: 'head', description: 'Nutrient-dense fresh broccoli florets.', imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80', inStock: true, discountPercentage: 5, hasNearExpiryBatches: false },
  { id: 11, name: 'Mango', category: 'Fruits', price: 3.79, unit: 'each', description: 'Tropical Alphonso mangoes, naturally sweet.', imageUrl: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=80', inStock: true, discountPercentage: null, hasNearExpiryBatches: false },
  { id: 12, name: 'Carrots', category: 'Vegetables', price: 1.79, unit: '500g', description: 'Fresh crunchy orange carrots.', imageUrl: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&q=80', inStock: true, discountPercentage: null, hasNearExpiryBatches: false },
];
const MOCK_CATEGORIES = ['Fruits', 'Vegetables'];

export const getFeaturedProducts = () => Promise.resolve(MOCK_PRODUCTS.slice(0, 4));
export const getNearExpiryProducts = (days = 7) => Promise.resolve(MOCK_PRODUCTS.filter((p) => p.hasNearExpiryBatches));
export const getProducts = ({ search, category, sortBy, page = 0, size = 8 } = {}) => {
  let results = [...MOCK_PRODUCTS];
  if (search) results = results.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (category) results = results.filter((p) => p.category === category);
  if (sortBy === 'price_asc') results.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price_desc') results.sort((a, b) => b.price - a.price);
  const totalElements = results.length;
  const totalPages = Math.ceil(totalElements / size);
  const products = results.slice(page * size, (page + 1) * size);
  return Promise.resolve({ products, totalElements, totalPages, number: page });
};
export const getCategories = () => Promise.resolve(MOCK_CATEGORIES);
export const getProductById = (id) => {
  const product = MOCK_PRODUCTS.find((p) => String(p.id) === String(id)) ?? MOCK_PRODUCTS[0];
  return Promise.resolve(product);
};
export const getProductSuggestions = (query) =>
  Promise.resolve(MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).map((p) => p.name).slice(0, 5));

