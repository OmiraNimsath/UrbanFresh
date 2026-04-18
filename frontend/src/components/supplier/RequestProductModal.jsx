import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FiImage, FiX } from 'react-icons/fi';
import { requestNewProduct, getSupplierBrands, uploadSupplierProductImage } from "../../services/supplierService";

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Presentation Layer - Modal for suppliers to request a new product listing.
 */
export default function RequestProductModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brandId: "",
    imageUrl: "",
    unit: "PER_ITEM",
    stockQuantity: "",
    expiryDate: "",
  });
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const [uploadError, setUploadError]   = useState('');
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef = useRef(null);
  const prevObjectUrlRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadBrands();
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        brandId: "",
        imageUrl: "",
        unit: "PER_ITEM",
        stockQuantity: "",
        expiryDate: "",
      });
      setImagePreview(null);
      setImageFile(null);
      setUploadError('');
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
    }
  }, [isOpen]);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const data = await getSupplierBrands();
      setBrands(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, brandId: data[0].id }));
      }
    } catch {
      toast.error("Failed to load assigned brands");
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Image upload helpers ────────────────────────────────────────────────
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
      URL.revokeObjectURL(prevObjectUrlRef.current);
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
  // ───────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.brandId || !formData.stockQuantity || !formData.expiryDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    setUploadError('');
    try {
      let resolvedImageUrl = (formData.imageUrl ?? '').trim() || null;

      if (imageFile) {
        try {
          const { url } = await uploadSupplierProductImage(imageFile);
          resolvedImageUrl = url;
        } catch {
          setUploadError('Image upload failed. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      await requestNewProduct({
        ...formData,
        imageUrl: resolvedImageUrl,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        brandId: parseInt(formData.brandId, 10),
      });
      toast.success("Product listing requested successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to request product");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-190 overflow-y-auto rounded-2xl border border-[#e4ebe8] bg-white shadow-xl max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-[#e8efec] px-5 py-4 md:px-6">
          <div>
            <h2 className="text-xl font-bold text-[#163a2f]">Request New Product</h2>
            <p className="mt-1 text-xs text-[#6f817b]">Add a new item to the UrbanFresh catalog</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f817b] transition hover:bg-[#f0f4f2] hover:text-[#163a2f]"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 md:px-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#26443a]">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Organic Hass Avocado"
              className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#26443a]">Brand *</label>
            {loadingBrands ? (
              <p className="text-sm text-[#6f817b]">Loading brands...</p>
            ) : (
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
                required
              >
                <option value="" disabled>Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26443a]">Price (Rs.) *</label>
              <input
                type="number"
                name="price"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26443a]">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
              >
                <option value="PER_ITEM">Per Item</option>
                <option value="PER_KG">Per Kg</option>
                <option value="PER_BUNCH">Per Bunch</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26443a]">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Exotic Fruits"
                className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26443a]">Initial Stock *</label>
              <input
                type="number"
                name="stockQuantity"
                min="0"
                value={formData.stockQuantity}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#26443a]">Expiry Date *</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleChange}
              className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#26443a]">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about the product's origin, freshness, and quality..."
              className="w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 py-2 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#26443a]">Image URL / Upload</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 transition-colors ${
                isDragging
                  ? 'border-[#0d4a38] bg-[#edf5f1]'
                  : 'border-[#cfdad5] bg-[#f7f9f8] hover:border-[#0d4a38]'
              }`}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-28 w-auto rounded-md border border-[#d8e2de] object-cover"
                />
              ) : (
                <>
                  <FiImage className="h-7 w-7 text-[#7e918a]" />
                  <p className="text-center text-xs text-[#6f817b]">
                    Drag &amp; drop an image here, or{' '}
                    <span className="font-semibold text-[#0d4a38]">click to browse</span>
                  </p>
                  <p className="text-xs text-[#8fa09a]">JPG, PNG, WebP, up to 5 MB</p>
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
              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="text-xs font-semibold text-[#0d4a38] hover:underline"
                >
                  Change image
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setImageFile(null);
                    setFormData((prev) => ({ ...prev, imageUrl: '' }));
                  }}
                  className="text-xs font-semibold text-[#c23939] hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {uploadError && (
              <p className="mt-1 text-xs text-[#c23939]">{uploadError}</p>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-3 border-t border-[#e8efec] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-[#dbe4e0] px-4 text-sm font-medium text-[#3d5951] transition hover:bg-[#f4f8f6]"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-[#0d4a38] px-4 text-sm font-semibold text-white transition hover:bg-[#083a2c]"
              disabled={submitting}
            >
              {submitting ? "Requesting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

