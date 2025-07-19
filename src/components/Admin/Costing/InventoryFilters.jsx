import React, { useMemo } from "react";
import MobileDropdown from "./MobileDropdown"; // Make sure path is correct
import { PRICE_TYPES } from "./Constant";

const InventoryFilters = ({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  locations,
  selectedPriceType,
  onPriceTypeChange,
  stockFilter,
  onStockFilterChange,
}) => {
  const locationOptions = useMemo(
    () =>
      locations.map((loc) => ({
        value: loc,
        label: loc === "All" || !loc ? "All Locations" : loc,
        icon: <div className="w-3 h-3 bg-blue-500 rounded-full" />,
      })),
    [locations]
  );

  const stockOptions = [
    {
      value: "all",
      label: "All Items",
      icon: <div className="w-3 h-3 bg-purple-500 rounded-full" />,
    },
    {
      value: "withStock",
      label: "In Stock",
      icon: <div className="w-3 h-3 bg-green-500 rounded-full" />,
    },
    {
      value: "outOfStock",
      label: "Out of Stock",
      icon: <div className="w-3 h-3 bg-red-500 rounded-full" />,
    },
  ];

  const priceTypeOptions = Object.values(PRICE_TYPES).map((pt) => ({
    value: pt.key,
    label: pt.label,
    icon: <div className="w-3 h-3 bg-yellow-500 rounded-full" />,
  }));

  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-slate-800 shadow-md rounded-lg">
      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-3">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search-query-mobile"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
          >
            Search
          </label>
          <input
            id="search-query-mobile"
            type="text"
            placeholder="Product, code, brand..."
            className="p-2.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* MobileDropdowns */}
        <MobileDropdown
          label="Location"
          value={selectedLocation}
          onChange={onLocationChange}
          options={locationOptions}
          searchable
        />
        <MobileDropdown
          label="Stock"
          value={stockFilter}
          onChange={onStockFilterChange}
          options={stockOptions}
        />
        <MobileDropdown
          label="Price Type"
          value={selectedPriceType}
          onChange={onPriceTypeChange}
          options={priceTypeOptions}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Product, code, brand..."
              className="p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 w-full"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Location
            </label>
            <select
              className="p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 w-full"
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location || "All Locations"}
                </option>
              ))}
            </select>
          </div>

          {/* Price Type */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Price Type
            </label>
            <select
              className="p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 w-full"
              value={selectedPriceType}
              onChange={(e) => onPriceTypeChange(e.target.value)}
            >
              {Object.values(PRICE_TYPES).map((pt) => (
                <option key={pt.key} value={pt.key}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Stock Status
            </label>
            <select
              className="p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 w-full"
              value={stockFilter}
              onChange={(e) => onStockFilterChange(e.target.value)}
            >
              <option value="all">All Items</option>
              <option value="withStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;
