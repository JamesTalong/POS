import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Plus,
  Search,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Pencil,
  ListTree,
  CheckCircle,
} from "lucide-react";

// Keep your existing components
import Loader from "../../../loader/Loader";
import AddBatches from "../BatchesModule/AddBatches";
import SerialViewModal from "./SerialViewModal";
import PricelistModal from "./PricelistModal";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

// Import the new card component for mobile view
import BatchCard from "./BatchCard";

const AllBatches = () => {
  // ... (All your existing state and functions remain exactly the same)
  // [useState, useCallback, useEffect, fetchData, fetchPricelistData, etc.]
  const [batchData, setBatchData] = useState([]);
  const [pricelists, setPricelists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSerialModalVisible, setIsSerialModalVisible] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState(null);
  const [serialData, setSerialData] = useState([]);
  const [isPricelistModalVisible, setIsPricelistModalVisible] = useState(false);
  const [pricelistData, setPricelistData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All"); // Added state for location selection
  const [locations, setLocations] = useState([]); // Added state for unique locations
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [batchesToFix, setBatchesToFix] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [batchResponse, pricelistResponse] = await Promise.all([
        axios.get(`${domain}/api/Batches`, {
          headers: { "Content-Type": "application/json" },
        }),
        axios.get(`${domain}/api/Pricelists`, {
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      setBatchData(batchResponse.data);
      setPricelists(pricelistResponse.data);

      const uniqueLocations = [
        "All",
        ...new Set(pricelistResponse.data.map((item) => item.location)),
      ];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPricelistData = async (pricelistId) => {
    try {
      const response = await axios.get(
        `${domain}/api/Pricelists/${pricelistId}`
      );
      setPricelistData(response.data);
      setIsPricelistModalVisible(true);
    } catch (error) {
      console.error("Error fetching pricelist data:", error);
      toast.error("Failed to fetch pricelist.");
    }
  };

  const closePricelistModal = () => {
    setIsPricelistModalVisible(false);
    setPricelistData(null);
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;
    try {
      await axios.delete(`${domain}/api/Batches/${id}`, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error("Failed to delete batch.");
    }
  };

  const openModal = (batch = null) => {
    setBatchToEdit(batch);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setBatchToEdit(null);
  };

  const openSerialModal = async (batchId) => {
    try {
      const response = await axios.get(`${domain}/api/Batches/${batchId}`);
      setSerialData(response.data);
      setIsSerialModalVisible(true);
    } catch (error) {
      console.error("Error fetching serials:", error);
      toast.error("Failed to fetch serials.");
    }
  };

  const closeSerialModal = () => {
    setIsSerialModalVisible(false);
    setSerialData([]);
  };

  const filteredBatches = batchData.filter((batch) => {
    const pricelist =
      pricelists.find((plist) => plist.id === batch.pricelistId) || {};
    const searchString = `${new Date(batch.batchDate).toLocaleDateString()} ${
      pricelist.location || ""
    } ${pricelist.product || ""} ${batch.numberOfItems}`.toLowerCase();
    if (selectedLocation !== "All" && pricelist.location !== selectedLocation)
      return false;
    return searchString.includes(searchTerm.toLowerCase());
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBatches.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setCurrentPage(1);
  };

  const handleVerifyAll = () => {
    const mismatchedBatches = batchData.filter(
      (batch) => batch.serialNumbers.length !== batch.numberOfItems
    );
    if (mismatchedBatches.length > 0) {
      setBatchesToFix(mismatchedBatches);
      setShowVerifyModal(true);
    } else {
      toast.success("All batches are valid!", {
        icon: <CheckCircle className="text-green-500" />,
      });
    }
  };

  const fixBatches = async () => {
    try {
      await Promise.all(
        batchesToFix.map(async (batch) => {
          const existingSerials = batch.serialNumbers || [];
          const toAddCount = batch.numberOfItems - existingSerials.length;
          const newSerials = [
            ...existingSerials,
            ...Array(toAddCount).fill({ serialName: "", isSold: false }),
          ];
          await axios.put(`${domain}/api/Batches/${batch.id}`, {
            ...batch, // Pass existing batch data
            serialNumbers: newSerials,
          });
        })
      );
      toast.success("Missing serial numbers have been fixed!");
      setShowVerifyModal(false);
      fetchData();
    } catch (error) {
      console.error("Error fixing serials:", error);
      toast.error("Failed to fix serials.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8  min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      {/* --- Header & Title --- */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          All Batches
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage, verify, and track all your product batches.
        </p>
      </div>

      {/* --- Actions & Filters Bar --- */}
      <div className="mt-6 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search batches..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Batch</span>
          </button>
        </div>
      </div>

      {/* --- Utility Actions --- */}
      <div className="mt-4 max-w-7xl mx-auto">
        <button
          onClick={handleVerifyAll}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          <ShieldCheck size={16} /> Verify All Data
        </button>
      </div>

      {/* --- Content Area --- */}
      <div className="mt-6 max-w-7xl mx-auto">
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
                    <th scope="col" className="px-6 py-3">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Batch Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Items
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                      Serials
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((batch) => {
                    const pricelist =
                      pricelists.find(
                        (plist) => plist.id === batch.pricelistId
                      ) || {};
                    return (
                      <tr
                        key={batch.id}
                        className="bg-white border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                        onClick={() => fetchPricelistData(batch.pricelistId)}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {pricelist.product || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {pricelist.location || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(batch.batchDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {batch.numberOfItems}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openSerialModal(batch.id);
                            }}
                            className="font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            View
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(batch);
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-md"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBatch(batch.id);
                              }}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-md"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
            <div className="grid grid-cols-1 gap-5 md:hidden">
              {currentItems.map((batch) => {
                const pricelist =
                  pricelists.find((plist) => plist.id === batch.pricelistId) ||
                  {};
                return (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    pricelist={pricelist}
                    onEdit={openModal}
                    onDelete={deleteBatch}
                    onViewSerials={openSerialModal}
                    onViewDetails={fetchPricelistData}
                  />
                );
              })}
            </div>

            {/* Pagination Component */}
            {filteredBatches.length > itemsPerPage && (
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredBatches.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            )}
          </>
        )}
      </div>

      {/* --- Modals --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-8 rounded-lg max-h-screen overflow-y-auto w-full max-w-lg">
            <AddBatches
              onClose={closeModal}
              refreshData={fetchData}
              batchToEdit={batchToEdit}
            />
          </div>
        </div>
      )}

      {showVerifyModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <AlertTriangle
                className="h-6 w-6 text-yellow-600"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mt-4">
              Mismatched Serial Numbers Found
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Some batches have a number of items that doesn't match the number
              of serials. Do you want to auto-fix this?
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={fixBatches}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                Yes, Fix It
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <PricelistModal
        isVisible={isPricelistModalVisible}
        pricelistData={pricelistData}
        onClose={closePricelistModal}
      />
      <SerialViewModal
        isVisible={isSerialModalVisible}
        onClose={closeSerialModal}
        serialData={serialData}
      />
    </div>
  );
};

export default AllBatches;
