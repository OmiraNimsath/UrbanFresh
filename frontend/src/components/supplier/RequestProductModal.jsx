import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
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
        try { URL.revokeObjectURL(prevObjectUrlRef.current); } catch (e) {}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Request New Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold p-1">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg min-h-[40px] focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
            {loadingBrands ? (
              <p className="text-sm text-gray-500">Loading brands...</p>
            ) : (
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="" disabled>Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                name="price"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
              >
                <option value="PER_ITEM">Per Item</option>
                <option value="PER_KG">Per Kg</option>
                <option value="PER_BUNCH">Per Bunch</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock *</label>
              <input
                type="number"
                name="stockQuantity"
                min="0"
                value={formData.stockQuantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
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
                    setFormData((prev) => ({ ...prev, imageUrl: '' }));
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
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center"
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

