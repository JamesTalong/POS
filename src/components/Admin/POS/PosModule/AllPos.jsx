// src/components/AllPos.js

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux"; // ADD: Import useSelector
import {
  toggleCategory,
  toggleBrand,
  toggleCategoryTwo,
  toggleCategoryThree, // RE-ADD: Import for Category Three
  toggleCategoryFour, // RE-ADD: Import for Category Four
  toggleCategoryFive, // RE-ADD: Import for Category Five
} from "../../../../redux/IchthusSlice";
import PaginationPos from "./PaginationPos";
import ProductPos from "./ProductPos";
import SearchableFilter from "./SearchableFilter";
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowRightCircle, // ADD: Icon for checkout button
} from "lucide-react";
import { Range } from "react-range";

const MOBILE_BREAKPOINT = 768;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const AllPos = () => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isFilterSectionVisible, setIsFilterSectionVisible] = useState(true);

  // --- STATE LIFTED UP FROM PaginationPos ---
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [currentRange, setCurrentRange] = useState([0, 0]);

  // --- ADD: STATE FOR MOBILE VIEW TOGGLING ---
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const posProducts = useSelector((state) => state.orebiReducer.posProducts);

  useEffect(() => {
    const isDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
    setIsFilterSectionVisible(isDesktop);

    if (window.innerWidth < MOBILE_BREAKPOINT && posProducts.length > 0) {
      setIsCheckoutView(true);
    }
  }, []); // Empty dependency array means this runs once on mount

  // ADD: Reset view when cart becomes empty
  useEffect(() => {
    if (posProducts.length === 0) {
      setIsCheckoutView(false);
    }
  }, [posProducts.length]); // Dependency on posProducts.length

  const handlePriceRangeChange = useCallback((newRange) => {
    setPriceRange(newRange);
    setCurrentRange(newRange); // Also reset the user's slider to the full range
  }, []);

  return (
    <div className="min-h-screen font-sans">
      <div className="max-w-screen-2xl mx-auto">
        {/* --- ADD: Mobile-specific Header Logic --- */}
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
          {/* On mobile, change title based on view */}
          <span className="lg:hidden">
            {isCheckoutView ? "Checkout" : "POS System"}
          </span>
          {/* On desktop, always show "POS System" */}
          <span className="hidden lg:inline">POS System</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* --- LEFT COLUMN: Filters & Product List --- */}
          {/* CHANGE: Add conditional classes to hide on mobile during checkout */}
          <div
            className={`w-full lg:w-3/5 xl:w-2/3 space-y-6 ${
              isCheckoutView ? "hidden lg:block" : "block"
            }`}
          >
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                  <SlidersHorizontal size={20} />
                  Filters
                </h2>
                <button
                  onClick={() =>
                    setIsFilterSectionVisible(!isFilterSectionVisible)
                  }
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  {isFilterSectionVisible ? "Hide Filters" : "Show Filters"}
                  {isFilterSectionVisible ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>

              <div
                className={`transition-all duration-500 ease-in-out ${
                  isFilterSectionVisible
                    ? "max-h-[1000px] mt-4 pt-4 border-t overflow-visible"
                    : "max-h-0 mt-0 pt-0 border-t-0 overflow-hidden"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 ">
                  {/* ... other filters like Category, Brand ... */}
                  <SearchableFilter
                    title="Category"
                    apiEndpoint="/api/Categories"
                    dataKey="categoryName"
                    placeholder="Search categories..."
                    reduxSelector={(state) =>
                      state.orebiReducer.checkedCategories
                    }
                    toggleAction={toggleCategory}
                  />
                  <SearchableFilter
                    title="Brand"
                    apiEndpoint="/api/Brands"
                    dataKey="brandName"
                    placeholder="Search brands..."
                    reduxSelector={(state) => state.orebiReducer.checkedBrands}
                    toggleAction={toggleBrand}
                  />
                  <SearchableFilter
                    title="Category Two"
                    apiEndpoint="/api/CategoriesTwo"
                    dataKey="categoryTwoName"
                    placeholder="Search..."
                    reduxSelector={(state) =>
                      state.orebiReducer.checkedCategoriesTwo
                    }
                    toggleAction={toggleCategoryTwo}
                  />
                </div>

                <div className="mt-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowMoreFilters(!showMoreFilters)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    >
                      {showMoreFilters ? "Less Filters" : "More Filters"}
                      {showMoreFilters ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      showMoreFilters
                        ? "max-h-96 mt-6 pt-6 border-t overflow-visible"
                        : "max-h-0 overflow-hidden"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                      {/* --- RE-ADD: Category Three Filter --- */}
                      <SearchableFilter
                        title="Category Three"
                        apiEndpoint="/api/CategoriesThree"
                        dataKey="categoryThreeName"
                        placeholder="Search category three..."
                        reduxSelector={(state) =>
                          state.orebiReducer.checkedCategoriesThree
                        }
                        toggleAction={toggleCategoryThree}
                      />
                      {/* --- RE-ADD: Category Four Filter --- */}
                      <SearchableFilter
                        title="Category Four"
                        apiEndpoint="/api/CategoriesFour"
                        dataKey="categoryFourName"
                        placeholder="Search..."
                        reduxSelector={(state) =>
                          state.orebiReducer.checkedCategoriesFour
                        }
                        toggleAction={toggleCategoryFour}
                      />
                      {/* --- RE-ADD: Category Five Filter --- */}
                      <SearchableFilter
                        title="Category Five"
                        apiEndpoint="/api/CategoriesFive"
                        dataKey="categoryFiveName"
                        placeholder="Search..."
                        reduxSelector={(state) =>
                          state.orebiReducer.checkedCategoriesFive
                        }
                        toggleAction={toggleCategoryFive}
                      />

                      {/* --- RE-ADD: Price Range Slider UI --- */}
                      {priceRange[0] < priceRange[1] && (
                        <div className="my-4 p-3 border rounded-md md:col-span-2 lg:col-span-3">
                          <label className="text-sm font-medium text-gray-700">
                            Price Range
                          </label>
                          <Range
                            step={1}
                            min={priceRange[0]}
                            max={priceRange[1]}
                            values={currentRange}
                            onChange={setCurrentRange} // Use state setter from AllPos
                            renderTrack={({ props, children }) => (
                              <div
                                {...props}
                                style={{ ...props.style, height: "6px" }}
                                className="w-full rounded-full bg-gray-200 mt-2"
                              >
                                <div
                                  style={{
                                    height: "6px",
                                    width: `${
                                      ((currentRange[1] - currentRange[0]) /
                                        (priceRange[1] - priceRange[0])) *
                                      100
                                    }%`,
                                    marginLeft: `${
                                      ((currentRange[0] - priceRange[0]) /
                                        (priceRange[1] - priceRange[0])) *
                                      100
                                    }%`,
                                  }}
                                  className="bg-blue-500 rounded-full"
                                />
                                {children}
                              </div>
                            )}
                            renderThumb={({ props }) => (
                              <div
                                {...props}
                                style={{ ...props.style }}
                                className="h-4 w-4 bg-blue-500 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                              />
                            )}
                          />
                          <div className="flex justify-between text-xs text-gray-600 mt-2">
                            <span>{formatCurrency(currentRange[0])}</span>
                            <span>{formatCurrency(currentRange[1])}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <PaginationPos
                itemsPerPage={8}
                // --- PASS PROPS DOWN ---
                onPriceRangeChange={handlePriceRangeChange}
                currentPriceRange={currentRange}
              />
            </div>
          </div>

          <div
            className={`w-full lg:w-2/5 xl:w-1/3 ${
              isCheckoutView ? "block" : "hidden lg:block"
            }`}
          >
            <div className="lg:sticky lg:top-6">
              <ProductPos
                // ADD: Pass props for mobile navigation
                isCheckoutView={isCheckoutView}
                onBackToProducts={() => setIsCheckoutView(false)}
              />
            </div>
          </div>
        </div>

        {/* --- ADD: Floating 'Proceed to Checkout' Button for Mobile --- */}
        {posProducts.length > 0 && !isCheckoutView && (
          <button
            onClick={() => setIsCheckoutView(true)}
            className="lg:hidden fixed bottom-5 right-5 z-20 flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-1 px-2 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            <span className="relative">
              <ArrowRightCircle size={24} />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {posProducts.length}
              </span>
            </span>
            <span>Checkout</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AllPos;
