import React from "react";

const TotalPos = ({
  payment,
  paymentType,
  totalQuantity,
  totalAmount,
  discountType,
  discountValue,
  discountAmount,
  change,
  onDiscountTypeChange,
  onDiscountValueChange,
  onPaymentChange,
  onPaymentTypeChange,
  adjustedTotalAmount,
  preparedBy,
  checkedBy,
  terms,
  onDateChange,
  onPreparedByChange,
  onCheckedByChange,
  onTermsChange,
  date,
  otherPaymentReason,
  onOtherPaymentReasonChange,
}) => {
  // ... (your existing handler logic remains the same)
  const handlePaymentTypeSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "Others") {
      onPaymentTypeChange(`Others: ${otherPaymentReason || ""}`);
    } else {
      onPaymentTypeChange(selectedValue);
      if (onOtherPaymentReasonChange) {
        onOtherPaymentReasonChange("");
      }
    }
  };

  const handleOtherReasonInputChange = (e) => {
    const reason = e.target.value;
    if (onOtherPaymentReasonChange) {
      onOtherPaymentReasonChange(reason);
    }
    onPaymentTypeChange(`Others: ${reason}`);
  };

  const showOtherPaymentInput =
    paymentType && paymentType.startsWith("Others:");
  const selectPaymentTypeValue =
    paymentType && paymentType.startsWith("Others:") ? "Others" : paymentType;

  return (
    // Main container with vertical spacing
    <div className="w-full space-y-8 border-t pt-4">
      {/* --- Transaction Details Section --- */}
      <div>
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">
          Transaction Details
        </h3>
        {/* Responsive Grid: 1 column on mobile, 2 on medium screens and up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 text-sm font-semibold">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 text-sm font-semibold">
              Terms:
            </label>
            <input
              list="termsOptions"
              value={terms}
              onChange={(e) => onTermsChange(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
              placeholder="e.g., 15 days, 30 days"
            />
            <datalist id="termsOptions">
              <option value="15 days" />
              <option value="30 days" />
            </datalist>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 text-sm font-semibold">
              Prepared By:
            </label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => onPreparedByChange(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
              placeholder="Enter name"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 text-sm font-semibold">
              Checked By:
            </label>
            <input
              type="text"
              value={checkedBy}
              onChange={(e) => onCheckedByChange(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
              placeholder="Enter name"
            />
          </div>
        </div>
      </div>

      {/* --- Discount & Payment Section --- */}
      <div>
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">
          Discount & Payment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 text-sm font-semibold">
              Discount Type:
            </label>
            <select
              value={discountType}
              onChange={(e) => onDiscountTypeChange(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
            >
              <option value="">Select Discount Type</option>
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
          {/* Conditionally render Discount Value section */}
          {discountType && (
            <div className="flex flex-col space-y-1">
              <label className="text-gray-600 text-sm font-semibold">
                Discount Value:
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => onDiscountValueChange(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
                placeholder="Enter discount value"
              />
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label
              htmlFor="paymentTypeSelect"
              className="text-gray-600 text-sm font-semibold"
            >
              Payment Type:
            </label>
            <select
              id="paymentTypeSelect"
              value={selectPaymentTypeValue}
              onChange={handlePaymentTypeSelectChange}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
              required
            >
              <option value="" disabled>
                Select Payment Type
              </option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Gcash">Gcash</option>
              <option value="Debit/Credit Card">Debit/Credit Card</option>
              <option value="Cheque">Cheque</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-gray-600 text-sm font-semibold">
              Payment Received:
            </label>
            <input
              type="number"
              value={payment}
              onChange={(e) => onPaymentChange(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
              placeholder="Enter payment amount"
            />
          </div>
        </div>

        {showOtherPaymentInput && (
          <div className="mt-4 flex flex-col space-y-1">
            <label
              htmlFor="otherPaymentReason"
              className="text-gray-600 text-sm font-semibold"
            >
              Specify Other Payment:
            </label>
            <input
              type="text"
              id="otherPaymentReason"
              value={otherPaymentReason}
              onChange={handleOtherReasonInputChange}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm global-search-input"
              placeholder="Enter details for 'Others'"
            />
          </div>
        )}
      </div>

      {/* --- Total Summary Section --- */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-1">
          Total Summary
        </h3>

        <div className="p-4 bg-white rounded-xl shadow-md space-y-3 text-sm">
          {/* Quantity */}
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">Total Quantity</span>
            <span className="font-mono">{totalQuantity}</span>
          </div>

          {/* Discount */}
          {discountType && (
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">
                Discount (
                {discountType === "percentage" ? `${discountValue}%` : "Fixed"})
              </span>
              <span className="font-mono text-red-500">
                -{" "}
                {discountAmount.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-gray-800 text-base border-t pt-2">
            <span className="font-semibold">Total Amount</span>
            <span className="font-semibold font-mono">
              {adjustedTotalAmount.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </span>
          </div>

          {/* Change */}
          <div className="flex justify-between text-green-600 text-base font-semibold border-t pt-2">
            <span>Change / Balance</span>
            <span className="font-mono">
              {change.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalPos;
