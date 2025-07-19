import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Search, MapPin } from "lucide-react";

// Keep your existing components
import Loader from "../../../loader/Loader";
import AllSerial from "./AllSerial";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Import the new card component
import InventoryCard from "./InventoryCard";

const AllInventory = () => {
  const [priceListData, setPriceListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [currentPage, setCurrentPage] = useState(1);
  const [popupData, setPopupData] = useState({ visible: false, serials: [] });
  const itemsPerPage = 10; // Adjusted for better viewing on most screens

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/Pricelists`);
      setPriceListData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch pricelists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());
  const handleLocationChange = (e) => setSelectedLocation(e.target.value);
  const handleDateChange = (key, value) =>
    setSelectedDates((prev) => ({ ...prev, [key]: value }));
  const handleShowPopup = (serials) => setPopupData({ visible: true, serials });
  const handleClosePopup = () => setPopupData({ visible: false, serials: [] });
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatus = (sold, unsold) => {
    if (unsold === 0 && sold > 0) return "Out of Stock";
    if (unsold === 0 && sold === 0) return "No Stock";
    if (unsold / (sold + unsold) >= 0.5) return "Good";
    return "Needs Restock";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Out of Stock":
        return "bg-red-100 text-red-800";
      case "Good":
        return "bg-green-100 text-green-800";
      case "Needs Restock":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColorMobile = (status) => {
    switch (status) {
      case "Out of Stock":
        return "bg-red-500 text-white";
      case "Good":
        return "bg-green-500 text-white";
      case "Needs Restock":
        return "bg-yellow-400 text-black";
      default:
        return "bg-slate-400 text-white";
    }
  };

  const uniqueLocations = [
    "All Locations",
    ...new Set(priceListData.map((item) => item.location)),
  ];

  const filteredData = priceListData.filter(
    (item) =>
      item.product.toLowerCase().includes(searchTerm) &&
      (selectedLocation === "All Locations" ||
        item.location === selectedLocation)
  );

  // Calculate totals for Unsold, Sold, and Total across filtered data
  const totalUnsold = filteredData.reduce((sum, item) => {
    const selectedDate = selectedDates[item.id] || "All Dates";
    const filteredBatches =
      selectedDate === "All Dates"
        ? item.batches
        : item.batches.filter((b) => b.batchDate.startsWith(selectedDate));
    const unsoldCount = filteredBatches
      .flatMap((b) => b.serialNumbers)
      .filter((s) => !s.isSold).length;
    return sum + unsoldCount;
  }, 0);

  const totalSold = filteredData.reduce((sum, item) => {
    const selectedDate = selectedDates[item.id] || "All Dates";
    const filteredBatches =
      selectedDate === "All Dates"
        ? item.batches
        : item.batches.filter((b) => b.batchDate.startsWith(selectedDate));
    const soldCount = filteredBatches
      .flatMap((b) => b.serialNumbers)
      .filter((s) => s.isSold).length;
    return sum + soldCount;
  }, 0);

  const grandTotal = totalUnsold + totalSold;

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          Inventory Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track stock levels, filter by date, and view serial numbers.
        </p>

        {/* --- Unsold, Sold, Total Summary --- */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-blue-700">Total Unsold</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {totalUnsold}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-green-700">Total Sold</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {totalSold}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-purple-700">Grand Total</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {grandTotal}
            </p>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by product name..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3 w-48">Filter by Batch Date</th>
                      <th className="px-6 py-3 text-center">Sold</th>
                      <th className="px-6 py-3 text-center">Available</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedData.map((item) => {
                      const key = item.id;
                      const uniqueDates = [
                        "All Dates",
                        ...[
                          ...new Set(
                            item.batches.map((b) => b.batchDate.split("T")[0])
                          ),
                        ].sort(),
                      ];
                      const selectedDate = selectedDates[key] || "All Dates";
                      const filteredBatches =
                        selectedDate === "All Dates"
                          ? item.batches
                          : item.batches.filter((b) =>
                              b.batchDate.startsWith(selectedDate)
                            );
                      const soldSerials = filteredBatches
                        .flatMap((b) => b.serialNumbers)
                        .filter((s) => s.isSold);
                      const unsoldSerials = filteredBatches
                        .flatMap((b) => b.serialNumbers)
                        .filter((s) => !s.isSold);
                      const status = getStatus(
                        soldSerials.length,
                        unsoldSerials.length
                      );

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {item.product}
                          </td>
                          <td className="px-6 py-4">{item.location}</td>
                          <td className="px-6 py-4">
                            <select
                              className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500"
                              value={selectedDate}
                              onChange={(e) =>
                                handleDateChange(key, e.target.value)
                              }
                            >
                              {uniqueDates.map((date, idx) => (
                                <option key={idx} value={date}>
                                  {date}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleShowPopup(soldSerials)}
                              className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              {soldSerials.length}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleShowPopup(unsoldSerials)}
                              className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              {unsoldSerials.length}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ---------------------------------- */}
              {/* ---- MOBILE VIEW: CARDS ---- */}
              {/* ---------------------------------- */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {paginatedData.map((item) => {
                  const key = item.id;
                  const uniqueDates = [
                    "All Dates",
                    ...[
                      ...new Set(
                        item.batches.map((b) => b.batchDate.split("T")[0])
                      ),
                    ].sort(),
                  ];
                  const selectedDate = selectedDates[key] || "All Dates";
                  const filteredBatches =
                    selectedDate === "All Dates"
                      ? item.batches
                      : item.batches.filter((b) =>
                          b.batchDate.startsWith(selectedDate)
                        );
                  const soldCount = filteredBatches
                    .flatMap((b) => b.serialNumbers)
                    .filter((s) => s.isSold).length;
                  const unsoldCount = filteredBatches
                    .flatMap((b) => b.serialNumbers)
                    .filter((s) => !s.isSold).length;
                  const status = getStatus(soldCount, unsoldCount);

                  return (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      selectedDate={selectedDate}
                      uniqueDates={uniqueDates}
                      onDateChange={handleDateChange}
                      onShowPopup={handleShowPopup}
                      status={status}
                      statusColor={getStatusColorMobile(status)}
                      soldCount={soldCount} // Pass soldCount
                      unsoldCount={unsoldCount} // Pass unsoldCount
                    />
                  );
                })}
              </div>

              {/* Pagination Component */}
              {filteredData.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredData.length}
                    currentPage={currentPage}
                    paginate={paginate}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Popup Modal */}
      {popupData.visible && (
        <AllSerial
          serialNumbers={popupData.serials}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default AllInventory;
