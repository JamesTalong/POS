import React, { useEffect, useState, useMemo } from "react";
import Loader from "../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../security";
import {
  FaTimes,
  FaArrowRight,
  FaSearch,
  FaImage,
  FaTrash,
  FaListOl,
  FaCalendarAlt, // Icon for "Select Serials" button
} from "react-icons/fa";
import SerialSelectionModal from "./SerialSelectionModal";

import DatePicker from "react-datepicker"; // <-- IMPORT DATEPICKER
import "react-datepicker/dist/react-datepicker.css";
import { useSelector } from "react-redux";
import { selectFullName } from "../../../redux/IchthusSlice";

const getUniqueValues = (array, key) => [
  ...new Set(array.map((item) => item[key]).filter(Boolean)),
];

const TransferInventoryModal = ({ onClose, refreshData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [allPricelistData, setAllPricelistData] = useState([]);

  const [sendingLocation, setSendingLocation] = useState("");
  const [receivingLocation, setReceivingLocation] = useState("");
  const [globalTransferNotes, setGlobalTransferNotes] = useState("");

  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProductsForTransfer, setSelectedProductsForTransfer] =
    useState([]);

  // --- NEW STATE FOR SERIAL SELECTION MODAL ---
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [productForSerialSelection, setProductForSerialSelection] =
    useState(null);
  const [transferredDate, setTransferredDate] = useState(new Date());

  const fullName = useSelector(selectFullName);

  useEffect(() => {
    const fetchPricelists = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${domain}/api/Pricelists`);
        setAllPricelistData(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching pricelists:", error);
        toast.error(
          "Failed to load pricelist data. Please check API and data format."
        );
        setAllPricelistData([]);
      }
      setIsLoading(false);
    };
    fetchPricelists();
  }, []);

  const allAvailableLocations = useMemo(() => {
    if (!Array.isArray(allPricelistData)) return [];
    return getUniqueValues(allPricelistData, "location").sort();
  }, [allPricelistData]);

  const productsAtSendingLocation = useMemo(() => {
    if (!sendingLocation || !Array.isArray(allPricelistData)) return [];
    const productsMap = new Map();

    allPricelistData
      .filter((pricelistEntry) => pricelistEntry.location === sendingLocation)
      .forEach((pricelistEntry) => {
        const {
          productId,
          product,
          itemCode,
          productImage,
          hasSerial,
          batches,
          id,
        } = pricelistEntry;

        let currentProduct = productsMap.get(productId);
        if (!currentProduct) {
          currentProduct = {
            productId,
            productName: product || "Unnamed Product",
            itemCode: itemCode || "N/A",
            productImage: productImage || "",
            physicalOnHand: 0,
            hasSerialOverall: hasSerial, // 💥 YOUR RULE: set only from hasSerial
            allUnsoldSerialsForThisProductAtLocation: [],
            selectedSerialIds: [],
            pricelistId: null,
          };
        }

        if (!currentProduct.pricelistId) {
          currentProduct.pricelistId = id;
        }

        let serialCount = 0;

        (batches || []).forEach((actualBatch) => {
          if (Array.isArray(actualBatch.serialNumbers)) {
            const unsoldSerials = actualBatch.serialNumbers.filter(
              (sn) => !sn.isSold
            );

            serialCount += unsoldSerials.length;

            unsoldSerials.forEach((sn) => {
              currentProduct.allUnsoldSerialsForThisProductAtLocation.push({
                id: sn.id,
                serialName: sn.serialName,
                batchId: actualBatch.id,
                pricelistEntryId: pricelistEntry.id,
              });
            });
          } else {
            currentProduct.physicalOnHand += actualBatch.numberOfItems || 0;
          }
        });

        // ✅ Always update physicalOnHand from serial count if serials found
        if (serialCount > 0) {
          currentProduct.physicalOnHand = serialCount;
        }

        productsMap.set(productId, currentProduct);
      });

    const productsArray = Array.from(productsMap.values());

    return productsArray;
  }, [sendingLocation, allPricelistData]);

  const handleAddProductToTransfer = (productToAdd) => {
    if (
      selectedProductsForTransfer.find(
        (p) => p.productId === productToAdd.productId
      )
    ) {
      toast.info(
        `${productToAdd.productName} is already in the transfer list.`
      );
      return;
    }

    // When adding a product, also include its available serials and pricelistId
    const productWithSerialsData = productsAtSendingLocation.find(
      (p) => p.productId === productToAdd.productId
    );

    setSelectedProductsForTransfer((prev) => [
      ...prev,
      {
        ...productToAdd, // Contains basic product info like name, itemCode, image, hasSerialOverall
        allUnsoldSerialsForThisProductAtLocation:
          productWithSerialsData?.allUnsoldSerialsForThisProductAtLocation ||
          [],
        pricelistId: productWithSerialsData?.pricelistId, // Get the pricelistId
        transferQuantity: productToAdd.hasSerialOverall ? 0 : 1, // Serialized starts at 0, non-serialized at 1
        lineNotes: "",
        selectedSerialIds: [], // Initialize selected serials for this product
      },
    ]);
    setProductSearchTerm("");
  };

  const handleRemoveProductFromTransfer = (productIdToRemove) => {
    setSelectedProductsForTransfer((prev) =>
      prev.filter((p) => p.productId !== productIdToRemove)
    );
  };

  // --- MODIFIED: handleProductTransferChange ---
  const handleProductTransferChange = (productId, field, value) => {
    setSelectedProductsForTransfer((prev) =>
      prev.map((p) => {
        if (p.productId === productId) {
          if (field === "transferQuantity") {
            // For serialized items, quantity is derived from selected serials, so disable direct input
            if (p.hasSerialOverall) {
              // toast.info("Quantity for serialized items is set by selecting serial numbers.");
              return p; // Or, you might allow changing it and then clear selected serials
            }
            const rawValue = String(value).trim();
            if (rawValue === "") {
              return { ...p, transferQuantity: "" };
            }
            const val = parseInt(rawValue, 10);
            if (isNaN(val) || val < 0) {
              return { ...p, transferQuantity: "" }; // Or 0
            } else if (val > p.physicalOnHand) {
              toast.warn(
                `Max quantity for ${p.productName} is ${p.physicalOnHand}.`
              );
              return { ...p, transferQuantity: p.physicalOnHand };
            }
            return { ...p, transferQuantity: val };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // --- NEW: Handler to open serial selection modal ---
  const handleOpenSerialModal = (product) => {
    setProductForSerialSelection(product);
    setIsSerialModalOpen(true);
  };

  // --- NEW: Handler to save selected serials from modal ---
  const handleSaveSerials = (productId, newSelectedSerialIds) => {
    setSelectedProductsForTransfer((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? {
              ...p,
              selectedSerialIds: newSelectedSerialIds,
              transferQuantity: newSelectedSerialIds.length, // Update quantity based on selection
            }
          : p
      )
    );
    setIsSerialModalOpen(false);
    setProductForSerialSelection(null);
  };

  const handleQuantityBlur = (productId) => {
    setSelectedProductsForTransfer((prev) =>
      prev.map((p) => {
        if (p.productId === productId) {
          // For non-serialized, if quantity is empty or 0, maybe default to 1 or handle in validation.
          if (
            !p.hasSerialOverall &&
            (p.transferQuantity === "" || Number(p.transferQuantity) === 0)
          ) {
            // return { ...p, transferQuantity: 1 }; // Optional: default to 1
          }
        }
        return p;
      })
    );
  };

  const filteredProductsForSearch = useMemo(() => {
    if (!productSearchTerm) return [];
    return productsAtSendingLocation.filter(
      (p) =>
        (p.productName || "")
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        (p.itemCode || "")
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase())
    );
  }, [productSearchTerm, productsAtSendingLocation]);

  // --- MODIFIED: handleFormSubmit ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!sendingLocation) {
      toast.error("Please select a sending location.");
      setIsLoading(false);
      return;
    }
    if (!receivingLocation) {
      toast.error("Please select a receiving location.");
      setIsLoading(false);
      return;
    }
    if (sendingLocation === receivingLocation) {
      toast.error("Sending and receiving locations cannot be the same.");
      setIsLoading(false);
      return;
    }
    if (selectedProductsForTransfer.length === 0) {
      toast.error("Please add at least one product to transfer.");
      setIsLoading(false);
      return;
    }

    if (!transferredDate) {
      // Validation for transferred date
      toast.error("Please select a transferred date.");
      setIsLoading(false);
      return;
    }

    let hasError = false;
    const itemsToSubmit = [];

    for (const product of selectedProductsForTransfer) {
      let quantityToSubmit;
      let serialNumberIdsToSubmit = [];

      if (product.hasSerialOverall) {
        if (product.selectedSerialIds.length === 0) {
          toast.error(
            `Please select serial numbers for ${product.productName}.`
          );
          hasError = true;
          break;
        }
        quantityToSubmit = product.selectedSerialIds.length;
        serialNumberIdsToSubmit = product.selectedSerialIds.map((id) => id); // Ensure it's a new array of the IDs

        if (quantityToSubmit > product.physicalOnHand) {
          // Should not happen if selection is from available ones
          toast.error(
            `Selected serials for ${product.productName} (${quantityToSubmit}) exceeds available stock (${product.physicalOnHand}). This should not happen.`
          );
          hasError = true;
          break;
        }
      } else {
        // Non-serialized product
        quantityToSubmit = Number(product.transferQuantity);
        if (isNaN(quantityToSubmit) || quantityToSubmit <= 0) {
          toast.error(
            `Enter a valid transfer quantity (>0) for ${product.productName}.`
          );
          hasError = true;
          break;
        }
        if (quantityToSubmit > product.physicalOnHand) {
          toast.error(
            `Transfer quantity for ${product.productName} (${quantityToSubmit}) exceeds available stock (${product.physicalOnHand}).`
          );
          hasError = true;
          break;
        }
      }

      if (!product.pricelistId) {
        // Important: Ensure PricelistId is present
        toast.error(
          `Missing PricelistId for product ${product.productName}. Cannot submit.`
        );
        hasError = true;
        break;
      } // --- NEW LOGIC FOR TransmitPricelistId ---

      let receiverPricelistId = null;
      const existingProductInReceivingLocation = allPricelistData.find(
        (data) =>
          data.product === product.productName &&
          data.location === receivingLocation
      );

      if (existingProductInReceivingLocation) {
        receiverPricelistId = existingProductInReceivingLocation.id;
      } else {
        // If no similar product in receiving location, create one before transfer.
        // This means you'll need to make an API call to create a new Pricelist entry
        // for this product at the receiving location.
        toast.error(
          `Product "${product.productName}" does not exist in ${receivingLocation}. Please create it there first.`
        );
        hasError = true;
        break; // In a real application, you'd likely have a function here to // await the creation of the new pricelist entry and get its ID. // Example (conceptual): // try { //   const newPricelistEntry = await createPricelistEntry(product.productId, receivingLocation, product.productName, ...otherProductDetails); //   transmitPricelistId = newPricelistEntry.id; // } catch (createError) { //   toast.error(`Failed to create product entry in ${receivingLocation} for ${product.productName}.`); //   hasError = true; //   break; // }
      } // --- END NEW LOGIC ---
      itemsToSubmit.push({
        productId: product.productId,
        PricelistId: product.pricelistId, // Use the stored pricelistId for the item (sending location's pricelistId)
        receiverPricelistId: receiverPricelistId, // Add the pricelistId for the receiving location
        quantity: quantityToSubmit,
        notes: product.lineNotes,
        serialNumberIds: serialNumberIdsToSubmit,
      });
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    const transferPayload = {
      releaseBy: fullName,
      status: " In Transit",
      fromLocation: sendingLocation,
      toLocation: receivingLocation,
      transferredDate: transferredDate.toISOString(), // Send as ISO string or format as backend requires
      notes: globalTransferNotes,
      items: itemsToSubmit,
    };

    try {
      console.log("Submitting Transfer Payload:", transferPayload);
      console.log("Final bulkData:", JSON.stringify(transferPayload, null, 2));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const apiUrl = domain + "/api/Transfers";

      console.log(transferPayload);

      await axios.post(apiUrl, transferPayload);
      toast.success("Inventory transfer initiated successfully! (Mocked)");

      if (typeof refreshData === "function") refreshData();
      onClose();
    } catch (error) {
      console.error(
        "Error transferring inventory:",
        error.response?.data || error.message
      );
      toast.error(
        `Transfer failed: ${
          error.response?.data?.message || "An unexpected error occurred."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedProductsForTransfer([]);
    setProductSearchTerm("");
    // Close serial modal if open when sending location changes
    if (isSerialModalOpen) {
      setIsSerialModalOpen(false);
      setProductForSerialSelection(null);
    }
  }, [sendingLocation]);

  if (isLoading && allPricelistData.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-[1001]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-[1000] p-4">
      <div className="relative w-full max-w-4xl bg-white shadow-xl rounded-lg max-h-[90vh] flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-[1002] rounded-lg">
            <Loader />
          </div>
        )}

        <div className="sticky top-0 bg-white z-20 px-6 py-4 border-b rounded-t-lg">
          {/* ... (header remains the same) ... */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Transfer Inventory
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form
          id="transferInventoryForm"
          onSubmit={handleFormSubmit}
          className="flex-grow overflow-y-auto p-6 space-y-6"
        >
          {/* ... (warehouse selection and global notes remain the same) ... */}
          <div className="p-4 border rounded-md bg-gray-50/50">
            <div className="flex flex-col  gap-4 items-start ">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Select Store and add notes
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="transferredDate"
                  className="block text-sm font-medium text-gray-700 mb-1 "
                >
                  Transferred Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DatePicker
                    id="transferredDate"
                    selected={transferredDate}
                    onChange={(date) => setTransferredDate(date)}
                    dateFormat="MMMM d, yyyy"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    wrapperClassName="w-full" // Ensure the wrapper takes full width
                    popperPlacement="bottom-start"
                    required
                  />
                  <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div>
                <label
                  htmlFor="sendingLocation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sending Warehouse
                </label>
                <select
                  id="sendingLocation"
                  value={sendingLocation}
                  onChange={(e) => {
                    setSendingLocation(e.target.value);
                    setReceivingLocation(""); // --- ADD THIS LINE ---
                  }}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  required
                >
                  <option value="" disabled>
                    Select location
                  </option>
                  {allAvailableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-center pt-5">
                <FaArrowRight className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <label
                  htmlFor="receivingLocation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Receiving Warehouse
                </label>
                <select
                  id="receivingLocation"
                  value={receivingLocation}
                  onChange={(e) => setReceivingLocation(e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  required
                  disabled={!sendingLocation}
                >
                  <option value="" disabled>
                    Select location
                  </option>
                  {allAvailableLocations
                    .filter((loc) => loc !== sendingLocation)
                    .map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {/* --- DATE PICKER AND NOTES ROW --- */}
            <div className="mt-4">
              <div>
                <label
                  htmlFor="globalTransferNotes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transfer Notes{" "}
                  <span className="text-xs text-gray-500">(Overall)</span>
                </label>
                <textarea
                  id="globalTransferNotes"
                  rows="2" // Adjusted rows to fit better next to date picker
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  value={globalTransferNotes}
                  onChange={(e) => setGlobalTransferNotes(e.target.value)}
                  placeholder="Add any relevant notes for this transfer..."
                />
              </div>
            </div>
          </div>

          {sendingLocation && (
            <div className="p-4 border rounded-md">
              {/* ... (product search remains the same) ... */}
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Select products to be transferred
              </h3>
              <div className="mb-4 relative">
                <label
                  htmlFor="productSearch"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Add a product:
                </label>
                <div className="flex items-center relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaSearch className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    id="productSearch"
                    placeholder="Search products by name or ItemCode..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="mt-1 block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    disabled={!sendingLocation}
                  />
                </div>
                {productSearchTerm && filteredProductsForSearch.length > 0 && (
                  <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                    {filteredProductsForSearch.map((product) => (
                      <li
                        key={product.productId}
                        onClick={() => handleAddProductToTransfer(product)}
                        className="px-3 py-2 hover:bg-orange-100 cursor-pointer text-sm flex items-center"
                      >
                        {product.productImage ? (
                          <img
                            src={`data:image/jpeg;base64,${product.productImage}`}
                            alt={product.productName}
                            className="w-8 h-8 rounded-sm object-cover mr-2 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-sm bg-gray-200 mr-2 flex-shrink-0 flex items-center justify-center text-gray-400">
                            <FaImage className="h-5 w-5" />
                          </div>
                        )}
                        <span className="flex-grow">
                          {product.productName} (ItemCode: {product.itemCode})
                        </span>
                        <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">
                          Stock: {product.physicalOnHand}{" "}
                          {product.hasSerialOverall &&
                          product.physicalOnHand > 0
                            ? "(Serials)"
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {productSearchTerm &&
                  !isLoading &&
                  productsAtSendingLocation.length > 0 &&
                  filteredProductsForSearch.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No products found matching "{productSearchTerm}" at{" "}
                      {sendingLocation}.
                    </p>
                  )}
                {!isLoading &&
                  productsAtSendingLocation.length === 0 &&
                  sendingLocation && (
                    <p className="text-sm text-red-500 mt-1">
                      No products available at "{sendingLocation}".
                    </p>
                  )}
              </div>

              {selectedProductsForTransfer.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Product/ItemCode
                        </th>
                        <th className="px-3 py-2  text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                          On Hand
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {/* MODIFIED HEADER */}
                          Transfer Qty / Serials
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Line Notes
                        </th>
                        <th className="px-3 py-2">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProductsForTransfer.map((product) => (
                        <tr key={product.productId}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {/* ... (product display remains the same) ... */}
                            <div className="flex items-center">
                              {product.productImage ? (
                                <img
                                  src={`data:image/jpeg;base64,${product.productImage}`}
                                  alt={product.productName}
                                  className="w-10 h-10 rounded-sm object-cover mr-3 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-sm bg-gray-200 mr-3 flex-shrink-0 flex items-center justify-center text-gray-400">
                                  <FaImage className="h-6 w-6" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.productName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  SKU: {product.itemCode}{" "}
                                  {product.hasSerialOverall ? (
                                    <span className="text-blue-600 font-semibold">
                                      (Serialized)
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                            {product.physicalOnHand}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {/* --- MODIFIED for Serialized --- */}
                            {product.hasSerialOverall ? (
                              <div className="flex flex-col items-start">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSerialModal(product)}
                                  className="mb-1 text-sm text-orange-600 hover:text-orange-800 font-medium py-1 px-2 border border-orange-500 rounded-md hover:bg-orange-50 flex items-center"
                                  disabled={product.physicalOnHand === 0}
                                >
                                  <FaListOl className="mr-2" />
                                  Select Serials (
                                  {product.selectedSerialIds.length})
                                </button>
                                {product.physicalOnHand === 0 && (
                                  <span className="text-xs text-gray-500">
                                    No serials available
                                  </span>
                                )}
                              </div>
                            ) : (
                              <input // For non-serialized
                                type="number"
                                value={product.transferQuantity}
                                onChange={(e) =>
                                  handleProductTransferChange(
                                    product.productId,
                                    "transferQuantity",
                                    e.target.value
                                  )
                                }
                                onBlur={() =>
                                  handleQuantityBlur(product.productId)
                                }
                                min="0" // Allow 0, validation on submit will check for >0
                                max={product.physicalOnHand}
                                className="w-20 py-1 px-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-orange-500 focus:border-orange-500"
                                required
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {/* ... (line notes input remains the same) ... */}
                            <input
                              type="text"
                              placeholder="Item specific notes..."
                              value={product.lineNotes}
                              onChange={(e) =>
                                handleProductTransferChange(
                                  product.productId,
                                  "lineNotes",
                                  e.target.value
                                )
                              }
                              className="w-full py-1 px-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                            {/* ... (remove button remains the same) ... */}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveProductFromTransfer(
                                  product.productId
                                )
                              }
                              className="text-red-500 hover:text-red-700 p-1"
                              aria-label="Remove product"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedProductsForTransfer.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No products added for transfer yet.
                </p>
              )}
            </div>
          )}
        </form>

        <div className="sticky bottom-0 bg-gray-100 px-6 py-3 border-t rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Close
            </button>
            <button
              type="submit"
              form="transferInventoryForm"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60"
              disabled={
                isLoading ||
                !sendingLocation ||
                !receivingLocation ||
                selectedProductsForTransfer.length === 0 ||
                selectedProductsForTransfer.some(
                  (p) =>
                    p.hasSerialOverall
                      ? p.selectedSerialIds.length === 0 // Serialized must have serials selected
                      : p.transferQuantity === "" ||
                        Number(p.transferQuantity) <= 0 // Non-serialized must have qty > 0
                )
              }
            >
              Transfer
            </button>
          </div>
        </div>
      </div>

      {/* --- NEW: Serial Selection Modal --- */}
      {isSerialModalOpen && productForSerialSelection && (
        <SerialSelectionModal
          product={productForSerialSelection}
          availableSerials={
            productForSerialSelection.allUnsoldSerialsForThisProductAtLocation
          }
          previouslySelectedIds={productForSerialSelection.selectedSerialIds}
          onClose={() => {
            setIsSerialModalOpen(false);
            setProductForSerialSelection(null);
          }}
          onSave={handleSaveSerials}
        />
      )}
    </div>
  );
};

export default TransferInventoryModal;
