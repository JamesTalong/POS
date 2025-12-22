import React, { useCallback, useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import {
  FileText,
  Search,
  XCircle,
  BarChart2,
  User,
  Calendar,
  DollarSign,
  Printer,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddSalesOrder from "../../SalesOrders/SalesOrderModule/AddSalesOrder";
import Pagination from "../../Pagination";

import { domain } from "../../../../security";
import SalesQuotationPrint from "../../POS/SalesQuotationPrint";

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

// Helper to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

// --- COMPONENT: Status Badge ---
const StatusBadge = ({ status }) => {
  const currentStatus = status || "Open";

  let styles = "bg-blue-100 text-blue-700";
  let icon = <FileText size={12} />;

  if (currentStatus === "Converted") {
    styles = "bg-green-100 text-green-700";
    icon = <CheckCircle size={12} />;
  } else if (currentStatus === "Cancelled") {
    styles = "bg-red-100 text-red-700";
    icon = <AlertCircle size={12} />;
  }

  return (
    <span
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold uppercase ${styles}`}
    >
      {icon} {currentStatus}
    </span>
  );
};

// --- COMPONENT: Mobile Card View ---
const QuotationCard = ({ quote, onCancel, onPrint, onConvertToOrder }) => {
  // Logic: Lock actions specifically for Editing/Canceling, but NOT printing
  const isLocked = quote.status === "Converted" || quote.status === "Cancelled";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <FileText size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-lg block">
              {quote.quoteNumber}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={12} /> {formatDate(quote.date)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
            {formatCurrency(quote.totalAmount)}
          </span>
          <StatusBadge status={quote.status} />
        </div>
      </div>

      <div className="mb-3 text-sm text-slate-600 space-y-1">
        <div className="flex items-center gap-2">
          <User size={14} className="text-slate-400" />
          <span className="font-medium">
            {quote.customer?.customerName || "Unknown Customer"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
        {/* Convert to Order Button - Keep Hidden if Locked */}
        {!isLocked && (
          <button
            onClick={() => onConvertToOrder(quote)}
            className="flex-1 py-2 border border-blue-100 text-blue-600 rounded hover:bg-blue-50 text-sm font-medium flex justify-center items-center gap-2"
          >
            <ShoppingCart size={16} /> Order
          </button>
        )}

        {/* Print Button - ALWAYS VISIBLE NOW */}
        <button
          onClick={() => onPrint(quote)}
          className="flex-1 py-2 border border-orange-100 text-orange-600 rounded hover:bg-orange-50 text-sm font-medium flex justify-center items-center gap-2"
        >
          <Printer size={16} /> Print
        </button>

        {/* Cancel Button - Keep Hidden if Locked */}
        {!isLocked && (
          <button
            onClick={() => onCancel(quote.id)}
            className="flex-1 py-2 border border-red-100 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex justify-center items-center gap-2"
          >
            <XCircle size={16} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const AllSalesQuotations = () => {
  const [quotationData, setQuotationData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedQuoteForOrder, setSelectedQuoteForOrder] = useState(null);

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuotes, setFilteredQuotes] = useState([]);

  // Printing State
  const [quotePrintData, setQuotePrintData] = useState(null);
  const quotePrintRef = useRef();

  const handlePrintAction = useReactToPrint({
    content: () => quotePrintRef.current,
    documentTitle: "Sales Quotation",
  });

  const handlePrintClick = (quote) => {
    // REMOVED THE IF STATEMENT THAT BLOCKED PRINTING BASED ON STATUS
    setQuotePrintData(quote);
    setTimeout(() => {
      handlePrintAction();
    }, 200);
  };

  const totalAmount = quotationData.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0
  );

  // --- API CALLS ---
  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/SalesQuotations`;
    try {
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setQuotationData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Sales Quotations.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = quotationData.filter((q) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        q.quoteNumber?.toLowerCase().includes(searchLower) ||
        q.customer?.customerName?.toLowerCase().includes(searchLower) ||
        q.fullName?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredQuotes(results);
    setCurrentPage(1);
  }, [searchTerm, quotationData]);

  // --- CANCEL QUOTATION LOGIC ---
  const cancelQuotation = async (id) => {
    const confirmMsg =
      "Are you sure you want to CANCEL this quotation? This action cannot be undone.";
    if (!window.confirm(confirmMsg)) {
      return;
    }

    const apiUrl = `${domain}/api/SalesQuotations/cancel/${id}`;
    try {
      await axios.put(
        apiUrl,
        {},
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Quotation Cancelled Successfully!");
      fetchData();
    } catch (error) {
      console.error("Error cancelling quotation:", error);
      toast.error(
        error.response?.data?.message || "Failed to cancel Quotation."
      );
    }
  };

  // --- OPEN ORDER MODAL LOGIC ---
  const openOrderModal = (quote) => {
    if (quote.status === "Converted") {
      toast.info("This quotation has already been converted to an Order.");
      return;
    }
    if (quote.status === "Cancelled") {
      toast.error("Cannot process a Cancelled quotation.");
      return;
    }
    setSelectedQuoteForOrder(quote);
    setIsOrderModalVisible(true);
  };

  const closeOrderModal = () => {
    setIsOrderModalVisible(false);
    setSelectedQuoteForOrder(null);
  };

  // --- PAGINATION HELPERS ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* PAGE HEADER */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" /> Sales Quotations
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage customer quotations and pricing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart2 />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Quotes</p>
              <p className="text-2xl font-bold text-slate-800">
                {quotationData.length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <DollarSign />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-2 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Quote # or Customer Name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Quote #</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => {
                    const isLocked =
                      item.status === "Converted" ||
                      item.status === "Cancelled";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.quoteNumber}
                        </td>
                        <td className="px-6 py-4">{formatDate(item.date)}</td>
                        <td className="px-6 py-4">
                          {item.customer?.customerName}
                        </td>
                        <td className="px-6 py-4">{item.locationName}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Convert Button - Keep Locked logic */}
                            {!isLocked && (
                              <button
                                onClick={() => openOrderModal(item)}
                                title="Convert to Sales Order"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <ShoppingCart size={18} />
                              </button>
                            )}

                            {/* Print Button - UNLOCKED (Visible for all statuses) */}
                            <button
                              onClick={() => handlePrintClick(item)}
                              title="Print Quotation"
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            >
                              <Printer size={18} />
                            </button>

                            {/* CANCEL Button - Keep Locked logic */}
                            {!isLocked && (
                              <button
                                onClick={() => cancelQuotation(item.id)}
                                title="Cancel Quotation"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {currentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        No quotations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentItems.map((item) => (
                <QuotationCard
                  key={item.id}
                  quote={item}
                  onCancel={cancelQuotation}
                  onPrint={handlePrintClick}
                  onConvertToOrder={openOrderModal}
                />
              ))}
            </div>

            {/* PAGINATION */}
            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredQuotes.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* SALES ORDER CONVERSION MODAL */}
      {isOrderModalVisible && (
        <AddSalesOrder
          onClose={closeOrderModal}
          sourceQuote={selectedQuoteForOrder}
          refreshData={fetchData}
        />
      )}

      {/* PRINT COMPONENT (HIDDEN) */}
      <div style={{ display: "none" }}>
        <SalesQuotationPrint ref={quotePrintRef} data={quotePrintData} />
      </div>
    </div>
  );
};

export default AllSalesQuotations;
