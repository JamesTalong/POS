import React from "react";
import PropTypes from "prop-types";
import { Trash2 } from "lucide-react";

const ProductTable = ({
  paginatedProducts,
  totalPages,
  currentPage,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onDeleteItem,
  onChangePage,
  onOpenSerialModal,
  onUpdateDiscount,
  onUpdateQuantity,
  purchasedSerials,
}) => {
  // Helper function to calculate subtotal, remains the same.
  const calculateSubtotal = (product) => {
    const subtotal = product.quantity * product.price - (product.discount || 0);
    return subtotal < 0
      ? { value: subtotal, warning: true }
      : { value: subtotal, warning: false };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(value) || 0);
  };

  return (
    <div className="mb-10">
      {/* 
        DESKTOP VIEW: TABLE (Unchanged)
      */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr className="bg-gray-100">
              <th className="w-1/4 px-2 py-2 text-left font-medium text-gray-700">
                Name
              </th>
              <th className="w-1/6 px-2 py-2 text-left font-medium text-gray-700">
                Price
              </th>
              <th className="w-1/6 px-2 py-2 text-left font-medium text-gray-700">
                Quantity
              </th>
              <th className="w-1/6 px-2 py-2 text-left font-medium text-gray-700">
                Discount
              </th>
              <th className="w-1/6 px-2 py-2 text-left font-medium text-gray-700">
                Subtotal
              </th>
              <th className="w-1/6 px-2 py-2 text-left font-medium text-gray-700">
                Serial
              </th>
              <th className="w-1/6 px-2 py-2 text-left font-medium text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => {
              const { value: subtotal, warning } = calculateSubtotal(product);
              return (
                <tr
                  key={product.id}
                  className={`border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-600 ${
                    warning ? "bg-red-100 dark:bg-red-900/20" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-sm font-medium">
                    {product.name}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onDecreaseQuantity(product.id)}
                        className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={product.quantity || 0}
                        onChange={(e) =>
                          onUpdateQuantity(product.id, Number(e.target.value))
                        }
                        className="w-14 text-center bg-gray-100 border rounded-md px-2 py-1 global-search-input dark:bg-gray-700 dark:border-gray-600"
                        min={0}
                      />
                      <button
                        onClick={() => onIncreaseQuantity(product.id)}
                        className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={product.discount || 0}
                      onChange={(e) =>
                        onUpdateDiscount(product.id, Number(e.target.value))
                      }
                      className="w-full text-center bg-gray-100 border rounded-md px-2 py-1 global-search-input dark:bg-gray-700 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-3 py-2 text-sm font-semibold">
                    {formatCurrency(subtotal)}
                    {warning && (
                      <span className="text-red-500 text-xs ml-2">
                        Negative!
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {product.hasSerial && (
                      <button
                        onClick={() => onOpenSerialModal(product)}
                        className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600"
                      >
                        {purchasedSerials[product.id] ? "Update" : "Serial"}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onDeleteItem(product.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 inline-flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 
        == AGGRESSIVELY SMALLER MOBILE VIEW ==
        - Uses flexbox to create a dense, multi-row layout.
        - Reduced padding, fonts, and spacing for compactness.
      */}
      <div className="md:hidden space-y-2">
        {paginatedProducts.map((product) => {
          const { value: subtotal, warning } = calculateSubtotal(product);
          return (
            <div
              key={product.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-2 border ${
                warning
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {/* Row 1: Name and Delete */}
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate mr-2">
                  {product.name}
                </h3>
                <button
                  onClick={() => onDeleteItem(product.id)}
                  className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Row 2: Price, Quantity, and Discount controls */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm mt-2">
                {/* Price */}
                <p className="font-semibold text-gray-700 dark:text-gray-200">
                  {formatCurrency(product.price)}
                </p>

                {/* Discount */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Disc:
                  </span>
                  <input
                    type="number"
                    value={product.discount || 0}
                    onChange={(e) =>
                      onUpdateDiscount(product.id, Number(e.target.value))
                    }
                    className="w-16 bg-gray-100 border rounded px-1.5 py-0.5 global-search-input dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDecreaseQuantity(product.id)}
                    className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={product.quantity || 0}
                    onChange={(e) =>
                      onUpdateQuantity(product.id, Number(e.target.value))
                    }
                    className="w-10 text-center bg-gray-100 border rounded px-1 py-0.5 global-search-input dark:bg-gray-700 dark:border-gray-600"
                    min={0}
                  />
                  <button
                    onClick={() => onIncreaseQuantity(product.id)}
                    className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Row 3: Subtotal and Serial Button */}
              <div className="flex justify-between items-center mt-2 pt-2 border-t dark:border-gray-600">
                {/* Subtotal */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total:
                  </span>
                  <p
                    className={`font-bold text-base ${
                      warning
                        ? "text-red-600 dark:text-red-500"
                        : "text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {formatCurrency(subtotal)}
                  </p>
                </div>
                {/* Serial Button */}
                {product.hasSerial && (
                  <button
                    onClick={() => onOpenSerialModal(product)}
                    className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                  >
                    {purchasedSerials[product.id] ? "Update" : "Serial"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION (Common for both views, unchanged) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center my-6 space-x-1">
          {[...Array(totalPages).keys()].map((index) => (
            <button
              key={index}
              onClick={() => onChangePage(index + 1)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentPage === index + 1
                  ? "bg-blue-500 text-white shadow"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// PropTypes remain the same
ProductTable.propTypes = {
  paginatedProducts: PropTypes.array.isRequired,
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onIncreaseQuantity: PropTypes.func.isRequired,
  onDecreaseQuantity: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onChangePage: PropTypes.func.isRequired,
  onOpenSerialModal: PropTypes.func.isRequired,
  onUpdateDiscount: PropTypes.func.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  purchasedSerials: PropTypes.object.isRequired,
};

export default ProductTable;
