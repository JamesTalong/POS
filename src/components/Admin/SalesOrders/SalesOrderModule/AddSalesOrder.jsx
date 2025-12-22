import React, { useCallback, useEffect, useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";
import SelectedSerialModal from "../../POS/PosModule/SelectedSerialModal";
import {
  FaTimes,
  FaSave,
  FaArrowRight,
  FaArrowLeft,
  FaShoppingCart,
  FaPaperclip,
  FaTrash,
  FaEye,
  FaBarcode,
} from "react-icons/fa";

// Styles shared
const inputStyles =
  "block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all";
const labelStyles = "block text-sm font-medium text-gray-700 mb-1";
const readOnlyInputStyles = `${inputStyles} bg-gray-100 text-gray-600 cursor-not-allowed focus:ring-0 focus:border-gray-300`;

const AddSalesOrder = ({ onClose, sourceQuote, refreshData }) => {
  // --- STATE ---
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Selection State
  const [quoteDetails, setQuoteDetails] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());

  // Image Upload State
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState("");

  // Serial Number Logic State
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [currentSerialProduct, setCurrentSerialProduct] = useState(null);

  const [purchasedSerials, setPurchasedSerials] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    salesOrderNumber: "Draft",
    salesQuotationId: 0,
    date: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    status: "Draft",
    remarks: "",
    locationId: "",
    locationName: "",
    customerId: "",
    customerName: "",
    shippingAddress: "",
    totalAmount: 0,
    salesOrderItems: [],
    poImage: null,
  });

  // --- SERIAL HELPERS ---
  const getExcludedSerials = (currentRowIndex) => {
    let usedIds = [];
    Object.keys(purchasedSerials).forEach((key) => {
      if (parseInt(key) !== currentRowIndex) {
        const ids = purchasedSerials[key];
        if (Array.isArray(ids)) {
          usedIds = [...usedIds, ...ids];
        }
      }
    });
    return usedIds;
  };

  const openSerialModal = (item, index) => {
    const modalProduct = {
      id: item.productId,
      productId: item.productId,
      productName: item.productName,
      quantity: parseFloat(item.quantity),
      conversionRate: item.conversionRate || 1,
      uomName: item.uom,
      locationId: formData.locationId,
      rowIndex: index,
    };
    setCurrentSerialProduct(modalProduct);
    setIsSerialModalOpen(true);
  };

  const handleSaveSerials = (rowIndex, selectedIds) => {
    setPurchasedSerials((prev) => ({
      ...prev,
      [rowIndex]: selectedIds,
    }));
    setIsSerialModalOpen(false);
    setCurrentSerialProduct(null);
    toast.success("Serials selected successfully");
  };

  // --- API CALLS ---
  const fetchQuoteDetails = useCallback(
    async (id) => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${domain}/api/SalesQuotations/${id}`);
        const data = response.data;

        // --- FIX: VALIDATE STATUS IMMEDIATELY ---
        if (data.status === "Cancelled") {
          toast.error("This Quotation is Cancelled and cannot be processed.");
          onClose(); // Force close
          return;
        }
        if (data.status === "Converted") {
          toast.info("This Quotation has already been Converted.");
          onClose(); // Force close
          return;
        }
        // ----------------------------------------

        setQuoteDetails(data);
        const allIds = new Set(data.quotationProducts.map((p) => p.id));
        setSelectedProductIds(allIds);
      } catch (error) {
        console.error("Error fetching quote details:", error);
        toast.error("Failed to load quotation details.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (sourceQuote?.id) fetchQuoteDetails(sourceQuote.id);
  }, [sourceQuote, fetchQuoteDetails]);

  // --- SELECTION LOGIC ---
  const toggleProductSelection = (id) => {
    const newSelection = new Set(selectedProductIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedProductIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (!quoteDetails) return;
    if (selectedProductIds.size === quoteDetails.quotationProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      const allIds = new Set(quoteDetails.quotationProducts.map((p) => p.id));
      setSelectedProductIds(allIds);
    }
  };

  // --- PROCEED TO FORM ---
  const handleProceedToForm = () => {
    if (selectedProductIds.size === 0) {
      toast.warn("Please select at least one product.");
      return;
    }

    const selectedItems = quoteDetails.quotationProducts.filter((item) =>
      selectedProductIds.has(item.id)
    );

    const mappedItems = selectedItems.map((item, index) => ({
      lineNumber: index + 1,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
      uomId: item.uomId,
      uom: item.uom,
      conversionRate: item.conversionRate || 1,
      hasSerial: true,
      lineTotal: item.subtotal,
    }));

    const initialTotal = mappedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    setFormData((prev) => ({
      ...prev,
      salesOrderNumber: "Auto-Generated",
      salesQuotationId: quoteDetails.id,
      date: new Date().toISOString().split("T")[0],
      deliveryDate: new Date().toISOString().split("T")[0],
      locationId: quoteDetails.locationId,
      locationName: quoteDetails.locationName,
      customerId: quoteDetails.customer?.id,
      customerName: quoteDetails.customer?.customerName,
      shippingAddress: quoteDetails.customer?.address,
      remarks: `Generated from Quote #${quoteDetails.quoteNumber}`,
      totalAmount: initialTotal,
      salesOrderItems: mappedItems,
    }));

    setPurchasedSerials({});
    setStep(2);
  };

  // --- IMAGE HELPERS ---
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setFileName(file.name);
      try {
        const base64 = await convertToBase64(file);
        const base64String = base64.split(",")[1];
        setFormData((prev) => ({ ...prev, poImage: base64String }));
      } catch (error) {
        toast.error("Error processing image");
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFileName("");
    setFormData((prev) => ({ ...prev, poImage: null }));
  };

  const openImageInNewTab = () => {
    if (imagePreview) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<body style="margin:0; display:flex; justify-content:center; align-items:center; background-color:#1a1a1a;">
             <img src="${imagePreview}" style="max-width:100%; height:auto;" />
           </body>`
        );
      }
    }
  };

  // --- FORM CHANGE HANDLERS ---
  const handleHeaderChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.salesOrderItems];
    const lineItem = { ...updatedItems[index] };
    lineItem[field] = value;

    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(lineItem.quantity) || 0;
      const price = parseFloat(lineItem.unitPrice) || 0;
      lineItem.lineTotal = qty * price;

      if (field === "quantity") {
        setPurchasedSerials((prev) => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      }
    }
    updatedItems[index] = lineItem;
    const newGrandTotal = updatedItems.reduce(
      (acc, item) => acc + (item.lineTotal || 0),
      0
    );
    setFormData((prev) => ({
      ...prev,
      salesOrderItems: updatedItems,
      totalAmount: newGrandTotal,
    }));
  };

  // --- SAVE LOGIC ---
  const handleSave = async () => {
    if (!formData.deliveryDate) {
      toast.error("Delivery Date is required");
      return;
    }

    const confirmationText =
      "Are you sure these are the only items that you want to purchase?\n\nIt can't be reversed and will be marked as complete.";

    if (!window.confirm(confirmationText)) {
      return;
    }

    setIsLoading(true);

    try {
      const finalItems = [];
      const globalUsedSerialIds = new Set();

      Object.values(purchasedSerials).forEach((ids) => {
        if (Array.isArray(ids))
          ids.forEach((id) => globalUsedSerialIds.add(id));
      });

      for (let i = 0; i < formData.salesOrderItems.length; i++) {
        const item = formData.salesOrderItems[i];
        let finalSerialIds = [];
        const conversionRate = item.conversionRate || 1;
        const requiredQty = Math.round(item.quantity * conversionRate);

        if (purchasedSerials[i] && purchasedSerials[i].length > 0) {
          finalSerialIds = purchasedSerials[i];

          if (finalSerialIds.length !== requiredQty) {
            toast.error(
              `Quantity mismatch for ${item.productName} (Row ${
                i + 1
              }). Requires ${requiredQty} serials.`
            );
            setIsLoading(false);
            return;
          }
        } else {
          try {
            const locParam = formData.locationId
              ? `?locationId=${formData.locationId}`
              : "";
            const res = await axios.get(
              `${domain}/api/SerialNumbers/available/${item.productId}${locParam}`
            );

            const available = res.data.filter(
              (s) => !globalUsedSerialIds.has(s.id)
            );

            if (available.length >= requiredQty) {
              const selected = available.slice(0, requiredQty).map((s) => s.id);
              selected.forEach((id) => globalUsedSerialIds.add(id));
              finalSerialIds = selected;
            } else {
              toast.error(
                `Insufficient stock for ${item.productName}. Required: ${requiredQty}, Available: ${available.length}`
              );
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error("Auto-fetch error", err);
            toast.error(`Failed to fetch stock for ${item.productName}`);
            setIsLoading(false);
            return;
          }
        }

        finalItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          lineTotal: parseFloat(item.lineTotal),
          uomId: item.uomId,
          uom: item.uom,
          conversionRate: item.conversionRate,
          serialNumbers: finalSerialIds,
        });
      }

      const payload = {
        ...formData,
        customerId: parseInt(formData.customerId),
        locationId: parseInt(formData.locationId),
        salesQuotationId: parseInt(formData.salesQuotationId),
        totalAmount: parseFloat(formData.totalAmount),
        poImage: formData.poImage,
        salesOrderItems: finalItems,
      };

      await axios.post(`${domain}/api/SalesOrders`, payload);
      await axios.delete(`${domain}/api/SerialTemps/delete-all`);

      toast.success("Sales Order Completed & Quotation Marked as Converted!");

      if (refreshData) refreshData();
      onClose();
    } catch (error) {
      console.error("Error saving sales order:", error);
      toast.error(
        error.response?.data?.message || "Failed to create Sales Order."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="relative flex h-full max-h-[95vh] w-full max-w-6xl flex-col rounded-2xl bg-gray-50 shadow-2xl overflow-hidden ring-1 ring-white/20">
        {/* HEADER */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <FaShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {step === 1 ? "Select Products" : "Finalize Sales Order"}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {step === 1
                  ? `From Quote #${sourceQuote?.quoteNumber}`
                  : "Items reserved will be moved to QUARANTINE status."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {isLoading && <Loader />}

        <div className="flex-grow overflow-y-auto p-6 bg-gray-50/50">
          {step === 1 && quoteDetails && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left w-10">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={
                          quoteDetails.quotationProducts.length > 0 &&
                          selectedProductIds.size ===
                            quoteDetails.quotationProducts.length
                        }
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                      Product Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">
                      UOM
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {quoteDetails.quotationProducts.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        selectedProductIds.has(item.id)
                          ? "bg-indigo-50/60"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(item.id)}
                          onChange={() => toggleProductSelection(item.id)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 text-sm">
                        {item.uom || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                  <div>
                    <label className={labelStyles}>Customer</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      readOnly
                      className={readOnlyInputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Location</label>
                    <input
                      type="text"
                      value={formData.locationName}
                      readOnly
                      className={readOnlyInputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Order Date</label>
                    <input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={handleHeaderChange}
                      className={inputStyles}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className={labelStyles}>Shipping Address</label>
                    <textarea
                      type="text"
                      id="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleHeaderChange}
                      className={inputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleHeaderChange}
                      className={inputStyles}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className={labelStyles}>Client PO Document</label>
                    {!imagePreview ? (
                      <label className="flex items-center justify-between w-full h-10 px-3 border border-gray-300 border-dashed rounded-md bg-white text-sm text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors">
                        <span className="flex items-center gap-2">
                          <FaPaperclip /> Attach PO Image
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between w-full h-10 px-3 border border-indigo-200 rounded-md bg-indigo-50/50">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={openImageInNewTab}
                        >
                          <FaEye className="text-indigo-600" />
                          <span className="text-xs text-indigo-900 truncate">
                            {fileName}
                          </span>
                        </div>
                        <button
                          onClick={removeImage}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelStyles}>Remarks</label>
                    <textarea
                      id="remarks"
                      rows={2}
                      value={formData.remarks}
                      onChange={handleHeaderChange}
                      className={inputStyles}
                      placeholder="Add notes here..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-400 uppercase">
                        Product / UOM
                      </th>
                      <th className="px-4 py-2 text-center text-[11px] font-bold text-gray-400 uppercase w-24">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-center text-[11px] font-bold text-gray-400 uppercase w-32">
                        Serial Mode
                      </th>
                      <th className="px-4 py-2 text-right text-[11px] font-bold text-gray-400 uppercase w-32">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {formData.salesOrderItems.map((item, index) => {
                      const selectedCount =
                        purchasedSerials[index]?.length || 0;
                      const requiredCount = Math.round(
                        item.quantity * (item.conversionRate || 1)
                      );
                      const isComplete = selectedCount === requiredCount;

                      return (
                        <tr key={index} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700">
                                {item.productName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {item.uom ? `${item.uom}` : "Unit"}
                                {item.conversionRate > 1 &&
                                  ` (x${item.conversionRate})`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleLineItemChange(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="block w-full h-8 px-2 text-center border border-gray-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => openSerialModal(item, index)}
                              className={`flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all w-full ${
                                selectedCount > 0
                                  ? isComplete
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                              }`}
                              title={
                                selectedCount > 0
                                  ? "Manually Selected"
                                  : "System will Auto-Pick (FIFO)"
                              }
                            >
                              <FaBarcode />
                              {selectedCount > 0
                                ? `${selectedCount}/${requiredCount}`
                                : "Auto"}
                            </button>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="text-sm font-semibold text-gray-800">
                              {new Intl.NumberFormat("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              }).format(item.lineTotal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToForm}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-md"
              >
                Next Step <FaArrowRight />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <FaArrowLeft /> Back
              </button>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-800">
                  Total:{" "}
                  {new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  }).format(formData.totalAmount)}
                </span>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50"
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <FaSave /> Create Order
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* SERIAL MODAL */}
        {isSerialModalOpen && currentSerialProduct && (
          <SelectedSerialModal
            product={currentSerialProduct}
            excludedSerialIds={getExcludedSerials(
              currentSerialProduct.rowIndex
            )}
            onClose={() => setIsSerialModalOpen(false)}
            onSave={(productId, serials) =>
              handleSaveSerials(currentSerialProduct.rowIndex, serials)
            }
          />
        )}
      </div>
    </div>
  );
};

export default AddSalesOrder;
