import { useState, useEffect, useMemo } from "react";
import Pagination from "../Pagination"; // Assuming this component is well-styled
import Loader from "../../loader/Loader"; // Assuming this is a good-looking loader
import useInventoryData from "./useInventoryData";
import SummaryCard from "./SummaryCard"; // Original SummaryCard for larger screens
import MobileSummaryCards from "./MobileSummaryCards"; // New component for mobile
import InventoryFilters from "./InventoryFilters";
import InventoryTable from "./InventoryTable";
import {
  formatPrice,
  LocationIcon,
  OutOfStockIcon,
  PRICE_TYPES,
  ProductIcon,
  ValueIcon,
} from "./Constant";

// --- Constants ---
const ITEMS_PER_PAGE = 8;

// Helper function to format numbers for mobile display (already exists, but good to keep)
const formatForMobile = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }
  return value.toString();
};

// Helper function to format currency for mobile (already exists, but good to keep)
const formatCurrencyForMobile = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }
  return value.toFixed(2);
};

// --- Main Dashboard Component ---
const InventoryCost = () => {
  const {
    pricelists, // Get the original pricelists to apply stock filter
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedLocation,
    setSelectedLocation,
    locations,
    priceType,
    setPriceType,
  } = useInventoryData();

  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState("all"); // 'all', 'outOfStock', 'withStock'
  const [isMobile, setIsMobile] = useState(false); // New state for mobile detection

  // Effect to determine if the screen is mobile (md breakpoint or below)
  useEffect(() => {
    const checkIsMobile = () => {
      // Tailwind's 'md' breakpoint is typically 768px.
      // We'll set it to true if the screen width is less than or equal to 768px.
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Filtering logic moved here to apply stock filter before pagination
  const filteredPricelists = useMemo(() => {
    let tempItems = pricelists;
    if (selectedLocation && selectedLocation !== "All") {
      tempItems = tempItems.filter(
        (item) =>
          item.location?.trim().toLowerCase() ===
          selectedLocation.trim().toLowerCase()
      );
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery?.toLowerCase();
      tempItems = tempItems?.filter(
        (item) =>
          item.product?.toLowerCase()?.includes(lowerCaseQuery) ||
          item.code?.toLowerCase()?.includes(lowerCaseQuery) ||
          (typeof item.brand === "string" &&
            item.brand.toLowerCase().includes(lowerCaseQuery))
      );
    }

    // Apply stock filter
    if (stockFilter === "outOfStock") {
      tempItems = tempItems.filter((item) => item.unsoldCount === 0);
    } else if (stockFilter === "withStock") {
      tempItems = tempItems.filter((item) => item.unsoldCount > 0);
    }

    return tempItems;
  }, [pricelists, searchQuery, selectedLocation, stockFilter]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentData = useMemo(
    () => filteredPricelists.slice(indexOfFirstItem, indexOfLastItem),
    [filteredPricelists, indexOfFirstItem, indexOfLastItem]
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation, priceType, stockFilter]);

  const totalInventoryValue = useMemo(() => {
    return filteredPricelists.reduce((sum, item) => {
      const price = parseFloat(item[priceType]) || 0;
      return sum + price * item.unsoldCount;
    }, 0);
  }, [filteredPricelists, priceType]);

  const totalUniqueProducts = useMemo(() => {
    return new Set(filteredPricelists.map((p) => p.product)).size;
  }, [filteredPricelists]);

  const itemsOutOfStock = useMemo(() => {
    return filteredPricelists.filter((item) => item.unsoldCount === 0).length;
  }, [filteredPricelists]);

  const activeLocationsCount = useMemo(() => {
    return locations.length > 1 ? locations.length - 1 : 0; // excluding "All"
  }, [locations]);

  console.log("Filtering by location:", selectedLocation);
  console.log("Available locations in data:", [
    ...new Set(pricelists.map((p) => p.location)),
  ]);

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 min-h-screen">
      <header className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
          Inventory Dashboard 📊
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          Manage and analyze your inventory costs and stock levels.
        </p>
      </header>

      {/* --- Summary Metrics - Conditional Rendering --- */}
      {isMobile ? (
        <MobileSummaryCards
          totalInventoryValue={totalInventoryValue}
          totalUniqueProducts={totalUniqueProducts}
          activeLocationsCount={activeLocationsCount}
          itemsOutOfStock={itemsOutOfStock}
          priceType={priceType} // Pass priceType if needed for labeling
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <SummaryCard
            title={`Total Value (${PRICE_TYPES[priceType]?.label})`}
            value={formatPrice(totalInventoryValue)}
            mobileValue={formatCurrencyForMobile(totalInventoryValue)} // This isn't used in SummaryCard directly, but kept from original
            icon={<ValueIcon />}
          />
          <SummaryCard
            title="Unique Products"
            value={totalUniqueProducts.toLocaleString()}
            mobileValue={formatForMobile(totalUniqueProducts)} // This isn't used in SummaryCard directly, but kept from original
            icon={<ProductIcon />}
          />
          <SummaryCard
            title="Active Locations"
            value={activeLocationsCount.toLocaleString()}
            mobileValue={formatForMobile(activeLocationsCount)} // This isn't used in SummaryCard directly, but kept from original
            icon={<LocationIcon />}
          />
          <SummaryCard
            title="Out of Stock"
            value={itemsOutOfStock.toLocaleString()}
            mobileValue={formatForMobile(itemsOutOfStock)} // This isn't used in SummaryCard directly, but kept from original
            icon={<OutOfStockIcon />}
            bgColor={itemsOutOfStock > 0 ? "bg-red-50" : "bg-white"}
          />
        </div>
      )}

      {/* --- Filters --- */}
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        locations={locations}
        selectedPriceType={priceType}
        onPriceTypeChange={setPriceType}
        stockFilter={stockFilter} // Pass new prop
        onStockFilterChange={setStockFilter} // Pass new prop
      />

      {/* --- Inventory Table --- */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : currentData.length > 0 ? (
        <>
          <InventoryTable data={currentData} priceType={priceType} />
          <div className="mt-6 flex justify-center">
            <Pagination
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={filteredPricelists.length}
              paginate={paginate}
              currentPage={currentPage}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="mt-4 text-xl font-semibold text-gray-700">
            No products found.
          </p>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryCost;
