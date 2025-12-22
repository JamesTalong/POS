// src/components/YourModule/GoodsReceiptModule/AllGoodsReceipts.jsx

import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Package,
  Calendar,
  User,
  AlertCircle,
  Truck,
  CheckCircle,
  Eye, // Added Icon
} from "lucide-react";

import Loader from "../../../loader/Loader";
import Pagination from "../../Pagination";
import AddGoodsReceipt from "./AddGoodsReceipt";
import SerialNumberModal from "./SerialNumberModal"; // Import the new component
import { domain } from "../../../../security";
import { useSelector } from "react-redux";
import { selectFullName } from "../../../../redux/IchthusSlice";

// --- Mobile Card Component ---
// Added onViewSerials prop
const MobileGRCard = ({ gr, expanded, onToggle, onDelete, onViewSerials }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => onToggle(gr.id)}
      >
        <div className="flex gap-3">
          <div className="mt-1 text-indigo-600">
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {gr.receiptNumber}
              </span>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <Truck size={14} /> PO: {gr.poNumber || "N/A"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(gr.receiptDate).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            Completed
          </span>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-end gap-1">
            <User size={12} /> {gr.receivedBy}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="font-semibold text-slate-700 mb-2 text-sm flex items-center gap-2">
            <Package size={16} /> Received Items
          </h4>
          <div className="space-y-3">
            {gr.goodsReceiptLines && gr.goodsReceiptLines.length > 0 ? (
              gr.goodsReceiptLines.map((item) => {
                const serialsToDisplay =
                  item.receiptSerialNumbers || item.serialNumbers || [];
                const productName =
                  item.product?.productName ||
                  item.productName ||
                  "Unknown Item";

                return (
                  <div
                    key={item.id}
                    className="bg-slate-50 p-3 rounded text-sm border border-slate-200"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-slate-700">
                        {productName}
                      </span>
                      <span className="font-bold text-indigo-600">
                        Qty: {item.quantityReceived}
                      </span>
                    </div>

                    {/* Button to view serials instead of badges */}
                    {serialsToDisplay.length > 0 ? (
                      <button
                        onClick={() =>
                          onViewSerials(serialsToDisplay, productName)
                        }
                        className="mt-2 w-full py-1.5 px-3 bg-white border border-indigo-200 text-indigo-600 rounded text-xs font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={12} /> View {serialsToDisplay.length} Serial
                        Numbers
                      </button>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        No serials recorded
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic">No lines found.</p>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onDelete(gr.id)}
              className="flex-1 py-2 bg-red-50 text-red-600 rounded text-xs font-medium border border-red-200 flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Delete Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AllGoodsReceipts = () => {
  const [grData, setGrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGR, setExpandedGR] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all");

  // --- New State for Serial Number Modal ---
  const [serialModalData, setSerialModalData] = useState({
    isOpen: false,
    serials: [],
    productName: "",
  });

  const fullName = useSelector(selectFullName);

  // --- Fetch Logic ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${domain}/api/GoodsReceipts`);

      const sortedData = response.data.sort(
        (a, b) => new Date(b.receiptDate) - new Date(a.receiptDate)
      );

      const normalizedData = sortedData.map((gr) => ({
        ...gr,
        goodsReceiptLines: (gr.lines || gr.goodsReceiptLines || []).map(
          (line) => ({
            ...line,
            receiptSerialNumbers: line.receiptSerialNumbers || [],
            serialNumbers: line.serialNumbers || [],
            productName: line.product
              ? line.product.productName
              : line.productName,
          })
        ),
      }));

      setGrData(normalizedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch goods receipts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Delete Logic ---
  const deleteGoodsReceipt = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this Goods Receipt? \n\nThis will reverse the inventory stock."
      )
    ) {
      return;
    }
    try {
      await axios.delete(`${domain}/api/GoodsReceipts/${id}`);
      toast.success("Goods Receipt deleted successfully.");
      if (expandedGR === id) setExpandedGR(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete receipt.");
    }
  };

  // --- Serial Modal Handlers ---
  const openSerialModal = (serials, productName) => {
    setSerialModalData({
      isOpen: true,
      serials: serials,
      productName: productName,
    });
  };

  const closeSerialModal = () => {
    setSerialModalData((prev) => ({ ...prev, isOpen: false }));
  };

  // --- Filtering & Pagination ---
  const tabFilteredGRs = grData.filter((gr) => {
    if (activeTab === "my") {
      return gr.receivedBy?.toLowerCase() === fullName?.toLowerCase();
    }
    return true;
  });

  const filteredGRs = tabFilteredGRs.filter(
    (gr) =>
      (gr.receiptNumber?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (gr.poNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (gr.receivedBy?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGRs = filteredGRs.slice(indexOfFirstItem, indexOfLastItem);

  // --- Handlers ---
  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const toggleExpandGR = (id) => {
    setExpandedGR(expandedGR === id ? null : id);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Header --- */}
      <div className="bg-white border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" /> Goods Receipts
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track received inventory, serial numbers, and PO fulfillment.
              </p>
            </div>
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} /> New Receipt
            </button>
          </div>

          <div className="flex gap-6 mt-6 border-b border-slate-200">
            <button
              onClick={() => handleTabChange("all")}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === "all"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All Receipts
            </button>
            <button
              onClick={() => handleTabChange("my")}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === "my"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              My Receipts
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Receipt #, PO #, or Receiver..."
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
            {/* --- Desktop Table --- */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="w-10 px-4 py-4"></th>
                    <th className="px-4 py-4">Receipt #</th>
                    <th className="px-4 py-4">PO Reference</th>
                    <th className="px-4 py-4">Date Received</th>
                    <th className="px-4 py-4">Received By</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentGRs.map((gr) => (
                    <React.Fragment key={gr.id}>
                      <tr
                        onClick={() => toggleExpandGR(gr.id)}
                        className={`hover:bg-slate-50 transition cursor-pointer ${
                          expandedGR === gr.id ? "bg-slate-50" : ""
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          {expandedGR === gr.id ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {gr.receiptNumber}
                        </td>
                        <td className="px-4 py-4 text-indigo-600 font-medium">
                          {gr.poNumber || "N/A"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(gr.receiptDate).toLocaleDateString()}
                            <span className="text-xs text-slate-400">
                              {new Date(gr.receiptDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                              {gr.receivedBy
                                ? gr.receivedBy.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            {gr.receivedBy}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle size={10} /> Completed
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className="flex items-center justify-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => deleteGoodsReceipt(gr.id)}
                              title="Delete Receipt"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition border border-transparent hover:border-red-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* --- Expanded Details --- */}
                      {expandedGR === gr.id && (
                        <tr>
                          <td
                            colSpan="7"
                            className="bg-slate-50 p-4 border-b border-slate-200 shadow-inner"
                          >
                            <div className="bg-white rounded border border-slate-200 p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                  <Package
                                    size={16}
                                    className="text-indigo-600"
                                  />{" "}
                                  Received Line Items
                                </h4>
                                {gr.notes && (
                                  <span className="text-xs text-slate-500 italic bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                                    Note: {gr.notes}
                                  </span>
                                )}
                              </div>

                              <table className="w-full text-xs text-left text-slate-600">
                                <thead className="bg-slate-100 text-slate-500 uppercase font-medium">
                                  <tr>
                                    <th className="px-3 py-2">Product Name</th>
                                    <th className="px-3 py-2 text-center">
                                      Quantity Received
                                    </th>
                                    <th className="px-3 py-2">
                                      Serial Numbers
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {gr.goodsReceiptLines.map((item, idx) => {
                                    const serialsToDisplay =
                                      item.receiptSerialNumbers ||
                                      item.serialNumbers ||
                                      [];
                                    const productName =
                                      item.product?.productName ||
                                      item.productName ||
                                      "Unknown Item";

                                    return (
                                      <tr
                                        key={item.id || idx}
                                        className="hover:bg-slate-50"
                                      >
                                        <td className="px-3 py-2 font-medium text-slate-700">
                                          {productName}
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-indigo-600 text-sm">
                                          {item.quantityReceived}
                                        </td>
                                        <td className="px-3 py-2">
                                          {serialsToDisplay.length > 0 ? (
                                            <button
                                              onClick={() =>
                                                openSerialModal(
                                                  serialsToDisplay,
                                                  productName
                                                )
                                              }
                                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded shadow-sm hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition-all text-xs font-medium"
                                            >
                                              <Eye size={12} />
                                              View {
                                                serialsToDisplay.length
                                              }{" "}
                                              Serials
                                            </button>
                                          ) : (
                                            <span className="text-slate-400 italic">
                                              No serials required
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Empty state ... */}
                  {currentGRs.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-10 text-slate-400"
                      >
                        No receipts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- Mobile View --- */}
            <div className="md:hidden">
              {currentGRs.length > 0 ? (
                currentGRs.map((gr) => (
                  <MobileGRCard
                    key={gr.id}
                    gr={gr}
                    expanded={expandedGR === gr.id}
                    onToggle={toggleExpandGR}
                    onDelete={deleteGoodsReceipt}
                    onViewSerials={openSerialModal} // Pass function here
                  />
                ))
              ) : (
                <div className="text-center py-10 text-slate-400">
                  No goods receipts found.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredGRs.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Add Receipt Modal (Original) --- */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <AddGoodsReceipt onClose={closeModal} refreshData={fetchData} />
          </div>
        </div>
      )}

      {/* --- Serial Number Modal (New) --- */}
      <SerialNumberModal
        isOpen={serialModalData.isOpen}
        onClose={closeSerialModal}
        serialNumbers={serialModalData.serials}
        productName={serialModalData.productName}
      />
    </div>
  );
};

export default AllGoodsReceipts;
