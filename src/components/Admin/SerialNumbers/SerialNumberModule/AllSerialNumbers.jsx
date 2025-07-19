import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  BarChart2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Package,
  Hash,
  Info,
  AlertTriangle,
} from "lucide-react";

// Keep your existing components
import Loader from "../../../loader/Loader";
import AddSerialNumber from "./AddSerialNumber";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Import the new card component for mobile view
import SerialCard from "./SerialCard";

const AllSerialNumbers = () => {
  // ... (All your existing state and functions remain exactly the same)
  // [useState, useCallback, useEffect, fetchData, etc.]
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [serialToEdit, setSerialToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filteredSerials, setFilteredSerials] = useState([]);
  const [batchOrProductSearch, setBatchOrProductSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/SerialNumbers`);
      setSerialNumbers(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch serial numbers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let results = serialNumbers.filter((item) => {
      const serialMatch = (item.serialName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const batchMatch = String(item.batchId || "")
        .toLowerCase()
        .includes(batchOrProductSearch.toLowerCase());
      const productMatch = (item.pricelistProduct?.productName || "")
        .toLowerCase()
        .includes(batchOrProductSearch.toLowerCase());
      return (
        serialMatch &&
        (batchOrProductSearch === "" || batchMatch || productMatch)
      );
    });

    if (filterStatus === "sold") {
      results = results.filter((item) => item.isSold);
    } else if (filterStatus === "unsold") {
      results = results.filter((item) => !item.isSold);
    }

    setFilteredSerials(results);
    setCurrentPage(1);
  }, [searchTerm, batchOrProductSearch, filterStatus, serialNumbers]);

  const openModal = (serial = null) => {
    setSerialToEdit(serial);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSerialToEdit(null);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSerials = filteredSerials.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalSold = serialNumbers.filter((item) => item.isSold).length;
  const totalUnsold = serialNumbers.length - totalSold;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <div className="max-w-7xl mx-auto">
        {/* --- Header & Title --- */}
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Serial Numbers Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, and view the status of all serial numbers.
        </p>

        {/* --- Stats Cards --- */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-100 text-blue-800 rounded-xl p-4 flex items-start gap-4">
            <div className="bg-blue-200 p-2 rounded-lg">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Total Serials</p>
              <p className="text-2xl font-bold">{serialNumbers.length}</p>
            </div>
          </div>
          <div className="bg-green-100 text-green-800 rounded-xl p-4 flex items-start gap-4">
            <div className="bg-green-200 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Sold</p>
              <p className="text-2xl font-bold">{totalSold}</p>
            </div>
          </div>
          <div className="bg-red-100 text-red-800 rounded-xl p-4 flex items-start gap-4">
            <div className="bg-red-200 p-2 rounded-lg">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Available</p>
              <p className="text-2xl font-bold">{totalUnsold}</p>
            </div>
          </div>
        </div>

        {/* --- Search & Filter Controls --- */}
        <div className="mt-6 p-4 bg-white rounded-xl shadow-sm ring-1 ring-slate-200/50 grid md:grid-cols-3 gap-4 items-center">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Serial..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative md:col-span-1">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product or Batch..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={batchOrProductSearch}
              onChange={(e) => setBatchOrProductSearch(e.target.value)}
            />
          </div>
          <div className="relative md:col-span-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="sold">Sold</option>
              <option value="unsold">Available</option>
            </select>
          </div>
        </div>

        {/* --- Search Results Info Bar --- */}
        {(batchOrProductSearch || searchTerm) && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm ${
              filteredSerials.length > 0
                ? "bg-indigo-50 text-indigo-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {filteredSerials.length > 0 ? (
              <Info size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>
              {filteredSerials.length > 0
                ? `Found ${filteredSerials.length} match${
                    filteredSerials.length > 1 ? "es" : ""
                  }.`
                : `No results found for your search.`}
            </span>
          </div>
        )}

        {/* --- Content Area --- */}
        <div className="mt-6">
          {loading ? (
            <Loader />
          ) : (
            <>
              {/* ---------------------------------- */}
              {/* ---- DESKTOP VIEW: TABLE ---- */}
              {/* ---------------------------------- */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                      <th className="px-6 py-3">Serial Number</th>
                      <th className="px-6 py-3">Product Name</th>
                      <th className="px-6 py-3">Batch ID</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSerials.map((item) => (
                      <tr
                        key={item.id}
                        className="bg-white border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 font-mono">
                          {item.serialName}
                        </td>
                        <td className="px-6 py-4">
                          {item.pricelistProduct?.productName || "N/A"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {item.batchId || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.isSold
                                ? "bg-slate-100 text-slate-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.isSold ? "Sold" : "Available"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ---------------------------------- */}
              {/* ---- MOBILE VIEW: CARDS ---- */}
              {/* ---------------------------------- */}
              <div className="grid grid-cols-1 gap-5 md:hidden">
                {currentSerials.map((item) => (
                  <SerialCard key={item.id} serial={item} onEdit={openModal} />
                ))}
              </div>

              {/* Pagination Component */}
              {filteredSerials.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredSerials.length}
                    currentPage={currentPage}
                    paginate={paginate}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto w-[90vw] max-w-lg">
            <AddSerialNumber
              onClose={closeModal}
              refreshData={fetchData}
              serialToEdit={serialToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSerialNumbers;
