import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import {
  addToPos,
  increasePosQuantity,
  setExistingLocation,
  selectLastModifiedProducts, // Correct import
} from "../../../../redux/IchthusSlice";
import { ImPlus } from "react-icons/im";
import profile from "../../../../Images/profile.jpg";
import { domain } from "../../../../security";

const PaginationPos = ({
  itemsPerPage,
  onPriceRangeChange,
  currentPriceRange,
}) => {
  const [itemOffset, setItemOffset] = useState(0);
  const [pricelists, setPricelists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [priceType, setPriceType] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]); // Used only for search
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const dispatch = useDispatch();
  const lastModifiedProducts = useSelector(selectLastModifiedProducts);
  const posProducts = useSelector((state) => state.orebiReducer.posProducts);
  const refreshProducts = useSelector(
    (state) => state.orebiReducer.refreshProducts
  );
  const checkedBrands = useSelector(
    (state) => state.orebiReducer.checkedBrands
  );
  const checkedCategories = useSelector(
    (state) => state.orebiReducer.checkedCategories
  );
  const checkedCategoriesTwo = useSelector(
    (state) => state.orebiReducer.checkedCategoriesTwo
  );
  const checkedCategoriesThree = useSelector(
    (state) => state.orebiReducer.checkedCategoriesThree
  );
  const checkedCategoriesFour = useSelector(
    (state) => state.orebiReducer.checkedCategoriesFour
  );
  const checkedCategoriesFive = useSelector(
    (state) => state.orebiReducer.checkedCategoriesFive
  );

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const fetchPricelists = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${domain}/api/Pricelists`);
      const formattedPricelists = response.data.map((item) => ({
        ...item,
        productImage: item.productImage
          ? item.productImage.startsWith("http")
            ? item.productImage
            : `data:image/jpeg;base64,${item.productImage}`
          : profile,
      }));
      setPricelists(formattedPricelists);
    } catch (error) {
      toast.error("Failed to fetch pricelists. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricelists();
  }, [refreshProducts]);

  useEffect(() => {
    if (pricelists.length > 0 && priceType) {
      const prices = pricelists
        .map((item) => item[priceType])
        .filter((price) => typeof price === "number");

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        if (minPrice !== maxPrice) {
          onPriceRangeChange([minPrice, maxPrice]);
        } else {
          onPriceRangeChange([minPrice, maxPrice + 1]);
        }
      } else {
        onPriceRangeChange([0, 0]);
      }
    } else {
      onPriceRangeChange([0, 0]);
    }
  }, [pricelists, priceType, onPriceRangeChange]);

  useEffect(() => {
    const savedLocation = localStorage.getItem("locationFilter");
    const savedPriceType = localStorage.getItem("priceType");
    if (savedLocation) setLocationFilter(savedLocation);
    if (savedPriceType) setPriceType(savedPriceType);
  }, []);

  // *** FIX: Reset pagination to page 1 whenever any filter changes ***
  useEffect(() => {
    setItemOffset(0);
  }, [
    checkedBrands,
    checkedCategories,
    checkedCategoriesTwo,
    checkedCategoriesThree,
    checkedCategoriesFour,
    checkedCategoriesFive,
    locationFilter,
    currentPriceRange,
    searchQuery,
  ]);

  const handleLocationChange = (e) => {
    const selectedLocation = e.target.value;
    if (posProducts.length > 0) {
      toast.error(
        "Cannot change location while items are in POS. Please clear POS first."
      );
      return;
    }
    setLocationFilter(selectedLocation);
    localStorage.setItem("locationFilter", selectedLocation);
    setSearchQuery("");
    setFilteredProducts([]);
    // The useEffect above will handle resetting itemOffset
  };

  const handlePriceTypeChange = (e) => {
    const selectedPriceType = e.target.value;
    if (posProducts.length > 0) {
      toast.error(
        "Cannot change price type while items are in POS. Please clear POS first."
      );
      return;
    }
    setPriceType(selectedPriceType);
    localStorage.setItem("priceType", selectedPriceType);
  };

  // *** REVISED LOGIC: Apply ALL filters first to get one final list ***
  const fullyFilteredItems = (
    searchQuery ? filteredProducts : pricelists
  ).filter((item) => {
    // 1. Location Filter
    const locationMatches =
      locationFilter === "All Locations" || item.location === locationFilter;
    if (!locationMatches) return false;

    // 2. Price Range Filter
    const price = item[priceType];
    const priceMatches =
      price >= currentPriceRange[0] && price <= currentPriceRange[1];
    if (!priceMatches) return false;

    // 3. Brand Filter
    const brandMatches =
      checkedBrands.length === 0 ||
      checkedBrands.some((brand) => brand.id === item.brandId);
    if (!brandMatches) return false;

    // 4. Category Filters
    const categoryMatches =
      checkedCategories.length === 0 ||
      checkedCategories.some((category) => category.id === item.categoryId);
    if (!categoryMatches) return false;

    const categoryTwoMatches =
      checkedCategoriesTwo.length === 0 ||
      checkedCategoriesTwo.some(
        (categoryTwo) => categoryTwo.id === item.categoryTwoId
      );
    if (!categoryTwoMatches) return false;

    const categoryThreeMatches =
      checkedCategoriesThree.length === 0 ||
      checkedCategoriesThree.some(
        (categoryThree) => categoryThree.id === item.categoryThreeId
      );
    if (!categoryThreeMatches) return false;

    const categoryFourMatches =
      checkedCategoriesFour.length === 0 ||
      checkedCategoriesFour.some(
        (categoryFour) => categoryFour.id === item.categoryFourId
      );
    if (!categoryFourMatches) return false;

    const categoryFiveMatches =
      checkedCategoriesFive.length === 0 ||
      checkedCategoriesFive.some(
        (categoryFive) => categoryFive.id === item.categoryFiveId
      );
    if (!categoryFiveMatches) return false;

    // If all checks pass, include the item
    return true;
  });

  // *** FIX: Calculate pageCount based on the final, fully filtered list ***
  const pageCount = Math.ceil(fullyFilteredItems.length / itemsPerPage);

  // *** FIX: Slice the final, fully filtered list to get items for the current page ***
  const currentItems = fullyFilteredItems.slice(
    itemOffset,
    itemOffset + itemsPerPage
  );

  const handlePageClick = (event) => {
    const newOffset =
      (event.selected * itemsPerPage) % (fullyFilteredItems.length || 1);
    setItemOffset(newOffset);
  };

  const handleAddToPos = useCallback(
    async (item) => {
      if (!priceType) {
        toast.error("Please select a price type before adding items.");
        return;
      }
      try {
        if (posProducts.length === 0) {
          const deleteUrl = `${domain}/api/SerialTemps/by-pricelist/${item.id}`;
          await axios.delete(deleteUrl);
        }

        if (posProducts.length > 0) {
          const existingLocation = posProducts[0].location;
          if (item.location !== existingLocation) {
            toast.error(
              `You can only add items with the same location (${existingLocation}).`
            );
            return;
          }

          const existingPriceType = posProducts[0].vatType;
          if (existingPriceType && existingPriceType !== priceType) {
            toast.error(
              `You can only add items with the same price type (${existingPriceType}).`
            );
            return;
          }
        }

        const existingItem = posProducts.find(
          (posItem) => posItem.id === item.id
        );
        if (existingItem) {
          dispatch(increasePosQuantity({ id: item.id }));
          toast.info("Item quantity updated in POS.");
          return;
        }

        const unsoldCount = item.batches.reduce(
          (total, batch) =>
            total +
            batch.serialNumbers.filter((serial) => !serial.isSold).length,
          0
        );

        dispatch(
          setExistingLocation({ id: item.locationId, location: item.location })
        );
        dispatch(
          addToPos({
            id: item.id,
            ItemCode: item.itemCode,
            image: item.productImage,
            name: item.product,
            productId: item.productId,
            quantity: 1,
            location: item.location,
            locationId: item.locationId,
            price: item[priceType],
            vatType: priceType,
            hasSerial: item.hasSerial,
            maxQuantity: unsoldCount,
          })
        );
      } catch (error) {
        console.error("Error in handleAddToPos:", error.response || error);
        toast.error("An error occurred while adding the item.");
      }
    },
    [posProducts, priceType, dispatch]
  );

  const searchInputRef = useRef(null);

  const handleSearchChange = useCallback(
    (e) => {
      const query = e.target.value;
      setSearchQuery(query);

      // The main search filter logic remains the same
      if (query) {
        const results = pricelists.filter(
          (item) =>
            !item.batches.every((batch) =>
              batch.serialNumbers.every((serial) => serial.isSold)
            ) &&
            (item.barCode?.toLowerCase().includes(query.toLowerCase()) ||
              item.itemCode?.toLowerCase().includes(query.toLowerCase()) ||
              item.product?.toLowerCase().includes(query.toLowerCase()))
        );
        setFilteredProducts(results);
      } else {
        setFilteredProducts([]);
      }
      // The useEffect will handle resetting itemOffset
    },
    [pricelists]
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && fullyFilteredItems.length > 0) {
      handleAddToPos(fullyFilteredItems[0]); // Add the first item from the final filtered list
      setSearchQuery("");
      setFilteredProducts([]);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isAnySearchInputFocused =
        document.activeElement &&
        document.activeElement.classList.contains("global-search-input");

      if (e.key === "Enter") {
        if (fullyFilteredItems.length > 0) {
          // Check the final filtered list
          handleAddToPos(fullyFilteredItems[0]);
        } else {
          if (searchQuery) {
            toast.error(
              "No matching products found or all items are out of stock."
            );
          }
        }
        setSearchQuery("");
        setFilteredProducts([]);
        if (searchInputRef.current) searchInputRef.current.value = "";
      } else if (!isAnySearchInputFocused) {
        if (e.key.length === 1 || e.key === "Backspace") {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            let newInputValue = searchInputRef.current.value;
            newInputValue =
              e.key === "Backspace"
                ? newInputValue.slice(0, -1)
                : newInputValue + e.key;
            // No need to call setSearchQuery and handleSearchChange here, as the input's onChange will do it
          }
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [fullyFilteredItems, handleAddToPos, handleSearchChange, searchQuery]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);

  const uniqueLocations = [
    "All Locations",
    ...new Set(pricelists.map((item) => item.location)),
  ];

  return (
    <div>
      {selectedImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
          onClick={closeImageModal}
        >
          <img
            src={selectedImage}
            alt="Product full view"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-center p-10">Loading Products...</p>
      ) : (
        <div className="p-2 md:p-4">
          <div className="relative w-full mb-4">
            <input
              ref={searchInputRef}
              type="text"
              className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 global-search-input"
              placeholder="Search by Barcode, Item Code, or Product..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          {!priceType && !locationFilter && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
              role="alert"
            >
              <p className="font-bold">Action Required</p>
              <p>Please select a price type and location to view products.</p>
            </div>
          )}

          <div className="flex flex-row gap-2 mb-4">
            <select
              className={`border rounded-md p-2 text-sm w-full md:w-auto md:flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${
                !priceType
                  ? "border-red-500 text-red-500 font-semibold"
                  : "border-gray-300 text-black"
              }`}
              value={priceType}
              onChange={handlePriceTypeChange}
            >
              <option value="" disabled>
                Select Price Type
              </option>
              <option value="vatEx">VAT Exclusive</option>
              <option value="vatInc">VAT Inclusive</option>
              <option value="reseller">Reseller</option>
              <option value="zeroRated">Zero Rated</option>
            </select>
            <select
              className={`border rounded-md p-2 text-sm w-full md:w-auto md:flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ${
                !locationFilter
                  ? "border-red-500 text-red-500 font-semibold"
                  : "border-gray-300 text-black"
              }`}
              value={locationFilter}
              onChange={handleLocationChange}
            >
              <option value="" disabled>
                Select Location
              </option>
              <option value="All Locations">All Locations</option>
              {uniqueLocations
                .filter((loc) => loc !== "All Locations")
                .map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <div className="md:hidden space-y-3">
              {/* *** FIX: Map over `currentItems` which is the correct, paginated list *** */}
              {currentItems.map((item, index) => {
                const allSold =
                  item.batches.length > 0 &&
                  item.batches.every((batch) =>
                    batch.serialNumbers.every((serial) => serial.isSold)
                  );
                const unsoldCount = item.batches.reduce(
                  (total, batch) =>
                    total + batch.serialNumbers.filter((s) => !s.isSold).length,
                  0
                );
                const isOutOfStock = allSold || unsoldCount === 0;
                const lastModifiedItem = lastModifiedProducts.find(
                  (p) => p.id === item.id
                );
                const isDisabled =
                  isOutOfStock ||
                  (lastModifiedItem &&
                    lastModifiedItem.quantity >= unsoldCount);

                return (
                  <div
                    key={`${item.id}-${index}-mobile`}
                    className={`border rounded-md shadow p-1 bg-white ${
                      isOutOfStock ? "bg-red-50 opacity-80" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-1">
                      {/* Image with SOLD OUT label */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {isOutOfStock && (
                          <p className="absolute -top-1 -left-1 text-white bg-red-600 px-1 py-[1px] text-[8px] font-bold rounded-sm leading-none">
                            SOLD OUT
                          </p>
                        )}
                        <img
                          src={item.productImage}
                          alt={item.product}
                          className="w-full h-full object-cover rounded-sm cursor-pointer"
                          onClick={() => openImageModal(item.productImage)}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-col justify-between min-w-0 flex-grow text-[11px]">
                        <div>
                          <p className="font-semibold truncate leading-tight">
                            {item.product}
                          </p>
                          <p className="text-gray-500 truncate">
                            {item.itemCode}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <div className="flex flex-col">
                            {priceType && item.hasOwnProperty(priceType) ? (
                              <span className="text-blue-600 font-bold text-[11px] leading-none">
                                {formatCurrency(item[priceType])}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">
                                No Price
                              </span>
                            )}

                            <span
                              className={`text-[10px] ${
                                isOutOfStock
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-600"
                              }`}
                            >
                              {isOutOfStock
                                ? "Out of Stock"
                                : `Stocks: ${unsoldCount}`}
                            </span>
                          </div>

                          {/* Action Button */}
                          <button
                            className={`w-8 h-6 flex items-center justify-center rounded-full text-white text-[10px] transition-colors duration-300 ${
                              isDisabled
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                            onClick={() => !isDisabled && handleAddToPos(item)}
                            disabled={isDisabled}
                          >
                            <ImPlus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-xs text-left">Product</th>
                    <th className="py-2 px-4 text-xs text-center">Location</th>
                    <th className="py-2 px-4 text-xs text-center">VAT Ex</th>
                    <th className="py-2 px-4 text-xs text-center">VAT Inc</th>
                    <th className="py-2 px-4 text-xs text-center">Reseller</th>
                    <th className="py-2 px-4 text-xs text-center">
                      Zero Rated
                    </th>
                    <th className="py-2 px-4 text-xs text-center">Stocks</th>
                    <th className="py-2 px-4 text-xs text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* *** FIX: Map over `currentItems` which is the correct, paginated list *** */}
                  {currentItems.map((item, index) => {
                    const allSold =
                      item.batches.length > 0 &&
                      item.batches.every((b) =>
                        b.serialNumbers.every((s) => s.isSold)
                      );
                    const unsoldCount = item.batches.reduce(
                      (total, batch) =>
                        total +
                        batch.serialNumbers.filter((s) => !s.isSold).length,
                      0
                    );
                    const isOutOfStock = allSold || unsoldCount === 0;
                    const lastModifiedItem = lastModifiedProducts.find(
                      (p) => p.id === item.id
                    );
                    const isDisabled =
                      isOutOfStock ||
                      (lastModifiedItem &&
                        lastModifiedItem.quantity >= unsoldCount);

                    return (
                      <tr
                        key={`${item.id}-${index}`}
                        className={`border-t border-gray-200 hover:bg-gray-50 ${
                          isOutOfStock ? "bg-red-50" : ""
                        }`}
                      >
                        <td className="py-2 px-4 text-xs text-left">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.productImage}
                              alt={item.product}
                              className="w-12 h-12 object-cover rounded cursor-pointer"
                              onClick={() => openImageModal(item.productImage)}
                            />
                            <div>
                              <p className="font-semibold">{item.product}</p>
                              <p className="text-gray-500">{item.itemCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-xs text-center">
                          {item.location}
                        </td>
                        <td
                          className={`py-2 px-4 text-xs text-center font-mono ${
                            priceType === "vatEx" ? "bg-blue-100 font-bold" : ""
                          }`}
                        >
                          {formatCurrency(item.vatEx)}
                        </td>
                        <td
                          className={`py-2 px-4 text-xs text-center font-mono ${
                            priceType === "vatInc"
                              ? "bg-blue-100 font-bold"
                              : ""
                          }`}
                        >
                          {formatCurrency(item.vatInc)}
                        </td>
                        <td
                          className={`py-2 px-4 text-xs text-center font-mono ${
                            priceType === "reseller"
                              ? "bg-blue-100 font-bold"
                              : ""
                          }`}
                        >
                          {formatCurrency(item.reseller)}
                        </td>
                        <td
                          className={`py-2 px-4 text-xs text-center font-mono ${
                            priceType === "zeroRated"
                              ? "bg-blue-100 font-bold"
                              : ""
                          }`}
                        >
                          {formatCurrency(item.zeroRated)}
                        </td>
                        <td className="py-2 px-4 text-xs text-center">
                          {isOutOfStock ? (
                            <span className="text-red-500 font-semibold">
                              Out of Stock
                            </span>
                          ) : (
                            <span>{unsoldCount}</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-xs text-center">
                          <button
                            className={`text-blue-500 hover:text-primeColor duration-300 ${
                              isDisabled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => !isDisabled && handleAddToPos(item)}
                            disabled={isDisabled}
                          >
                            <ImPlus size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center md:justify-end items-center py-6">
            <ReactPaginate
              // *** FIX: Add forcePage prop to reset the displayed page when filters change ***
              forcePage={pageCount > 0 ? itemOffset / itemsPerPage : -1}
              nextLabel="→"
              previousLabel="←"
              onPageChange={handlePageClick}
              pageRangeDisplayed={2}
              marginPagesDisplayed={1}
              pageCount={pageCount}
              pageLinkClassName="w-8 h-8 text-sm border-[1px] border-lightColor hover:border-gray-500 duration-300 flex justify-center items-center"
              pageClassName="mx-0.5"
              previousLinkClassName="w-8 h-8 border-[1px] border-lightColor hover:border-gray-500 duration-300 flex justify-center items-center rounded-md"
              nextLinkClassName="w-8 h-8 border-[1px] border-lightColor hover:border-gray-500 duration-300 flex justify-center items-center rounded-md"
              containerClassName="flex text-base font-semibold font-titleFont items-center"
              activeClassName="bg-black text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginationPos;
