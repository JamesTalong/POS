import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { Package, Search, MapPin, History, RefreshCw, Box } from "lucide-react";

import Pagination from "../../Pagination";
import Loader from "../../../loader/Loader";
import InventoryOverrideTable from "./InventoryOverrideTable";
import HistoryModal from "./HistoryModal";
import { domain } from "../../../../security";

const ITEMS_PER_PAGE = 10;

const AllInventoryOverride = () => {
  // --- States ---
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  // Change 1: Initialize as empty string so we can set it dynamically later
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [availableLocations, setAvailableLocations] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const apiUrl = `${domain}/api/Products/physical-inventory-base`;
    try {
      const response = await axios.get(apiUrl);
      setInventoryData(response.data);

      // Extract unique locations dynamically
      const uniqueLocs = [
        ...new Set(
          response.data.map((item) => item.locationName).filter(Boolean)
        ),
      ];
      setAvailableLocations(uniqueLocs);

      // Change 2: Set the default selection to the first available location
      if (uniqueLocs.length > 0) {
        setSelectedLocation(uniqueLocs[0]);
      } else {
        setSelectedLocation("All");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory data");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- History Logic ---
  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${domain}/api/InventoryAdjustment/adjustment-history`
      );
      setHistoryData(res.data);
      setShowHistory(true);
    } catch (err) {
      console.warn("Using mock history or error occurred");
      toast.info("Could not fetch history, showing demo data.");
      setHistoryData([
        {
          date: new Date().toISOString(),
          productName: "CCTV - Mock",
          locationName: "Malabon",
          targetType: "Unsold",
          quantity: 5,
          uniqueId: "mock-1",
        },
      ]);
      setShowHistory(true);
    }
  };

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    let data = inventoryData;

    // 1. Location Filter
    // Note: Since we initialize selectedLocation as empty, this check ensures
    // we don't filter until a location is actually set (unless it's 'All')
    if (selectedLocation && selectedLocation !== "All") {
      data = data.filter((item) => item.locationName === selectedLocation);
    }

    // 2. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.productName?.toLowerCase().includes(lowerQuery) ||
          item.itemCode?.toLowerCase().includes(lowerQuery) ||
          item.barCode?.toLowerCase().includes(lowerQuery)
      );
    }

    return data;
  }, [inventoryData, selectedLocation, searchQuery]);

  // --- Pagination Logic ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const totalItems = filteredData.length;
    const totalGoodStock = filteredData.reduce(
      (acc, curr) => acc + (curr.unsoldCount || 0),
      0
    );
    const totalValue = filteredData.reduce(
      (acc, curr) => acc + (curr.totalValue || 0),
      0
    );
    return { totalItems, totalGoodStock, totalValue };
  }, [filteredData]);

  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* --- Header --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Physical Inventory
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Overview of stock levels (Base Units) across locations.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={16} />{" "}
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={fetchHistory}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <History size={18} /> View History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Box size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Unique SKUs</p>
              <p className="text-xl font-bold text-slate-800">
                {stats.totalItems}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Good Stock</p>
              <p className="text-xl font-bold text-slate-800">
                {stats.totalGoodStock.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid md:grid-cols-12 gap-4 mb-6">
          {/* Search */}
          <div className="relative md:col-span-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, item code, or barcode..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Location Dropdown */}
          <div className="relative md:col-span-4">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white cursor-pointer"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {/* Dynamic Locations First */}
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              {/* All Locations Last */}
              <option value="All">All Locations</option>
            </select>
          </div>
        </div>

        {/* --- Content --- */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : (
          <>
            <InventoryOverrideTable
              data={currentItems} // This handles the pagination (showing 10 items)
              allData={filteredData} // This handles the Excel export (showing all matching items)
            />

            <div className="mt-6 mb-10">
              <Pagination
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredData.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* --- Modals --- */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        historyData={historyData}
      />
    </div>
  );
};

export default AllInventoryOverride;
