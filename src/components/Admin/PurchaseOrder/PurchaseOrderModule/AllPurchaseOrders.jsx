// src/components/YourModule/PurchaseOrderModule/AllPurchaseOrders.jsx

import React, { useCallback, useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertCircle,
  Package,
  ShieldAlert,
  Eye,
  Printer,
  Archive,
  Clock,
  MapPin,
  Calendar,
  User,
  CreditCard,
  Info,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddPurchaseOrder from "./AddPurchaseOrder";
import Pagination from "../../Pagination";
import RejectItemModal from "./RejectItemModal";
import { domain } from "../../../../security";
import ViewRejectionModal from "./ViewRejectionModal";
import PrintPurchaseOrder from "./PrintPurchaseOrder";

// --- Helper to format currency ---
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount || 0);
};

// --- Helper for Date ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

// --- Mobile Card Component ---
const MobilePOCard = ({
  po,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onDevDelete,
  onFinalize,
  onRejectItem,
  onPrint,
  getStatusColor,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => onToggle(po.id)}
      >
        <div className="flex gap-3">
          <div className="mt-1 text-indigo-600">
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{po.poNumber}</span>
              {po.isStaging && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Draft
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{po.vendor}</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              po.status,
            )}`}
          >
            {po.status}
          </span>
          <p className="font-bold text-slate-800 mt-2">
            {formatCurrency(po.grandTotal, po.currency)}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {/* Header Details Section (Mobile) */}
          <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded border border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400" />
              <span>
                Location: <strong>{po.location || "N/A"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <span>
                Delivery: <strong>{formatDate(po.expectedDeliveryDate)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              <span>
                Approver: <strong>{po.approverName || "N/A"}</strong>
              </span>
            </div>
            {po.internalNotes && (
              <div className="flex items-start gap-2 mt-1">
                <Info size={14} className="text-slate-400 mt-0.5" />
                <span className="italic">{po.internalNotes}</span>
              </div>
            )}
          </div>

          <h4 className="font-semibold text-slate-700 mb-2 text-sm flex items-center gap-2">
            <Package size={16} /> Line Items
          </h4>
          <div className="space-y-3">
            {po.purchaseOrderLineItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 p-3 rounded text-sm border border-slate-200"
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-700">
                    {item.productName}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.lineTotal, po.currency)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                  <span>
                    Qty: {item.orderedQuantity || item.quantity}{" "}
                    {item.unitOfMeasure}
                  </span>
                  <span>
                    Price: {formatCurrency(item.unitPrice, po.currency)}
                  </span>
                  <span className="text-green-600">
                    Rec: {item.receivedQuantity || 0}
                  </span>
                  <span className="text-red-500">
                    Rej: {item.rejectedQuantity || 0}
                  </span>
                </div>
                {!po.isStaging && po.status !== "Closed" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRejectItem(item, po.id);
                    }}
                    className="mt-2 w-full py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
                  >
                    Manage Rejections
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Financial Summary (Mobile) */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-sm space-y-1 text-right">
            <div className="flex justify-between text-slate-500">
              <span>Shipping:</span>
              <span>{formatCurrency(po.shippingCost, po.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>VAT:</span>
              <span>{formatCurrency(po.vat, po.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>EWT:</span>
              <span>-{formatCurrency(po.ewt, po.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200 pt-1 mt-1">
              <span>Total:</span>
              <span>{formatCurrency(po.grandTotal, po.currency)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onPrint(po)}
              className="flex-1 py-2 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 flex items-center justify-center gap-2"
            >
              <Printer size={14} /> Print PO
            </button>

            {po.isStaging ? (
              <div className="flex gap-2">
                {/* Mobile Button for Post to Live */}
                <button
                  onClick={() => onFinalize(po.id)}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded text-xs font-medium shadow-sm"
                >
                  Post Live
                </button>
                <button
                  onClick={() => onEdit(po)}
                  className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded text-xs font-medium border border-indigo-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(po.id)}
                  className="flex-1 py-2 bg-red-50 text-red-600 rounded text-xs font-medium border border-red-200"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(po)}
                  className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded text-xs font-medium border border-indigo-200"
                >
                  Edit Order
                </button>
                <button
                  onClick={() => onDelete(po.id)}
                  className="flex-1 py-2 bg-red-50 text-red-600 rounded text-xs font-medium border border-red-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => onDevDelete(po.id)}
                  className="flex-1 py-2 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-200 flex items-center justify-center gap-1"
                >
                  <ShieldAlert size={14} /> Dev Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AllPurchaseOrders = () => {
  const [poData, setPoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [poToEdit, setPoToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPO, setExpandedPO] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("open");

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [itemToReject, setItemToReject] = useState({
    lineItem: null,
    headerId: null,
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [itemToView, setItemToView] = useState(null);

  const [printData, setPrintData] = useState(null);
  const printPORef = useRef();

  const handlePrintPO = useReactToPrint({
    content: () => printPORef.current,
    documentTitle: `PO_${printData?.poNumber || "Document"}`,
  });

  const triggerPrint = (po) => {
    setPrintData(po);
    setTimeout(() => {
      handlePrintPO();
    }, 300);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [liveResponse, stagingResponse] = await Promise.all([
        axios.get(`${domain}/api/PurchaseOrderHeaders`),
        axios.get(`${domain}/api/PurchaseOrderStaging`),
      ]);

      const liveOrders = liveResponse.data.map((po) => ({
        ...po,
        isStaging: false,
      }));

      const stagingOrders = stagingResponse.data.map((draft) => ({
        ...draft,
        poNumber: `TMP-${draft.id}`,
        isStaging: true,
        purchaseOrderLineItems: draft.purchaseOrderLineItems || [],
      }));

      const combinedData = [...stagingOrders, ...liveOrders].sort(
        (a, b) => b.id - a.id,
      );

      setPoData(combinedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch purchase orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openRejectModal = (item, headerId) => {
    setItemToReject({ lineItem: item, headerId: headerId });
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setItemToReject({ lineItem: null, headerId: null });
  };

  const openViewModal = (item) => {
    setItemToView(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setItemToView(null);
  };

  const handleRejectSubmit = async (totalRejectedQty, reason, image) => {
    if (!itemToReject.lineItem || !itemToReject.headerId) return;

    setLoading(true);
    try {
      const apiUrl = `${domain}/api/PurchaseOrderHeaders/${itemToReject.headerId}/lineitems/${itemToReject.lineItem.id}/reject`;
      const payload = {
        TotalRejectedQuantity: parseInt(totalRejectedQty),
        ReasonDescription: reason || "",
        ReasonImage: image || null,
      };

      await axios.post(apiUrl, payload);
      toast.success("Rejection status updated successfully!");
      closeRejectModal();
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update rejection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const finalizePurchaseOrder = async (id) => {
    if (
      !window.confirm("Are you sure you want to finalize this Purchase Order?")
    )
      return;
    setLoading(true);
    try {
      await axios.post(`${domain}/api/PurchaseOrderStaging/${id}/post-to-live`);
      toast.success("Purchase Order finalized and Posted to Live!");
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to finalize Purchase Order.",
      );
    } finally {
      setLoading(false);
    }
  };

  const deletePurchaseOrder = async (id) => {
    const targetPO = poData.find((p) => p.id === id);
    if (!targetPO) return;
    if (!window.confirm("Are you sure you want to delete this purchase order?"))
      return;

    try {
      const endpoint = targetPO.isStaging
        ? `${domain}/api/PurchaseOrderStaging/${id}`
        : `${domain}/api/PurchaseOrderHeaders/${id}`;

      await axios.delete(endpoint);
      toast.success("Purchase Order Deleted!");
      if (expandedPO === id) setExpandedPO(null);
      fetchData();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(
          error.response.data.message ||
            "Cannot delete: items have been received (GN exists).",
        );
      } else {
        toast.error("Failed to delete purchase order.");
      }
    }
  };

  const handleDeveloperDelete = async (id) => {
    if (
      !window.confirm(
        "⚠️ DEVELOPER DELETE WARNING ⚠️\n\nThis will permanently delete the PO AND ALL associated Goods Notes.\n\nAre you sure?",
      )
    )
      return;
    setLoading(true);
    try {
      await axios.delete(
        `${domain}/api/PurchaseOrderHeaders/developersDelete/${id}`,
      );
      toast.success("Developer Delete Successful: PO and GNs removed.");
      if (expandedPO === id) setExpandedPO(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Developer delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const tabFilteredPOs = poData.filter((po) => {
    if (activeTab === "temp") return po.isStaging;
    if (activeTab === "open") return !po.isStaging && po.status !== "Closed";
    if (activeTab === "closed") return !po.isStaging && po.status === "Closed";
    return false;
  });

  const filteredPOs = tabFilteredPOs.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPOs = filteredPOs.slice(indexOfFirstItem, indexOfLastItem);

  const openModal = (po = null) => {
    setPoToEdit(po);
    setIsModalVisible(true);
  };
  const closeModal = () => {
    setIsModalVisible(false);
    setPoToEdit(null);
  };
  const toggleExpandPO = (poId) =>
    setExpandedPO(expandedPO === poId ? null : poId);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-slate-100 text-slate-800 border-slate-200";
    const s = status.toLowerCase();
    if (s === "closed")
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (s.includes("draft")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
    if (s.includes("partially"))
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="bg-white border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" /> Purchase Orders
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your staging drafts and live purchase orders.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} /> New Draft PO
            </button>
          </div>

          <div className="flex gap-6 mt-6 border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => handleTabChange("temp")}
              className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === "temp" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Drafts (Staging)
            </button>
            <button
              onClick={() => handleTabChange("open")}
              className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === "open" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Clock size={16} /> Open Orders
            </button>
            <button
              onClick={() => handleTabChange("closed")}
              className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === "closed" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Archive size={16} /> Closed Orders
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PO Number or Vendor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="w-10 px-4 py-4"></th>
                    <th className="px-4 py-4">PO Number</th>
                    <th className="px-4 py-4">Vendor</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">Amount</th>
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPOs.map((po) => (
                    <React.Fragment key={po.id}>
                      <tr
                        onClick={() => toggleExpandPO(po.id)}
                        className={`hover:bg-slate-50 transition cursor-pointer ${expandedPO === po.id ? "bg-slate-50" : ""}`}
                      >
                        <td className="px-4 py-4 text-center">
                          {expandedPO === po.id ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {po.poNumber}
                          {po.isStaging && (
                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              DRAFT
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">{po.vendor}</td>
                        <td className="px-4 py-4">
                          {formatDate(po.creationDate)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(po.status)}`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-slate-900">
                          {formatCurrency(po.grandTotal, po.currency)}
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className="flex items-center justify-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* --- UPDATED: Button for Post to Live --- */}
                            {po.isStaging ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    finalizePurchaseOrder(po.id);
                                  }}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded shadow-sm transition-colors mr-2 font-medium"
                                  title="Finalize and Post to Live"
                                >
                                  <CheckCircle size={14} />
                                  Post to Live
                                </button>
                                <button
                                  onClick={() => triggerPrint(po)}
                                  title="Print PO"
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                                >
                                  <Printer size={18} />
                                </button>

                                <button
                                  onClick={() => openModal(po)}
                                  title="Edit"
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => deletePurchaseOrder(po.id)}
                                  title="Delete Draft"
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => triggerPrint(po)}
                                  title="Print PO"
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                                >
                                  <Printer size={18} />
                                </button>

                                <button
                                  onClick={() => openModal(po)}
                                  title="Edit Order"
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                                >
                                  <Edit size={18} />
                                </button>

                                <button
                                  onClick={() => deletePurchaseOrder(po.id)}
                                  title="Delete Order (Safe)"
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeveloperDelete(po.id)}
                                  title="Developer Delete"
                                  className="p-1.5 text-purple-700 hover:bg-purple-50 rounded transition"
                                >
                                  <ShieldAlert size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedPO === po.id && (
                        <tr>
                          <td
                            colSpan="7"
                            className="bg-slate-50 p-4 border-b border-slate-200 shadow-inner"
                          >
                            <div className="bg-white rounded border border-slate-200 p-6">
                              {/* Header Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div className="space-y-1">
                                  <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                                    <MapPin size={12} /> Location
                                  </span>
                                  <p className="text-sm font-medium text-slate-700">
                                    {po.location || "N/A"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                                    <Calendar size={12} /> Delivery Date
                                  </span>
                                  <p className="text-sm font-medium text-slate-700">
                                    {formatDate(po.expectedDeliveryDate)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                                    <User size={12} /> Approver
                                  </span>
                                  <p className="text-sm font-medium text-slate-700">
                                    {po.approverName || "N/A"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                                    <CreditCard size={12} /> Payment Terms
                                  </span>
                                  <p className="text-sm font-medium text-slate-700">
                                    {po.paymentTerms || "N/A"}
                                  </p>
                                </div>
                                {po.internalNotes && (
                                  <div className="col-span-1 md:col-span-4 bg-yellow-50 p-3 rounded border border-yellow-100 mt-2">
                                    <span className="text-xs text-yellow-600 font-bold uppercase block mb-1">
                                      Internal Notes
                                    </span>
                                    <p className="text-sm text-yellow-800">
                                      {po.internalNotes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Package size={16} /> Order Items
                              </h4>

                              <table className="w-full text-xs text-left text-slate-600 mb-6">
                                <thead className="bg-slate-100 text-slate-500 uppercase font-medium">
                                  <tr>
                                    <th className="px-3 py-2">Product</th>
                                    <th className="px-3 py-2">Quantity</th>
                                    <th className="px-3 py-2 text-right">
                                      Unit Price
                                    </th>
                                    {!po.isStaging && (
                                      <>
                                        <th className="px-3 py-2 text-green-600 text-center">
                                          Received
                                        </th>
                                        <th className="px-3 py-2 text-red-600 text-center">
                                          Rejected
                                        </th>
                                      </>
                                    )}
                                    <th className="px-3 py-2 text-right">
                                      Line Total
                                    </th>
                                    {!po.isStaging && (
                                      <th className="px-3 py-2 text-center">
                                        Action
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {po.purchaseOrderLineItems.map((item) => (
                                    <tr
                                      key={item.id}
                                      className="hover:bg-slate-50"
                                    >
                                      <td className="px-3 py-2 font-medium">
                                        {item.productName}
                                      </td>
                                      <td className="px-3 py-2">
                                        {item.orderedQuantity || item.quantity}{" "}
                                        {item.unitOfMeasure}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {formatCurrency(
                                          item.unitPrice,
                                          po.currency,
                                        )}
                                      </td>
                                      {!po.isStaging && (
                                        <>
                                          <td className="px-3 py-2 text-green-600 text-center font-bold">
                                            {item.receivedQuantity || 0}
                                          </td>
                                          <td className="px-3 py-2 text-red-600 text-center font-bold">
                                            {item.rejectedQuantity || 0}
                                          </td>
                                        </>
                                      )}
                                      <td className="px-3 py-2 text-right font-medium">
                                        {formatCurrency(
                                          item.lineTotal,
                                          po.currency,
                                        )}
                                      </td>
                                      {!po.isStaging && (
                                        <td className="px-3 py-2 text-center">
                                          <div className="flex items-center justify-center gap-2">
                                            {item.rejectedQuantity > 0 && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openViewModal(item);
                                                }}
                                                title="View"
                                                className="text-blue-600 hover:text-blue-800"
                                              >
                                                <Eye size={16} />
                                              </button>
                                            )}
                                            {po.status !== "Closed" && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openRejectModal(item, po.id);
                                                }}
                                                className="text-red-600 hover:underline"
                                              >
                                                Rejection
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* Financial Summary Section */}
                              <div className="flex justify-end">
                                <div className="w-full md:w-1/3 bg-slate-50 p-4 rounded border border-slate-100">
                                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                                    <span>Shipping Cost:</span>
                                    <span>
                                      {formatCurrency(
                                        po.shippingCost,
                                        po.currency,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                                    <span>VAT:</span>
                                    <span>
                                      {formatCurrency(po.vat, po.currency)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                                    <span>EWT (Withholding):</span>
                                    <span className="text-red-500">
                                      -{formatCurrency(po.ewt, po.currency)}
                                    </span>
                                  </div>
                                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-base font-bold text-slate-800">
                                    <span>Grand Total:</span>
                                    <span>
                                      {formatCurrency(
                                        po.grandTotal,
                                        po.currency,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {currentPOs.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-10 text-center text-slate-400 flex flex-col items-center justify-center"
                      >
                        <AlertCircle size={40} className="mb-2 opacity-50" />
                        No{" "}
                        {activeTab === "temp"
                          ? "drafts"
                          : activeTab === "closed"
                            ? "closed orders"
                            : "open orders"}{" "}
                        found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              {currentPOs.map((po) => (
                <MobilePOCard
                  key={po.id}
                  po={po}
                  expanded={expandedPO === po.id}
                  onToggle={toggleExpandPO}
                  onEdit={openModal}
                  onDelete={deletePurchaseOrder}
                  onDevDelete={handleDeveloperDelete}
                  onFinalize={finalizePurchaseOrder}
                  onRejectItem={openRejectModal}
                  onPrint={triggerPrint}
                  getStatusColor={getStatusColor}
                />
              ))}
              {currentPOs.length === 0 && (
                <div className="text-center text-slate-400 py-10">
                  No orders found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredPOs.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ display: "none" }}>
        <PrintPurchaseOrder ref={printPORef} po={printData} />
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <AddPurchaseOrder
              onClose={closeModal}
              refreshData={fetchData}
              poToEdit={poToEdit}
            />
          </div>
        </div>
      )}

      <RejectItemModal
        isOpen={isRejectModalOpen}
        onClose={closeRejectModal}
        onSubmit={handleRejectSubmit}
        lineItem={itemToReject.lineItem}
      />
      <ViewRejectionModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        lineItem={itemToView}
      />
    </div>
  );
};

export default AllPurchaseOrders;
