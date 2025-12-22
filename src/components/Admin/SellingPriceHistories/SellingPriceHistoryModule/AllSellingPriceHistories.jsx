import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  Zap,
  Loader as LoaderIcon,
} from "lucide-react";

import Loader from "../../../loader/Loader";
import AddSellingPrice from "./AddSellingPrice.jsx";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const AllSellingPriceHistories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // State to store the allowed UOMs for specific products
  const [productUomsMap, setProductUomsMap] = useState({});

  const [modalConfig, setModalConfig] = useState({
    itemToEdit: null,
    prefillData: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize as empty string or a placeholder until data loads
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState([]);

  // --- 1. Fetch Main Table Data ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/SellingPriceHistories`);
      setData(response.data);

      // 1. Get Unique Locations from data
      const distinctLocations = [
        ...new Set(
          response.data.map((item) => item.locationName).filter(Boolean)
        ),
      ];

      // 2. Sort them alphabetically
      distinctLocations.sort();

      // 3. Create the list with "All" at the BOTTOM
      const sortedLocations = [...distinctLocations, "All"];
      setLocations(sortedLocations);

      // 4. Set Default Selection:
      // If we have locations, pick the FIRST one. Otherwise default to "All".
      // We check if selectedLocation is empty so we don't overwrite user selection on refresh/refetch
      setSelectedLocation((prev) => {
        if (prev && prev !== "All" && distinctLocations.includes(prev)) {
          return prev; // Keep current selection if valid
        }
        return distinctLocations.length > 0 ? distinctLocations[0] : "All";
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch selling prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. Grouping Logic ---
  const groupedData = useMemo(() => {
    const groups = {};
    data.forEach((item) => {
      const key = `${item.productId}-${item.locationId}`;
      if (!groups[key]) {
        groups[key] = {
          uniqueKey: key,
          productId: item.productId,
          productName: item.productName,
          locationId: item.locationId,
          locationName: item.locationName,
          notes: item.notes,
          standardPrices: {},
          promos: [],
        };
      }
      if (item.endDate) {
        groups[key].promos.push(item);
      } else {
        groups[key].standardPrices[item.uom] = item;
      }
    });
    return Object.values(groups);
  }, [data]);

  // --- 3. Filtering ---
  const filteredGroups = groupedData.filter((group) => {
    const safeStr = (str) => (str ? String(str).toLowerCase() : "");
    const searchString = `${safeStr(group.productName)} ${safeStr(
      group.locationName
    )}`.toLowerCase();

    // Logic: If "All" is selected, show everything.
    // Otherwise, match the specific location name.
    const matchesLocation =
      selectedLocation === "All" || group.locationName === selectedLocation;

    return searchString.includes(searchTerm.toLowerCase()) && matchesLocation;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- 4. SMART LOGIC: Fetch UOM Definitions for VISIBLE Items ---
  useEffect(() => {
    const fetchDefinitionsForVisibleItems = async () => {
      const visibleProductIds = [
        ...new Set(currentItems.map((item) => item.productId)),
      ];

      const idsToFetch = visibleProductIds.filter((id) => !productUomsMap[id]);

      if (idsToFetch.length === 0) return;

      const fetchedResults = await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const res = await axios.get(
              `${domain}/api/Products/${id}/pricing-uoms`
            );
            return { id, uoms: res.data };
          } catch (err) {
            console.error(`Failed to load UOMs for product ${id}`, err);
            return { id, uoms: [] };
          }
        })
      );

      setProductUomsMap((prev) => {
        const newMap = { ...prev };
        fetchedResults.forEach((res) => {
          newMap[res.id] = res.uoms;
        });
        return newMap;
      });
    };

    if (currentItems.length > 0) {
      fetchDefinitionsForVisibleItems();
    }
  }, [currentItems, productUomsMap]);

  // --- Actions ---
  const openEdit = (item) => {
    setModalConfig({ itemToEdit: item, prefillData: null });
    setIsModalVisible(true);
  };

  const openAdd = (productId, locationId, uomCode, isSpecial = false) => {
    const prefillData = productId
      ? { productId, locationId, prefillUom: uomCode, isSpecial }
      : null;

    setModalConfig({ itemToEdit: null, prefillData });
    setIsModalVisible(true);
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this price?")) return;
    try {
      await axios.delete(`${domain}/api/SellingPriceHistories/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalConfig({ itemToEdit: null, prefillData: null });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12 relative font-sans">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header Area */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Selling Price Management
            </h1>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Product..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Location Dropdown */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === "All" ? "All Locations" : loc}
                  </option>
                ))}
              </select>

              <button
                onClick={() => openAdd(null, null, null)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl shadow transition-all hover:shadow-md active:scale-95"
              >
                <Plus size={18} strokeWidth={2.2} /> <span>Add Price</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 w-1/4">Product & Location</th>
                  <th className="px-6 py-4 w-3/4">Pricing Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? (
                  currentItems.map((group) => {
                    const allowedUomObjects =
                      productUomsMap[group.productId] || [];

                    allowedUomObjects.sort((a, b) =>
                      (a.code || "").localeCompare(b.code || "")
                    );

                    return (
                      <tr key={group.uniqueKey} className="hover:bg-gray-50/50">
                        <td className="px-6 py-6 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-900 text-lg">
                              {group.productName}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin size={14} className="text-gray-400" />{" "}
                              {group.locationName}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs font-bold text-gray-400 uppercase w-16">
                                Standard:
                              </span>

                              {allowedUomObjects.length > 0 ? (
                                allowedUomObjects.map((uomObj) => {
                                  const lookupKey = uomObj.code;
                                  const priceItem =
                                    group.standardPrices[lookupKey];
                                  const displayLabel =
                                    uomObj.name || uomObj.code;

                                  if (priceItem) {
                                    return (
                                      <div
                                        key={lookupKey}
                                        className="relative group"
                                      >
                                        <button
                                          onClick={() => openEdit(priceItem)}
                                          className="flex flex-col items-center justify-center min-w-[100px] p-2 bg-white border-2 border-green-100 hover:border-green-500 rounded-lg shadow-sm transition-all"
                                        >
                                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                                            {displayLabel}
                                          </span>
                                          <span className="font-bold text-gray-900">
                                            {formatCurrency(priceItem.vatInc)}
                                          </span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteItem(priceItem.id);
                                          }}
                                          className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <button
                                        key={lookupKey}
                                        onClick={() =>
                                          openAdd(
                                            group.productId,
                                            group.locationId,
                                            lookupKey
                                          )
                                        }
                                        className="flex flex-col items-center justify-center min-w-[100px] h-[58px] border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all gap-1"
                                      >
                                        <Plus size={14} />
                                        <span className="text-[10px] font-bold uppercase">
                                          Add {displayLabel}
                                        </span>
                                      </button>
                                    );
                                  }
                                })
                              ) : Object.values(group.standardPrices).length >
                                0 ? (
                                Object.values(group.standardPrices).map(
                                  (priceItem) => (
                                    <button
                                      key={priceItem.id}
                                      onClick={() => openEdit(priceItem)}
                                      className="flex flex-col items-center justify-center min-w-[100px] p-2 bg-white border-2 border-green-100 hover:border-green-500 rounded-lg shadow-sm transition-all"
                                    >
                                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        {priceItem.uom}
                                      </span>
                                      <span className="font-bold text-gray-900">
                                        {formatCurrency(priceItem.vatInc)}
                                      </span>
                                    </button>
                                  )
                                )
                              ) : (
                                <div className="text-xs text-gray-400 italic">
                                  Loading configuration...
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                              <span className="text-xs font-bold text-orange-400 uppercase w-16 flex items-center gap-1">
                                <Zap size={12} /> Promos:
                              </span>
                              {group.promos.map((promo) => (
                                <div key={promo.id} className="relative group">
                                  <button
                                    onClick={() => openEdit(promo)}
                                    className="flex flex-col items-start min-w-[140px] px-3 py-2 bg-orange-50 border border-orange-200 hover:border-orange-400 rounded-lg transition-all"
                                  >
                                    <div className="flex justify-between w-full">
                                      <span className="text-[10px] font-bold text-orange-600 uppercase">
                                        {promo.uom}
                                      </span>
                                      <span className="font-bold text-gray-900 text-sm">
                                        {formatCurrency(promo.vatInc)}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1">
                                      Ends:{" "}
                                      {new Date(
                                        promo.endDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(promo.id);
                                    }}
                                    className="absolute -top-2 -right-2 bg-white border border-red-100 text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() =>
                                  openAdd(
                                    group.productId,
                                    group.locationId,
                                    "SPECIAL",
                                    true
                                  )
                                }
                                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-orange-600 border border-orange-200 border-dashed rounded-lg hover:bg-orange-50 transition-all"
                              >
                                <Plus size={12} /> Add Promo
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center py-10 text-gray-500">
                      No selling prices found for the selected location.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-100">
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={filteredGroups.length}
                currentPage={currentPage}
                paginate={paginate}
              />
            </div>
          </div>
        )}
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl">
            <AddSellingPrice
              onClose={closeModal}
              refreshData={fetchData}
              itemToEdit={modalConfig.itemToEdit}
              prefillData={modalConfig.prefillData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSellingPriceHistories;
