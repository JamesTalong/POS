import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  ShoppingCart,
  Search,
  BarChart2,
  CheckCircle,
  XCircle,
  FileText,
  Truck,
  Trash2,
  Ban,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Import the custom Modal component
import RevertTransactionModal from "../../Transactions/Modals/RevertTransactionModal";

// Helper for Status Colors
const getStatusBadge = (status) => {
  switch (status) {
    case "Approved":
      return (
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
          <CheckCircle size={12} /> Approved
        </span>
      );
    case "Voided":
      return (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
          <XCircle size={12} /> Voided
        </span>
      );
    case "Converted":
      return (
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
          <FileText size={12} /> Converted
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

const AllSalesOrders = () => {
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedOrderToVoid, setSelectedOrderToVoid] = useState(null);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}/api/SalesOrders`);
      setOrderData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch Sales Orders.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering
  useEffect(() => {
    const results = orderData.filter(
      (order) =>
        order.salesOrderNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(results);
    setCurrentPage(1);
  }, [searchTerm, orderData]);

  // --- ACTIONS ---

  // 1. GENERATE DELIVERY ORDER
  const handleGenerateDO = async (order) => {
    if (order.isVoid) {
      toast.error("Cannot generate Delivery Order for a voided Sales Order.");
      return;
    }

    if (order.status === "Shipped") {
      toast.warning("Delivery Order has already been generated for this SO.");
      return;
    }

    if (
      !window.confirm(
        `Generate Delivery Order for ${order.salesOrderNumber}? This will mark the order as Shipped.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${domain}/api/DeliveryOrders/generate-from-so/${order.id}`
      );

      toast.success(`Success! Generated: ${response.data.doNumber}`);

      // Refresh the list to show the "Shipped" status
      await fetchData();
    } catch (error) {
      console.error("Error generating DO:", error);
      toast.error(error.response?.data || "Failed to generate Delivery Order.");
    } finally {
      setLoading(false);
    }
  };

  // 2. VOID ORDER - Open Modal
  const openVoidModal = (order) => {
    if (order.isVoid) {
      toast.info("Order is already voided.");
      return;
    }
    setSelectedOrderToVoid(order);
    setIsVoidModalOpen(true);
  };

  // 3. CONFIRM VOID - Called by Modal
  const handleConfirmVoid = async (transactionId, returnCondition) => {
    try {
      const payload = {
        returnCondition: returnCondition,
        voidBy: "Admin",
      };

      const res = await axios.post(
        `${domain}/api/SalesOrders/revert/${transactionId}`,
        payload
      );

      toast.success(
        `Order Voided. ${res.data.revertedSerialsCount} serials returned.`
      );

      // Refresh data
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to revert Order.");
    }
  };

  // 4. DELETE ORDER
  const deleteOrder = async (id, status) => {
    if (status === "Shipped") {
      toast.warning("Cannot delete a Shipped order.");
      return;
    }
    if (
      !window.confirm("Are you sure you want to PERMANENTLY delete this order?")
    )
      return;

    try {
      await axios.delete(`${domain}/api/SalesOrders/${id}`);
      toast.success("Sales Order Deleted!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete Order.");
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen pb-12 relative">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Integrate the Void Modal */}
      <RevertTransactionModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        onConfirm={handleConfirmVoid}
        transactionId={selectedOrderToVoid?.id}
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="text-indigo-600" /> Sales Orders
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage orders, inventory allocation, and returns.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-800">
                {orderData.length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Value</p>
              <p className="text-2xl font-bold text-slate-800">
                ₱
                {orderData
                  .filter((x) => !x.isVoid)
                  .reduce((acc, curr) => acc + curr.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order # or Customer Name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.salesOrderNumber}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{item.customerName}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium">
                        ₱{item.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(item.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                          {/* 1. Generate Delivery Order */}
                          {!item.isVoid && (
                            <button
                              onClick={() => handleGenerateDO(item)}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Generate Delivery Order"
                            >
                              <Truck size={18} />
                            </button>
                          )}

                          {/* 2. Void (Revert) - Triggers Modal */}
                          {!item.isVoid ? (
                            <button
                              onClick={() => openVoidModal(item)}
                              className="text-slate-400 hover:text-orange-600 transition-colors"
                              title="Void Order"
                            >
                              <Ban size={18} />
                            </button>
                          ) : (
                            <span className="text-xs text-red-300 font-bold cursor-not-allowed">
                              VOID
                            </span>
                          )}

                          {/* 3. Delete */}
                          {/* <button
                            onClick={() => deleteOrder(item.id, item.status)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 size={18} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-lg shadow border border-slate-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">
                      {item.salesOrderNumber}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-slate-600 text-sm mb-1">
                    {item.customerName}
                  </p>
                  <p className="text-slate-800 font-bold mb-3">
                    ₱{item.totalAmount.toFixed(2)}
                  </p>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-between border-t pt-3 mt-2">
                    {!item.isVoid && (
                      <button
                        onClick={() => handleGenerateDO(item)}
                        className="text-slate-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1"
                      >
                        <Truck size={16} /> DO
                      </button>
                    )}

                    {!item.isVoid ? (
                      <button
                        onClick={() => openVoidModal(item)}
                        className="text-slate-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1"
                      >
                        <Ban size={16} /> Void
                      </button>
                    ) : (
                      <span className="text-slate-300 text-sm">Voided</span>
                    )}

                    {/* <button
                      onClick={() => deleteOrder(item.id, item.status)}
                      className="text-slate-500 hover:text-red-600 font-medium text-sm flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button> */}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredOrders.length}
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

export default AllSalesOrders;
