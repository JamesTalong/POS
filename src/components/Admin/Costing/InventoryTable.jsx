import React, { useState } from "react";
import { formatPrice, PRICE_TYPES } from "./Constant";
import noImage from "../../../Images/noImage.jpg"; // Fallback for onError

const InventoryTable = ({ data, priceType, onRowClick }) => {
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [selectedMobilePrice, setSelectedMobilePrice] = useState(priceType);

  const getCategoryDisplay = (item) => {
    const categories = [
      item.brand?.brandName,
      item.category?.categoryName,
      item.categoryTwo?.categoryTwoName,
      item.categoryThree?.categoryThreeName,
      item.categoryFour?.categoryFourName,
      item.categoryFive?.categoryFiveName,
    ].filter(Boolean);
    return categories.join(", ");
  };

  // Mobile Card Component
  const MobileCard = ({ item, index }) => {
    const currentPricePerUnit = parseFloat(item[selectedMobilePrice]) || 0;
    const totalValue = currentPricePerUnit * item.unsoldCount;
    const isOutOfStock = item.unsoldCount === 0;

    return (
      <div
        key={item.id ? `${item.id}-${index}` : index}
        className={`bg-white rounded-lg shadow-md p-4 mb-4 border ${
          isOutOfStock ? "border-red-200 bg-red-50" : "border-gray-200"
        }`}
        onClick={() => onRowClick && onRowClick(item)}
      >
        <div className="flex items-start space-x-3">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <img
              src={item.productImage}
              alt={item.product || "Product Image"}
              className="w-16 h-16 object-cover rounded-md shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = noImage;
              }}
            />
            {isOutOfStock && (
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[8px] font-bold py-0.5 px-1 rounded-full shadow">
                OUT
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {item.product}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {item.itemCode} • {item.barCode}
            </p>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {getCategoryDisplay(item)}
            </p>

            {/* Price and Quantity Row */}
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm">
                <span className="font-medium text-blue-600">
                  {formatPrice(currentPricePerUnit)}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({PRICE_TYPES[selectedMobilePrice]?.label})
                </span>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    isOutOfStock ? "text-red-600" : "text-green-600"
                  }`}
                >
                  QTY: {isOutOfStock ? "0" : item.unsoldCount}
                </div>
                <div className="text-xs text-gray-600">
                  Total: {formatPrice(totalValue)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Price Selector */}
      <div className="block md:hidden mb-4">
        <div className="relative">
          <button
            onClick={() => setShowPriceDropdown(!showPriceDropdown)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="font-medium">
              Price: {PRICE_TYPES[selectedMobilePrice]?.label}
            </span>
            <span className="float-right">▼</span>
          </button>
          {showPriceDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
              {Object.values(PRICE_TYPES).map((pt) => (
                <button
                  key={pt.key}
                  onClick={() => {
                    setSelectedMobilePrice(pt.key);
                    setShowPriceDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedMobilePrice === pt.key
                      ? "bg-blue-50 text-blue-600"
                      : ""
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden">
        {data.map((item, index) => (
          <MobileCard
            key={item.id ? `${item.id}-${index}` : index}
            item={item}
            index={index}
          />
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto bg-white shadow-xl rounded-lg">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-200 sticky top-0">
            <tr>
              <th scope="col" className="py-3 px-4">
                Item Code
              </th>
              <th scope="col" className="py-3 px-4">
                Image
              </th>
              <th scope="col" className="py-3 px-4">
                Product & Category
              </th>
              <th scope="col" className="py-3 px-4">
                Location
              </th>
              {Object.values(PRICE_TYPES).map((pt) => (
                <th
                  key={pt.key}
                  scope="col"
                  className={`py-3 px-4 text-center ${
                    priceType === pt.key ? "bg-blue-200" : ""
                  }`}
                >
                  {pt.label}
                </th>
              ))}
              <th scope="col" className="py-3 px-4 text-center">
                Available Qty
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                Total Value ({PRICE_TYPES[priceType]?.label})
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const currentPricePerUnit = parseFloat(item[priceType]) || 0;
              const totalValue = currentPricePerUnit * item.unsoldCount;
              const isOutOfStock = item.unsoldCount === 0;

              return (
                <tr
                  key={item.id ? `${item.id}-${index}` : index}
                  className={`border-b hover:bg-gray-100 transition-colors duration-150 ${
                    isOutOfStock ? "bg-red-50" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  <td className="py-3 px-4 font-medium">
                    {item.itemCode}
                    <p className="text-gray-500 text-xs">[{item.barCode}]</p>
                  </td>
                  <td className="py-2 px-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <img
                        src={item.productImage}
                        alt={item.product || "Product Image"}
                        className="w-16 h-16 object-cover rounded-md shadow-sm"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = noImage;
                        }}
                      />
                      {isOutOfStock && (
                        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold py-0.5 px-2 rounded-full shadow">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold">{item.product}</p>
                    <p className="text-gray-500 text-xs italic">
                      {getCategoryDisplay(item)}
                    </p>
                  </td>
                  <td className="py-3 px-4">{item.location}</td>
                  {Object.values(PRICE_TYPES).map((pt) => (
                    <td
                      key={pt.key}
                      className={`py-3 px-4 text-center ${
                        priceType === pt.key
                          ? "font-semibold text-blue-700 bg-blue-50"
                          : ""
                      }`}
                    >
                      {formatPrice(item[pt.key])}
                    </td>
                  ))}
                  <td
                    className={`py-3 px-4 text-center font-semibold ${
                      isOutOfStock ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isOutOfStock ? "Out of Stock" : item.unsoldCount}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">
                    {formatPrice(totalValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InventoryTable;
