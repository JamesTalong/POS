import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  Search,
  Truck,
} from "lucide-react";
import { domain } from "../../../../security";

// Reuse Product Selector (In a real app, extract to common component)
const ProductSelector = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const selectedProduct = options.find((p) => p.id === value);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        left: rect.left,
        width: rect.width,
        top: rect.bottom + 8,
        position: "fixed",
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  const filteredOptions = options.filter((p) =>
    (p.productName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-white border border-gray-300 rounded-lg py-2 px-3 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      >
        <span className="truncate">
          {selectedProduct
            ? selectedProduct.productName
            : placeholder || "Select Product..."}
        </span>
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {isOpen && (
        <div
          style={menuStyle}
          className="bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col max-h-60 overflow-hidden"
        >
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                autoFocus
                type="text"
                className="w-full pl-9 p-2 text-sm border rounded focus:outline-none focus:border-blue-500"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ul className="overflow-y-auto">
            {filteredOptions.map((opt) => (
              <li
                key={opt.id}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
              >
                {opt.productName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AddPurchasePrice = ({ onClose, refreshData, itemToEdit }) => {
  const [formData, setFormData] = useState({
    productId: null,
    vendorId: null,
    uomId: null,
    price: 0,
    effectiveDate: new Date(),
    notes: "",
    locationId: null,
  });

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        productId: itemToEdit.productId,
        vendorId: itemToEdit.vendorId,
        uomId: itemToEdit.uomId,
        price: itemToEdit.price,
        effectiveDate: new Date(itemToEdit.effectiveDate),
        notes: itemToEdit.notes || "",
        locationId: itemToEdit.locationId,
      });
    }
  }, [itemToEdit]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      setIsLoading(true);
      try {
        const [prodRes, locRes, uomRes, vendRes] = await Promise.all([
          axios.get(`${domain}/api/Products`),
          axios.get(`${domain}/api/Locations`),
          axios.get(`${domain}/api/UnitOfMeasurements`),
          axios.get(`${domain}/api/Vendors`), // Assuming this endpoint exists based on Controller logic
        ]);
        setProducts(prodRes.data);
        setLocations(locRes.data);
        setUoms(uomRes.data);
        setVendors(vendRes.data);
      } catch (error) {
        console.error(error);
        toast.error("Could not load reference data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (
      !formData.productId ||
      !formData.vendorId ||
      !formData.uomId ||
      !formData.locationId ||
      formData.price <= 0
    ) {
      return toast.warning("Please fill all required fields correctly.");
    }

    setIsLoading(true);
    const payload = {
      ...formData,
      effectiveDate: formData.effectiveDate.toISOString(),
    };

    try {
      if (itemToEdit) {
        await axios.put(
          `${domain}/api/PurchasePriceHistories/${itemToEdit.id}`,
          payload
        );
        toast.success("Updated successfully");
      } else {
        await axios.post(`${domain}/api/PurchasePriceHistories`, payload);
        toast.success("Created successfully");
      }
      refreshData();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg relative">
      {isLoading && <Loader />}

      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {itemToEdit ? "Edit Purchase Price" : "Add Purchase Price"}
          </h2>
          <p className="text-sm text-gray-500">Record costs from vendors.</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product *
              </label>
              <ProductSelector
                options={products}
                value={formData.productId}
                onChange={(p) => setFormData({ ...formData, productId: p.id })}
                disabled={!!itemToEdit}
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vendor *
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                  value={formData.vendorId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vendorId: parseInt(e.target.value),
                    })
                  }
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
                <Truck className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            {/* UOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={formData.uomId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, uomId: parseInt(e.target.value) })
                }
              >
                <option value="">Select UOM...</option>
                {uoms.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date *
              </label>
              <div className="relative z-10">
                <DatePicker
                  selected={formData.effectiveDate}
                  onChange={(date) =>
                    setFormData({ ...formData, effectiveDate: date })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={formData.locationId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    locationId: parseInt(e.target.value),
                  })
                }
              >
                <option value="">Select Location...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.locationName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              ></textarea>
            </div>
          </div>
        </form>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
        >
          {itemToEdit ? "Update Price" : "Save Price"}
        </button>
      </div>
    </div>
  );
};

export default AddPurchasePrice;
