import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../../security"; // Adjust path as needed
import { X, RefreshCw, Gift } from "lucide-react";
import InventorySearchFilter from "./InventorySearchFilter"; // Adjust path

const ExchangeModal = ({
  isOpen,
  onClose,
  mode,
  originalItem,
  deliveryOrder,
  onSuccess,
  currentUserId,
}) => {
  const [loading, setLoading] = useState(false);
  const [productsMaster, setProductsMaster] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [returnCondition, setReturnCondition] = useState("GOOD");
  const [qtyToProcess, setQtyToProcess] = useState(1);
  const [reason, setReason] = useState("");

  // Load Data on Open
  useEffect(() => {
    if (isOpen && deliveryOrder?.locationId) {
      loadInventory(deliveryOrder.locationId);
    }
    // Reset form
    setSelectedProduct(null);
    setReason("");
    setQtyToProcess(1);
  }, [isOpen, deliveryOrder]);

  const loadInventory = async (locationId) => {
    try {
      setLoading(true);
      const [prodRes, stockRes] = await Promise.all([
        axios.get(`${domain}/api/Products`),
        axios.get(`${domain}/api/Products/stock-by-location/${locationId}`),
      ]);
      setProductsMaster(prodRes.data);

      const map = {};
      stockRes.data.forEach((item) => {
        map[item.productId] = { qty: item.stockCount, uom: item.uomName };
      });
      setInventoryMap(map);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load warehouse inventory");
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return toast.error("Please select a product.");
    if (!reason) return toast.error("Reason is required.");

    setLoading(true);
    try {
      // 1. Auto-Pick Serials (Simplified for this example)
      // For a real production app, you might want to open a Serial Modal here similar to your reference.
      // Here we just fetch N serials and send them.
      let serialIds = [];
      if (selectedProduct.hasSerial) {
        const serialRes = await axios.get(
          `${domain}/api/SerialNumbers/available/${selectedProduct.id}?locationName=${deliveryOrder.locationName}`,
        );
        const available = serialRes.data;
        if (available.length < qtyToProcess)
          throw new Error("Not enough serial numbers available.");
        serialIds = available.slice(0, qtyToProcess).map((s) => s.id);
      }

      if (mode === "REPLACE") {
        const payload = {
          deliveryOrderId: deliveryOrder.id,
          originalProductId: originalItem.productId,
          quantity: qtyToProcess,
          returnCondition: returnCondition,
          replacementProductId: selectedProduct.id,
          newSerialNumberIds: serialIds,
          reason: reason,
          doneBy: String(currentUserId),
        };
        await axios.post(`${domain}/api/DeliveryOrders/replace-item`, payload);
        toast.success("Item Replaced Successfully");
      } else {
        // COMPLIMENTARY
        const payload = {
          deliveryOrderId: deliveryOrder.id,
          productId: selectedProduct.id,
          quantity: qtyToProcess,
          serialNumberIds: serialIds,
          reason: reason,
          doneBy: String(currentUserId),
        };
        await axios.post(
          `${domain}/api/DeliveryOrders/add-complimentary`,
          payload,
        );
        toast.success("Complimentary Item Added");
      }

      onSuccess(); // Refresh parent
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Operation failed",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isReplace = mode === "REPLACE";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-4 flex justify-between items-center ${isReplace ? "bg-indigo-50" : "bg-purple-50"}`}
        >
          <h2
            className={`text-lg font-bold flex items-center gap-2 ${isReplace ? "text-indigo-700" : "text-purple-700"}`}
          >
            {isReplace ? <RefreshCw size={20} /> : <Gift size={20} />}
            {isReplace ? "Replace / Exchange Item" : "Add Complimentary Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Section A: What is being Returned? (Only for Replace) */}
          {isReplace && originalItem && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Returning
              </p>
              <div className="font-bold text-slate-700">
                {originalItem.productName}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Qty to Swap
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={originalItem.quantityReceived}
                    value={qtyToProcess}
                    onChange={(e) => setQtyToProcess(parseInt(e.target.value))}
                    className="w-full border rounded p-1 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Condition
                  </label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="w-full border rounded p-1 text-sm"
                  >
                    <option value="GOOD">Good (Resellable)</option>
                    <option value="BAD">Bad (Damaged)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section B: What is being Given? */}
          <div>
            <InventorySearchFilter
              data={productsMaster}
              inventoryMap={inventoryMap}
              onSelect={handleProductSelect}
              placeholder={`Search for ${isReplace ? "replacement" : "complimentary"} item...`}
            />
            {selectedProduct && (
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
                <span className="font-bold text-emerald-800 text-sm">
                  {selectedProduct.productName}
                </span>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Change
                </button>
              </div>
            )}
            {!isReplace && selectedProduct && (
              <div className="mt-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Quantity to Give
                </label>
                <input
                  type="number"
                  min="1"
                  value={qtyToProcess}
                  onChange={(e) => setQtyToProcess(parseInt(e.target.value))}
                  className="w-full border rounded p-1 text-sm font-bold"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">
              Reason / Remarks
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded p-2 text-sm h-20 resize-none"
              placeholder="Required..."
            ></textarea>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg ${isReplace ? "bg-indigo-600 hover:bg-indigo-700" : "bg-purple-600 hover:bg-purple-700"}`}
          >
            {loading ? "Processing..." : "Confirm Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExchangeModal;
