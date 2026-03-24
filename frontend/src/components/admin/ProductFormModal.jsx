import { useState, useEffect, useRef } from 'react';
import { uploadProductImage } from '../../services/adminProductService';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Presentation Layer – Reusable modal form for creating and editing a product.
 * When `product` prop is provided the form is pre-filled (edit mode);
 * otherwise it starts empty (create mode).
 *
 * @param {Object|null} product   - existing product to edit, or null for create
 * @param {Array}       brands    - active brands for optional assignment
 * @param {Function}    onSubmit  - called with form data object on save
 * @param {Function}    onClose   - called when the modal should close
 * @param {boolean}     loading   - disables the submit button while saving
 */
export default function ProductFormModal({ product, brands, onSubmit, onClose, loading }) {
  const isEdit = product !== null && product !== undefined;

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    unit: 'PER_ITEM',
    imageUrl: '',
    brandId: '',
    featured: false,
    expiryDate: '',
    stockQuantity: '',
  });

  // Image upload state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const [uploadError, setUploadError]   = useState('');
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef = useRef(null);
  const prevObjectUrlRef = useRef(null);

  // Pre-fill form when editing an existing product
  useEffect(() => {
    if (isEdit) {
      setForm({
        name: product.name ?? '',
        description: product.description ?? '',
        price: product.price ?? '',
        category: product.category ?? '',
        unit: product.unit ?? 'PER_ITEM',
        imageUrl: product.imageUrl ?? '',
        brandId: product.brandId ?? '',
        featured: product.featured ?? false,
        expiryDate: product.expiryDate ?? '',
        stockQuantity: product.stockQuantity ?? '',
      });
      // Show existing URL as preview (backwards-compatible)
      if (product.imageUrl) setImagePreview(product.imageUrl);
    }
  }, [product, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ── Image upload helpers ──────────────────────────────────────────────────
  const validateAndSetFile = (file) => {
    setUploadError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported format. Use JPG, PNG, or WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('File exceeds the 5 MB limit.');
      return;
    }
    // Revoke previously created object URL to avoid memory leaks
    if (prevObjectUrlRef.current) {
      try { URL.revokeObjectURL(prevObjectUrlRef.current); } catch (e) {}
      prevObjectUrlRef.current = null;
    }
    const objUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(objUrl);
    prevObjectUrlRef.current = objUrl;
  };

  const handleFileInput  = (e) => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); };
  const handleDrop       = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) validateAndSetFile(f); };
  const handleDragOver   = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave  = ()  => setIsDragging(false);
  // ─────────────────────────────────────────────────────────────────────────

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) {
        try { URL.revokeObjectURL(prevObjectUrlRef.current); } catch (e) {}
        prevObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    // Safely resolve values (avoid calling .trim() on null/undefined)
    let resolvedImageUrl = (form.imageUrl ?? '').trim() || null;

    if (imageFile) {
      try {
        const { url } = await uploadProductImage(imageFile);
        resolvedImageUrl = url;
      } catch (err) {
        setUploadError('Image upload failed. Please try again.');
        return;
      }
    }

    const priceVal = parseFloat(String(form.price));
    const stockVal = parseInt(String(form.stockQuantity), 10);

    onSubmit({
      name: (form.name ?? '').trim(),
      description: ((form.description ?? '').trim()) || null,
      price: Number.isFinite(priceVal) ? priceVal : 0,
      category: ((form.category ?? '').trim()) || null,
      brandId: form.brandId ? Number(form.brandId) : null,
      unit: form.unit || 'PER_ITEM',
      imageUrl: resolvedImageUrl,
      featured: !!form.featured,
      // Send null for empty expiry so backend treats it as no expiry
      expiryDate: form.expiryDate || null,
      stockQuantity: Number.isInteger(stockVal) ? stockVal : 0,
    });
  };

  return (
    /* Backdrop — overflowY so the whole overlay scrolls on very short screens */
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] my-auto">
        {/* Sticky header */}
        <div className="px-6 pt-6 pb-2 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h2>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto px-6 pb-2 flex-1">
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
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
            <Field label="Price (LKR) *">
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

          {/* Optional Brand */}
          <Field label="Brand (optional)">
            <select
              name="brandId"
              value={form.brandId}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="">No Brand</option>
              {brands?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name} ({brand.code})
                </option>
              ))}
            </select>
          </Field>

          {/* Pricing Unit */}
          <Field label="Pricing Unit">
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="PER_ITEM">Per Item</option>
              <option value="PER_KG">Per kg</option>
              <option value="PER_G">Per g</option>
              <option value="PER_L">Per L</option>
              <option value="PER_ML">Per ml</option>
            </select>
          </Field>

          {/* Image Upload */}
          <Field label="Product Image">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
                isDragging
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
              }`}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-32 w-auto rounded object-cover"
                />
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 16.5V19a1 1 0 001 1h16a1 1 0 001-1v-2.5M16 9l-4-4m0 0L8 9m4-4v12" />
                  </svg>
                  <p className="text-xs text-gray-500 text-center">
                    Drag &amp; drop an image here, or{' '}
                    <span className="text-green-600 font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP · max 5 MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {imagePreview && (
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="text-xs text-green-600 hover:underline"
                >
                  Change image
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setImageFile(null);
                    setForm((prev) => ({ ...prev, imageUrl: '' }));
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-red-600 mt-1">{uploadError}</p>
            )}
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
          <div className="flex justify-end gap-3 pt-2 pb-4">
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
