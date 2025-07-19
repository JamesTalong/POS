import React, { useCallback, useEffect, useState } from "react";
import noImage from "../../../Images/noImage.jpg"; // Default image
import { domain } from "../../../security";
import axios from "axios";
import { toast } from "react-toastify";
import { PRICE_TYPES } from "./Constant";

const getProductImageUrl = (productImage) => {
  if (!productImage) return noImage;
  if (productImage.startsWith("http")) return productImage; // Valid URL
  return `data:image/jpeg;base64,${productImage}`; // Base64 string
};

// --- Custom Hook for Inventory Data and Logic ---
const useInventoryData = () => {
  const [pricelists, setPricelists] = useState([]);
  const [filteredPricelists, setFilteredPricelists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [locations, setLocations] = useState(["All"]);
  const [priceType, setPriceType] = useState(PRICE_TYPES.vatEx.key);

  const fetchPricelists = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${domain}/api/Pricelists`);
      const formattedPricelists = response.data.map((item) => ({
        ...item,
        productImage: getProductImageUrl(item.productImage),
        // Calculate unsoldCount per item
        unsoldCount: (item.batches || []).reduce(
          (total, batch) =>
            total +
            (batch.serialNumbers || []).filter((serial) => !serial.isSold)
              .length,
          0
        ),
      }));

      setPricelists(formattedPricelists);
      const uniqueLocations = [
        "All",
        ...new Set(
          formattedPricelists.map((item) => item.location).filter(Boolean)
        ),
      ];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Failed to fetch pricelists:", error);
      toast.error("Failed to fetch pricelists. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricelists();
  }, [fetchPricelists]);

  useEffect(() => {
    let filtered = [...pricelists];
    if (selectedLocation !== "All") {
      filtered = filtered.filter(
        (pricelist) => pricelist.location === selectedLocation
      );
    }
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((pricelist) =>
        ["product", "location", "brand", "itemCode", "barCode"].some((key) => {
          const value =
            pricelist[key] || (pricelist.brand && pricelist.brand.brandName); // Handle nested brandName
          return (
            typeof value === "string" &&
            value.toLowerCase().includes(lowercasedQuery)
          );
        })
      );
    }
    setFilteredPricelists(filtered);
  }, [searchQuery, selectedLocation, pricelists]);

  return {
    pricelists,
    filteredPricelists,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedLocation,
    setSelectedLocation,
    locations,
    priceType,
    setPriceType,
  };
};

export default useInventoryData;
