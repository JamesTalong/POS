import React, { useState } from "react";

const ItemComparisonTable = ({ groupedData, onRowClick }) => {
  const [selectedUoms, setSelectedUoms] = useState({});

  // Helper to get the specific variant based on dropdown selection
  const getActiveItem = (group) => {
    const selectedId = selectedUoms[group.key];
    if (selectedId) {
      const found = group.variants.find(
        (v) => v.uomId === parseInt(selectedId)
      );
      if (found) return found;
    }
    return group.variants[0]; // Default to first variant
  };

  const handleUomChange = (groupKey, newUomId) => {
    setSelectedUoms((prev) => ({ ...prev, [groupKey]: parseInt(newUomId) }));
  };

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="py-3 px-4 w-1/4">Product Details</th>
            <th className="py-3 px-4 text-center">Unit</th>

            {/* Good Stock Column */}
            <th className="py-3 px-4 text-center bg-green-50 text-green-800 border-l border-green-100">
              Good Stock
              <span className="block text-[10px] font-normal text-green-600 normal-case">
                (Available / Unsold)
              </span>
            </th>

            {/* Bad/Other Stock Column */}
            <th className="py-3 px-4 text-center bg-red-50 text-red-800 border-l border-red-100">
              Other Status
              <span className="block text-[10px] font-normal text-red-600 normal-case">
                (Sold / Damaged / Return)
              </span>
            </th>

            {/* Visual Ratio */}
            <th className="py-3 px-4 text-center w-1/5">Health Ratio</th>

            {/* Action */}
            <th className="py-3 px-4 text-center">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {groupedData.map((group) => {
            const activeItem = getActiveItem(group);

            // Logic: Unsold = Good/Available. Sold = Everything else (Sold, Damaged, Lost)
            const goodStock = activeItem.unsoldCount || 0;
            const badStock = activeItem.soldCount || 0;
            const total = goodStock + badStock;

            // Calculate percentage for the bar
            const goodPercent = total > 0 ? (goodStock / total) * 100 : 0;

            return (
              <tr
                key={group.key}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick && onRowClick(activeItem)}
              >
                {/* Product Name & Code */}
                <td className="py-3 px-4">
                  <div className="font-bold text-gray-800">
                    {activeItem.product}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {activeItem.itemCode}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 mt-1">
                    {activeItem.location}
                  </span>
                </td>

                {/* Unit Selector */}
                <td className="py-3 px-4 text-center">
                  {group.variants.length > 1 ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={activeItem.uomId}
                        onChange={(e) =>
                          handleUomChange(group.key, e.target.value)
                        }
                        className="block w-full py-1 pl-2 pr-6 text-xs border-gray-300 rounded shadow-sm focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                      >
                        {group.variants.map((v) => (
                          <option key={v.uniqueId} value={v.uomId}>
                            {v.uomName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-medium">
                      {activeItem.uomName}
                    </span>
                  )}
                </td>

                {/* Good Stock Data */}
                <td className="py-3 px-4 text-center bg-green-50/20 border-l border-green-50">
                  <span className="text-lg font-bold text-green-600">
                    {goodStock}
                  </span>
                </td>

                {/* Bad Stock Data */}
                <td className="py-3 px-4 text-center bg-red-50/20 border-l border-red-50">
                  <span className="text-lg font-bold text-red-600">
                    {badStock}
                  </span>
                </td>

                {/* Visual Bar Graph */}
                <td className="py-3 px-4 align-middle">
                  <div className="w-full bg-red-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-green-500 h-2.5 rounded-l-full transition-all duration-500 ease-out"
                      style={{ width: `${goodPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    <span>{goodPercent.toFixed(0)}% Good</span>
                    <span>{(100 - goodPercent).toFixed(0)}% Other</span>
                  </div>
                </td>

                {/* Action Button */}
                <td className="py-3 px-4 text-center">
                  <button className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Check History
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ItemComparisonTable;
