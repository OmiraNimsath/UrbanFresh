import { useState, useEffect, useRef } from 'react';
import { uploadProductImage } from '../../services/adminProductService';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Presentation Layer – Reusable modal form for creating and editing a product.
 */
export default function ProductFormModal({ product, brands, onSubmit, onClose, loading }) {
  const isEdit = product !== null && product !== undefined;

  const [form, setForm] = useState(() => getInitialForm(product));

  const [imagePreview, setImagePreview] = useState(() => product?.imageUrl ?? null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const prevObjectUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(prevObjectUrlRef.current);
        } catch {
          // noop
        }
        prevObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

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

    if (prevObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(prevObjectUrlRef.current);
      } catch {
        // noop
      }
      prevObjectUrlRef.current = null;
    }

    const objUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(objUrl);
    prevObjectUrlRef.current = objUrl;
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    let resolvedImageUrl = (form.imageUrl ?? '').trim() || null;

    if (imageFile) {
      try {
        const { url } = await uploadProductImage(imageFile);
        resolvedImageUrl = url;
      } catch {
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
      expiryDate: form.expiryDate || null,
      stockQuantity: Number.isInteger(stockVal) ? stockVal : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex w-full max-w-md flex-col rounded-t-2xl border border-[#e4ebe8] bg-white shadow-xl sm:rounded-2xl" style={{ maxHeight: 'min(92dvh, 680px)' }}>
        <div className="flex shrink-0 items-start justify-between border-b border-[#edf2ef] px-6 pb-4 pt-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEdit ? 'Edit Product' : 'Create Product'}</h2>
            <p className="mt-1 text-xs text-slate-500">Add core product details for inventory management.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close product form modal"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <Field label="PRODUCT NAME">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={150}
              className={inputCls}
              placeholder="e.g. Organic Strawberries"
            />
          </Field>

          <Field label="DESCRIPTION">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className={inputCls}
              placeholder="Optional short product description"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="PRICE (LKR)">
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                className={inputCls}
                placeholder="0.00"
              />
            </Field>

            <Field label="STOCK QUANTITY">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="CATEGORY">
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                maxLength={80}
                className={inputCls}
                placeholder="e.g. Dairy"
              />
            </Field>

            <Field label="BRAND">
              <select name="brandId" value={form.brandId} onChange={handleChange} className={inputCls}>
                <option value="">No Brand</option>
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} ({brand.code})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="PRICING UNIT">
              <select name="unit" value={form.unit} onChange={handleChange} className={inputCls}>
                <option value="PER_ITEM">Per Item</option>
                <option value="PER_KG">Per kg</option>
                <option value="PER_G">Per g</option>
                <option value="PER_L">Per L</option>
                <option value="PER_ML">Per ml</option>
              </select>
            </Field>

            <Field label="EXPIRY DATE">
              <input
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
                className={inputCls}
                required
              />
            </Field>
          </div>

          <Field label="PRODUCT IMAGE">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border border-dashed p-4 text-center transition ${
                isDragging ? 'border-[#0d4a38] bg-[#eaf5ef]' : 'border-[#d4dfdb] bg-[#f8fbf9] hover:bg-[#f1f7f4]'
              }`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Product preview" className="mx-auto h-28 w-auto rounded object-cover" />
              ) : (
                <>
                  <svg className="mx-auto h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 16.5V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2.5M16 9l-4-4m0 0L8 9m4-4v12" />
                  </svg>
                  <p className="mt-2 text-xs text-slate-600">Drag & drop image or click to browse</p>
                  <p className="mt-1 text-[11px] text-slate-400">JPG, PNG, WebP (Max 5MB)</p>
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
              <div className="mt-2 flex gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-medium text-[#0d4a38] hover:underline">
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    setForm((prev) => ({ ...prev, imageUrl: '' }));
                  }}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={handleChange}
              className="h-4 w-4 accent-[#0d4a38]"
            />
            Feature on landing page
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-[#edf2ef] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d4dfdb] px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#0d4a38] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#083a2c] disabled:opacity-50"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-[#d4dfdb] bg-[#f8fbf9] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d4a38]/30';

function getInitialForm(product) {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '',
    category: product?.category ?? '',
    unit: product?.unit ?? 'PER_ITEM',
    imageUrl: product?.imageUrl ?? '',
    brandId: product?.brandId ?? '',
    featured: product?.featured ?? false,
    expiryDate: product?.expiryDate ?? '',
    stockQuantity: product?.stockQuantity ?? '',
  };
}
