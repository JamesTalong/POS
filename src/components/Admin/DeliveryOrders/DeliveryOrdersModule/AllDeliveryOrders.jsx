import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Truck,
  Search,
  BarChart2,
  CheckCircle,
  XCircle,
  Package,
  Trash2,
  Ban,
  ChevronDown,
  ChevronUp,
  RotateCcw, // Added for item return icon
} from "lucide-react";

import Loader from "../../../loader/Loader";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Import your custom Modals
import RevertTransactionModal from "../../Transactions/Modals/RevertTransactionModal";
import RejectItemModal from "../../PurchaseOrder/PurchaseOrderModule/RejectItemModal";

// Helper for Status Colors
const getStatusBadge = (status) => {
  switch (status) {
    case "Sold":
      return (
        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
          <CheckCircle size={12} /> Sold
        </span>
      );
    case "Voided":
      return (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
          <XCircle size={12} /> Voided
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold w-fit">
          {status}
        </span>
      );
  }
};

const AllDeliveryOrders = () => {
  const [doData, setDoData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDOs, setFilteredDOs] = useState([]);

  // Detail View State
  const [expandedRow, setExpandedRow] = useState(null);

  // --- MODAL STATES ---
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [selectedDOToRevert, setSelectedDOToRevert] = useState(null);

  // Reject Item Modal States (Modal Chaining)
  const [isRejectItemModalOpen, setIsRejectItemModalOpen] = useState(false);
  const [selectedItemToReject, setSelectedItemToReject] = useState(null);
  const [pendingRejectData, setPendingRejectData] = useState(null); // Stores data from Modal 1
  const [isProcessingSingleItem, setIsProcessingSingleItem] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}/api/DeliveryOrders`);
      setDoData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching DOs:", error);
      toast.error("Failed to fetch Delivery Orders.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering
  useEffect(() => {
    const results = doData.filter(
      (item) =>
        item.deliveryOrderNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDOs(results);
    setCurrentPage(1);
  }, [searchTerm, doData]);

  // --- ACTIONS ---

  // 1. FULL DO VOID (Standard logic)
  const openRevertModal = (item) => {
    if (item.isVoid) {
      toast.info("This DO is already voided.");
      return;
    }
    setIsProcessingSingleItem(false); // Flag that we are doing the WHOLE order
    setSelectedDOToRevert(item);
    setIsRevertModalOpen(true);
  };

  // 2. SPECIFIC ITEM RETURN (Start Chain)
  const openRejectItemModal = (parentDO, product) => {
    if (parentDO.isVoid) return;
    setIsProcessingSingleItem(true); // Flag that we are doing a SINGLE item
    setSelectedItemToReject({ ...product, deliveryOrderId: parentDO.id });
    setIsRejectItemModalOpen(true);
  };

  // 3. HANDLE SUBMIT FROM REJECTITEMMODAL (Chain Modal 1 to Modal 2)
  const handleRejectItemSubmit = (qty, reason, imageBase64) => {
    // Save data from first modal
    setPendingRejectData({
      quantity: qty,
      reason: reason,
      image: imageBase64,
    });

    // Close Modal 1, Open Modal 2 (RevertTransactionModal)
    setIsRejectItemModalOpen(false);
    setIsRevertModalOpen(true);
  };

  // 4. FINAL CONFIRM REVERT (API Call)
  const handleConfirmRevert = async (id, returnCondition) => {
    try {
      if (isProcessingSingleItem) {
        // --- FIX STARTS HERE ---
        let finalImageString = null;

        if (pendingRejectData.image) {
          const parts = pendingRejectData.image.split(",");
          finalImageString =
            parts.length > 1 ? parts[1] : pendingRejectData.image;
        }

        // 2. Create Payload with correct key names
        const payload = {
          deliveryOrderId: selectedItemToReject.deliveryOrderId,
          productId: selectedItemToReject.productId,
          quantity: pendingRejectData.quantity,
          reason: pendingRejectData.reason,
          imageBase64: finalImageString,
          returnCondition: returnCondition,
          voidBy: "Admin",
        };

        // --- FIX ENDS HERE ---
        await axios.post(`${domain}/api/DeliveryOrders/revert-item`, payload);
        toast.success("Item returned successfully.");
      } else {
        // API Call for Full DO Revert
        const payload = {
          returnCondition: returnCondition,
          voidBy: "Admin",
        };
        await axios.post(`${domain}/api/DeliveryOrders/revert/${id}`, payload);
        toast.success("DO Reverted Successfully.");
      }

      fetchData();
      setPendingRejectData(null);
    } catch (error) {
      console.error("Return Error:", error); // Added console log for easier debugging
      toast.error(error.response?.data?.message || "Failed to process return.");
    }
  };

  // 5. DELETE (Permanent)
  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this Delivery Order record?"))
      return;
    try {
      await axios.delete(`${domain}/api/DeliveryOrders/${id}`);
      toast.success("Record Deleted.");
      fetchData();
    } catch (error) {
      toast.error("Delete failed.");
    }
  };

  // Pagination Logic
  const currentItems = filteredDOs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen pb-12 relative bg-slate-50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Modal 1: Generic Reject Modal (Quantity, Reason, Image) */}
      <RejectItemModal
        isOpen={isRejectItemModalOpen}
        onClose={() => setIsRejectItemModalOpen(false)}
        onSubmit={handleRejectItemSubmit}
        lineItem={selectedItemToReject}
      />

      {/* Modal 2: Condition Modal (Return Good/Bad) */}
      <RevertTransactionModal
        isOpen={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        onConfirm={handleConfirmRevert}
        transactionId={
          isProcessingSingleItem
            ? selectedItemToReject?.deliveryOrderId
            : selectedDOToRevert?.id
        }
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-emerald-600" /> Delivery Orders (Sold)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track sold items and manage inventory returns.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 mt-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total DOs</p>
              <p className="text-2xl font-bold text-slate-800">
                {doData.length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Value Sold</p>
              <p className="text-2xl font-bold text-slate-800">
                ₱
                {doData
                  .filter((x) => !x.isVoid)
                  .reduce((acc, curr) => acc + curr.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by DO #, Customer, or Status..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4">DO Number</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-slate-50 transition ${
                          item.isVoid ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === item.id ? null : item.id
                              )
                            }
                            className="text-slate-400 hover:text-emerald-600"
                          >
                            {expandedRow === item.id ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {item.deliveryOrderNumber}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{item.customerName}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          ₱{item.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            {getStatusBadge(item.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-4">
                            {!item.isVoid ? (
                              <button
                                onClick={() => openRevertModal(item)}
                                className="text-slate-400 hover:text-orange-600"
                                title="Revert / Void (Whole DO)"
                              >
                                <Ban size={18} />
                              </button>
                            ) : (
                              <span className="text-[10px] text-red-400 font-black uppercase">
                                Voided
                              </span>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-400 hover:text-red-600"
                              title="Delete Record"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedRow === item.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="7" className="px-12 py-4">
                            <div className="border-l-4 border-emerald-500 bg-white p-4 rounded shadow-inner">
                              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Package size={16} /> Items Delivered (SOLD)
                              </h4>
                              <table className="w-full text-xs">
                                <thead className="text-slate-400 border-b">
                                  <tr>
                                    <th className="py-2 text-left">Product</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Price</th>
                                    <th className="py-2 text-right">Total</th>
                                    <th className="py-2 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.deliveryOrderItems?.map((prod) => (
                                    <tr
                                      key={prod.id}
                                      className="border-b border-slate-50 last:border-0"
                                    >
                                      <td className="py-2 font-medium">
                                        {prod.productName}
                                      </td>
                                      <td className="py-2 text-center">
                                        {prod.quantity}
                                      </td>
                                      <td className="py-2 text-right">
                                        ₱{prod.unitPrice.toLocaleString()}
                                      </td>
                                      <td className="py-2 text-right font-bold">
                                        ₱{prod.lineTotal.toLocaleString()}
                                      </td>
                                      <td className="py-2 text-center">
                                        {!item.isVoid &&
                                          prod.quantity > 0 && ( // FIX 2: Only show button if Qty > 0
                                            <button
                                              onClick={() =>
                                                openRejectItemModal(item, prod)
                                              }
                                              className="flex items-center gap-1 mx-auto bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100 transition shadow-sm border border-orange-200"
                                              title="Return this specific item"
                                            >
                                              <RotateCcw size={12} /> Return
                                            </button>
                                          )}
                                        {prod.quantity === 0 && (
                                          <span className="text-xs text-red-400 font-bold">
                                            Returned
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredDOs.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllDeliveryOrders;
