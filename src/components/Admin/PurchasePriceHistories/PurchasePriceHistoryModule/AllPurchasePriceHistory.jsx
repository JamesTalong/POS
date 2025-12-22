import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  Pencil,
  Calendar,
  DollarSign,
  Truck, // Icon for Vendor
  FileText,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddPurchasePrice from "./AddPurchasePrice";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const AllPurchasePriceHistories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [locations, setLocations] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/PurchasePriceHistories`);
      setData(response.data);

      const uniqueLocations = [
        "All",
        ...new Set(
          response.data
            .map((item) => item.location?.locationName)
            .filter(Boolean)
        ),
      ];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch purchase prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteItem = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this purchase record?")
    )
      return;
    try {
      await axios.delete(`${domain}/api/PurchasePriceHistories/${id}`);
      toast.success("Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item.");
    }
  };

  const openModal = (item = null) => {
    setItemToEdit(item);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setItemToEdit(null);
  };

  const filteredItems = data.filter((item) => {
    const safeStr = (str) => (str ? String(str).toLowerCase() : "");
    const dateStr = item.effectiveDate
      ? new Date(item.effectiveDate).toLocaleDateString()
      : "";

    const searchString = `
      ${safeStr(item.product?.productName)} 
      ${safeStr(item.vendor?.name)} 
      ${safeStr(item.location?.locationName)} 
      ${safeStr(item.uom?.name)}
      ${dateStr}
    `.toLowerCase();

    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesLocation =
      selectedLocation === "All" ||
      item.location?.locationName === selectedLocation;

    return matchesSearch && matchesLocation;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="text-blue-600" /> Purchase Price History
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track cost history from vendors for your inventory.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus size={18} />
              Add Record
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Product, Vendor, Notes..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="relative flex-1 md:flex-none md:w-64">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Vendor</th>
                    <th className="px-6 py-4 font-semibold">Cost / UOM</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Effective Date</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/30 transition duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            {item.product?.productName || "Unknown"}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <FileText size={10} /> {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Truck size={14} className="text-slate-400" />
                            <span>{item.vendor?.vendorName || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-medium text-slate-800">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "PHP",
                            }).format(item.price)}
                          </span>
                          <span className="text-slate-400 text-xs ml-1">
                            / {item.uom?.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {item.location?.locationName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(item.effectiveDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        No purchase price history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-lg shadow border border-slate-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">
                      {item.product?.productName}
                    </h3>
                    <span className="font-mono text-slate-700 font-bold">
                      ${item.price.toFixed(2)}{" "}
                      <span className="text-xs text-slate-400">
                        / {item.uom?.name}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                    <Truck size={12} /> Vendor: {item.vendor?.name}
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    Loc: {item.location?.locationName}
                  </p>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openModal(item)}
                      className="flex-1 py-2 text-center text-sm bg-slate-50 border rounded text-slate-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-1 py-2 text-center text-sm bg-red-50 border border-red-100 rounded text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredItems.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AddPurchasePrice
              onClose={closeModal}
              refreshData={fetchData}
              itemToEdit={itemToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPurchasePriceHistories;
