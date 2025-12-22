import React, { useState, useEffect } from "react";
import { FaTimes, FaUpload, FaTrash } from "react-icons/fa";
import axios from "axios";
import { domain } from "../../../../security";

const REASON_OPTIONS = [
  "Wrong quantity",
  "Wrong item delivered",
  "Physical damage",
  "Defective functionality",
  "Poor manufacturing quality",
  "Wrong color/size/specification",
  "Expired or near expiry",
  "Others",
];

const RejectItemModal = ({ isOpen, onClose, onSubmit, lineItem }) => {
  const [quantityToReject, setQuantityToReject] = useState(0);
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isViewingExistingImage, setIsViewingExistingImage] = useState(false);

  // Helper to safely get original values
  const originalQty = lineItem?.rejectedQuantity || 0;
  const originalReason = lineItem?.rejectReasonDescription || "";

  const parseReasonData = (description) => {
    if (!description) {
      setSelectedReason(REASON_OPTIONS[0]);
      setCustomReason("");
      return;
    }
    const isPredefined = REASON_OPTIONS.slice(0, -1).includes(description);

    if (isPredefined) {
      setSelectedReason(description);
      setCustomReason("");
    } else {
      setSelectedReason("Others");
      if (description.startsWith("Others: ")) {
        setCustomReason(description.replace("Others: ", ""));
      } else {
        setCustomReason(description);
      }
    }
  };

  useEffect(() => {
    const fetchRejectionDetails = async () => {
      if (isOpen && lineItem) {
        setQuantityToReject(lineItem.rejectedQuantity || 0);
        parseReasonData(lineItem.rejectReasonDescription);
        setImageFile(null);
        setError("");

        if (lineItem.hasRejectImage || lineItem.rejectedQuantity > 0) {
          setIsLoadingImage(true);
          try {
            const response = await axios.get(
              `${domain}/api/PurchaseOrderHeaders/lineitems/${lineItem.id}/rejection-details`
            );

            const fetchedData = response.data;
            setQuantityToReject(fetchedData.rejectedQuantity || 0);
            parseReasonData(fetchedData.rejectReasonDescription);

            if (fetchedData.rejectReasonImage) {
              const src = `data:image/jpeg;base64,${fetchedData.rejectReasonImage}`;
              setImagePreview(src);
              setIsViewingExistingImage(true);
            } else {
              setImagePreview(null);
              setIsViewingExistingImage(false);
            }
          } catch (err) {
            console.error("Failed to load existing rejection image", err);
            setImagePreview(null);
            setIsViewingExistingImage(false);
          } finally {
            setIsLoadingImage(false);
          }
        } else {
          setImagePreview(null);
          setIsViewingExistingImage(false);
        }
      }
    };

    fetchRejectionDetails();
  }, [isOpen, lineItem]);

  if (!isOpen || !lineItem) return null;

  const orderedQty = lineItem.orderedQuantity || lineItem.quantity || 0;
  const receivedQty = lineItem.receivedQuantity || 0;
  const maxRejectable = orderedQty - receivedQty;

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setQuantityToReject("");
      setError("");
      return;
    }
    const numValue = parseInt(value, 10);

    if (numValue > maxRejectable) {
      setError(`Cannot reject ${numValue}. Max available: ${maxRejectable}`);
    } else if (numValue < 0) {
      setError("Quantity cannot be negative.");
    } else {
      setError("");
    }
    setQuantityToReject(numValue);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size too large (Max 2MB)");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsViewingExistingImage(false);
      setError("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setIsViewingExistingImage(false);
  };

  const getFinalReason = () => {
    if (selectedReason === "Others") {
      return `Others: ${customReason}`;
    }
    return selectedReason;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error) return;

    // Safety check for empty input
    if (quantityToReject === "" || quantityToReject < 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    // --- SCENARIO FIX: If Quantity is 0 (Reverting rejection) ---
    if (quantityToReject === 0) {
      // If quantity is 0, we treat it as "No Rejection".
      // We send empty reason and null image regardless of what is typed.
      onSubmit(0, "", null);
      return;
    }

    // --- Standard Logic for Quantity > 0 ---
    const finalReason = getFinalReason();

    // Validate "Others" text only if quantity > 0
    if (selectedReason === "Others" && !customReason.trim()) {
      setError("Please specify the reason for 'Others'.");
      return;
    }

    if (imageFile) {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        onSubmit(quantityToReject, finalReason, base64String);
      };
    } else {
      // If no new file, but viewing existing? Send null to preserve (backend logic dependent)
      // or if deleted?
      // Assuming onSubmit handles (qty, reason, imageBase64).
      // Typically null image means "no change" or "remove" depending on your backend.
      // Since we want to update the REASON, we send null for image if not changing.
      onSubmit(quantityToReject, finalReason, null);
    }
  };

  const inputStyles =
    "block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  const hasChanges =
    quantityToReject !== originalQty ||
    (quantityToReject > 0 &&
      getFinalReason().trim() !== originalReason.trim()) ||
    imageFile !== null ||
    (lineItem.hasRejectImage && !isViewingExistingImage && !imageFile);

  // Helper boolean for UI state
  const isNoRejection = quantityToReject === 0 || quantityToReject === "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {originalQty > 0 ? "Edit Rejection Details" : "Reject Items"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Product Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 uppercase font-bold tracking-wide">
              Product
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {lineItem.productName}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500">Ordered</span>
                <span className="font-medium">{orderedQty}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-green-600">Received</span>
                <span className="font-medium">{receivedQty}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-red-500">Currently Rejected</span>
                <span className="font-medium">
                  {lineItem.rejectedQuantity || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Quantity to Reject <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={maxRejectable}
                value={quantityToReject}
                onChange={handleQuantityChange}
                className={`${inputStyles} ${error ? "border-red-500" : ""}`}
              />
            </div>
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}

            {/* Visual feedback for 0 quantity */}
            {isNoRejection && originalQty > 0 && (
              <p className="text-green-600 text-xs mt-1 font-medium">
                Setting quantity to 0 will remove the rejection status.
              </p>
            )}
          </div>

          {/* Reason Section - DISABLED IF QTY IS 0 */}
          <div
            className={`transition-opacity duration-200 ${
              isNoRejection
                ? "opacity-50 pointer-events-none grayscale"
                : "opacity-100"
            }`}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason{" "}
              {isNoRejection && (
                <span className="font-normal text-gray-500">
                  (Not required for 0 quantity)
                </span>
              )}
            </label>

            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isNoRejection}
              className={`${inputStyles} mb-2 bg-white`}
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {selectedReason === "Others" && (
              <div className="animate-fadeIn">
                <textarea
                  rows="3"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  disabled={isNoRejection}
                  placeholder="Enter specific reason..."
                  className={inputStyles}
                />
              </div>
            )}
          </div>

          {/* Image Upload - DISABLED IF QTY IS 0 */}
          <div
            className={`transition-opacity duration-200 ${
              isNoRejection
                ? "opacity-50 pointer-events-none grayscale"
                : "opacity-100"
            }`}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proof Image
            </label>

            {isLoadingImage ? (
              <div className="w-full h-24 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500">Loading image...</p>
              </div>
            ) : !imagePreview ? (
              // UPLOAD STATE
              <div className="flex items-center justify-center w-full">
                <label
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg ${
                    isNoRejection ? "" : "cursor-pointer hover:bg-gray-100"
                  } bg-gray-50 transition`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FaUpload className="text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">
                      Click to upload proof
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={isNoRejection}
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            ) : (
              // PREVIEW STATE
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      isViewingExistingImage
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isViewingExistingImage
                      ? "Current Saved Image"
                      : "New Image to Upload"}
                  </span>
                  <button
                    type="button"
                    disabled={isNoRejection}
                    onClick={removeImage}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove / Replace
                  </button>
                </div>

                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 group bg-gray-100 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-auto object-contain"
                  />
                  {!isNoRejection && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end p-4 border-t bg-gray-50 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!!error || isLoadingImage}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm shadow-sm disabled:opacity-50"
          >
            {hasChanges ? "Update Rejection" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectItemModal;
