import { useState, useEffect } from 'react';

/**
 * Presentation Layer – Reusable modal form for creating and editing a product.
 * When `product` prop is provided the form is pre-filled (edit mode);
 * otherwise it starts empty (create mode).
 *
 * @param {Object|null} product   - existing product to edit, or null for create
 * @param {Function}    onSubmit  - called with form data object on save
 * @param {Function}    onClose   - called when the modal should close
 * @param {boolean}     loading   - disables the submit button while saving
 */
export default function ProductFormModal({ product, onSubmit, onClose, loading }) {
  const isEdit = product !== null && product !== undefined;

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    featured: false,
    expiryDate: '',
    stockQuantity: '',
  });

  // Pre-fill form when editing an existing product
  useEffect(() => {
    if (isEdit) {
      setForm({
        name: product.name ?? '',
        description: product.description ?? '',
        price: product.price ?? '',
        category: product.category ?? '',
        imageUrl: product.imageUrl ?? '',
        featured: product.featured ?? false,
        expiryDate: product.expiryDate ?? '',
        stockQuantity: product.stockQuantity ?? '',
      });
    }
  }, [product, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      category: form.category.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      featured: form.featured,
      // Send null for empty expiry so backend treats it as no expiry
      expiryDate: form.expiryDate || null,
      stockQuantity: parseInt(form.stockQuantity, 10),
    });
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {isEdit ? 'Edit Product' : 'Add Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <Field label="Name *">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={150}
              className={inputCls}
              placeholder="e.g. Organic Milk"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={inputCls}
              placeholder="Optional product description"
            />
          </Field>

          {/* Price + Stock — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (USD) *">
              <input
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="0.00"
              />
            </Field>
            <Field label="Stock Quantity *">
              <input
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="0"
              />
            </Field>
          </div>

          {/* Category */}
          <Field label="Category">
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              maxLength={80}
              className={inputCls}
              placeholder="e.g. Dairy"
            />
          </Field>

          {/* Image URL */}
          <Field label="Image URL">
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              maxLength={500}
              className={inputCls}
              placeholder="https://..."
            />
          </Field>

          {/* Expiry Date */}
          <Field label="Expiry Date">
            <input
              name="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={handleChange}
              className={inputCls}
            />
          </Field>

          {/* Featured toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={handleChange}
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-sm text-gray-700">
              Feature on landing page
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Thin wrapper to keep label + input consistently styled. */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400';
