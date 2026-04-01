import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { requestNewProduct, getSupplierBrands } from "../../services/supplierService";

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
  });
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

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
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.brandId || !formData.stockQuantity) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await requestNewProduct({
        ...formData,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
            />
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

