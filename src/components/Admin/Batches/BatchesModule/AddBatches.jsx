import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { domain } from "../../../../security";

const AddBatches = ({ onClose, refreshData, batchToEdit }) => {
  const [formData, setFormData] = useState({
    batchDate: new Date(),
    numberOfItems: 0,
    serialNumbers: [],
    pricelistId: "",
    pricelistName: "",
    hasSerial: false,
  });

  const [pricelists, setPricelists] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    if (batchToEdit) {
      setFormData({
        batchDate: new Date(batchToEdit.batchDate),
        numberOfItems: batchToEdit.serialNumbers?.length || 0,
        serialNumbers:
          batchToEdit.serialNumbers?.map((serial) => ({
            serialName: serial.serialName || "",
            isSold: serial.isSold || false,
          })) || [],
        pricelistId: batchToEdit.pricelistId || "",
        pricelistName: batchToEdit.pricelistName || "",
        hasSerial: batchToEdit.hasSerial || false,
        location: batchToEdit.location || "", // <-- Add this line
      });
    }
  }, [batchToEdit]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoading(true); // Set loading to true before fetching
      try {
        const [pricelistsRes, productsRes] = await Promise.all([
          axios.get(`${domain}/api/Pricelists`),
          axios.get(`${domain}/api/Products`),
        ]);
        setPricelists(pricelistsRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        toast.error("Error fetching dropdown data");
      } finally {
        setIsLoading(false); // Set loading to false after fetching (success or failure)
      }
    };

    fetchDropdownData();
  }, []);

  const handleNumberChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    const updatedSerialNumbers = Array(value).fill({
      serialName: "",
      isSold: false,
    });

    setFormData({
      ...formData,

      numberOfItems: value,
      serialNumbers: updatedSerialNumbers,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (e.key === "Enter") {
      return; // Prevent form submission if Enter key was pressed
    }

    setIsLoading(true);

    const apiUrl = `${domain}/api/Batches`;

    const payload = {
      batchDate: formData.batchDate.toISOString(),
      numberOfItems: formData.numberOfItems,
      pricelistId: parseInt(formData.pricelistId, 10),
      serialNumbers: formData.serialNumbers,
      hasSerial: formData.hasSerial,
    };

    if (payload.numberOfItems <= 0) {
      toast.error("Number of items must be greater than 0.");
      setIsLoading(false);
      return; // Stop the function execution
    }

    // Check if serialNumbers is empty when hasSerial is true
    if (payload.hasSerial) {
      if (!payload.serialNumbers || payload.serialNumbers.length === 0) {
        toast.error(
          "Serial numbers cannot be empty when 'Has Serial' is true."
        );
        setIsLoading(false);
        return;
      }

      // Check if any serialName within serialNumbers is empty
      const hasEmptySerialName = payload.serialNumbers.some(
        (serial) => !serial.serialName || serial.serialName.trim() === ""
      );

      if (hasEmptySerialName) {
        toast.error(
          "All serial numbers must be filled when 'Has Serial' is true."
        );
        setIsLoading(false);
        return;
      }
    }
    try {
      if (batchToEdit) {
        await axios.put(`${apiUrl}/${batchToEdit.id}`, payload, {
          headers: { "Content-Type": "application/json" },
        });

        toast.success("Batch updated successfully");
      } else {
        await axios.post(apiUrl, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Batch added successfully");
      }

      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      toast.error(
        `${batchToEdit ? "Error updating" : "Error adding"} batch: ${
          error.message
        }`
      );
    }
  };

  useEffect(() => {
    // Automatically set hasSerial if pricelist and product are related
    const selectedPricelist = pricelists.find(
      (plist) => plist.id === parseInt(formData.pricelistId, 10)
    );
    if (selectedPricelist) {
      const matchedProduct = products.find(
        (product) => product.id === selectedPricelist.productId
      );
      if (matchedProduct) {
        setFormData((prevData) => ({
          ...prevData,
          hasSerial: matchedProduct.hasSerial,
        }));
      }
    }
  }, [formData.pricelistId, pricelists, products]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const pricelistsRes = await axios.get(`${domain}/api/Pricelists`);
        const uniqueLocations = [
          ...new Set(
            pricelistsRes.data.map((plist) => plist.location).filter(Boolean)
          ),
        ];
        setLocations(uniqueLocations);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationChange = (selectedOption) => {
    setFormData({
      ...formData,
      location: selectedOption ? selectedOption.value : "",
    });
  };

  return (
    <div>
      {isLoading && <Loader />}
      <div className="relative w-full pt-4 py-4 px-12">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-3xl mb-4">
          {batchToEdit ? "Edit Batch" : "Add Batch"}
        </h2>
        <form onSubmit={handleFormSubmit}>
          {/* Batch Date */}

          {/* Batch Date */}
          <div className="mt-5">
            <span>Batch Date</span>
            <DatePicker
              selected={formData.batchDate}
              onChange={(date) => setFormData({ ...formData, batchDate: date })}
              className="border border-gray-400 py-1 px-2 w-full"
            />
          </div>
          {!batchToEdit && (
            <div className="mt-5">
              <span>Sort by Location</span>
              <Select
                options={locations.map((location) => ({
                  value: location,
                  label: location,
                }))}
                value={
                  formData.location
                    ? { value: formData.location, label: formData.location }
                    : null
                }
                onChange={handleLocationChange}
                placeholder="Select Location"
                className="mt-1"
                isSearchable
              />
            </div>
          )}

          {/* Product Select (Function 1) - Updated */}
          <div className="mt-5">
            <span>Product</span>
            <Select
              options={pricelists
                .filter(
                  (pricelist) =>
                    !formData.location ||
                    pricelist.location === formData.location
                )
                .map((pricelist) => ({
                  value: pricelist.id,
                  label: pricelist.product,
                  itemCode: pricelist.itemCode,
                  barCode: pricelist.barCode,
                  productImage: pricelist.productImage,
                  product: pricelist.product,
                  location: pricelist.location,
                }))}
              value={pricelists
                .filter(
                  (pricelist) =>
                    !formData.location ||
                    pricelist.location === formData.location
                )
                .map((pricelist) => ({
                  value: pricelist.id,
                  label: pricelist.product,
                  itemCode: pricelist.itemCode,
                  barCode: pricelist.barCode,
                  productImage: pricelist.productImage,
                  product: pricelist.product,
                  location: pricelist.location,
                }))
                .find(
                  (option) => option.value === parseInt(formData.pricelistId)
                )}
              getOptionLabel={(option) => option.product}
              getOptionValue={(option) => option.value}
              placeholder="Select Pricelist"
              onChange={(selected) => {
                const selectedPricelist = pricelists.find(
                  (plist) => plist.id === selected.value
                );

                setFormData({
                  ...formData,
                  pricelistId: selected.value,
                  pricelistName: selectedPricelist?.pricelistName || "",
                });
              }}
              className="mt-1"
              isSearchable
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-2">
                  <img
                    src={
                      option.productImage
                        ? option.productImage.startsWith("http")
                          ? option.productImage
                          : `data:image/jpeg;base64,${option.productImage}`
                        : "path/to/placeholder/image.jpg"
                    }
                    className="w-6 h-6 rounded"
                    alt={option.product || "Product Image"}
                  />
                  <div>
                    <span className="font-semibold">{option.product}</span>
                    <div className="text-gray-500 text-[8px]">
                      {option.barCode || "No Barcode"} |{" "}
                      {option.itemCode || "No Item Code"}
                    </div>
                    <div className="text-gray-500 text-[8px]">
                      {option.location || "No Location"}
                    </div>
                  </div>
                </div>
              )}
              filterOption={(option, inputValue) => {
                const lowerCaseInput = inputValue.toLowerCase();
                return (
                  option.data.product.toLowerCase().includes(lowerCaseInput) ||
                  (option.data.barCode &&
                    option.data.barCode
                      .toLowerCase()
                      .includes(lowerCaseInput)) ||
                  (option.data.itemCode &&
                    option.data.itemCode.toLowerCase().includes(lowerCaseInput))
                );
              }}
            />
          </div>

          <div className="mt-5">
            <span>Number of Items</span>
            <input
              id="numberOfItems"
              type="number"
              placeholder="Enter number of items"
              className="border border-gray-400 py-1 px-2 w-full"
              value={formData.numberOfItems}
              onChange={handleNumberChange}
            />
          </div>

          {/* Serial Numbers */}
          {formData.hasSerial && (
            <div className="mt-5 max-h-60 overflow-y-auto border rounded p-3 w-80">
              <span>Serial Numbers</span>
              {formData.serialNumbers.map((serial, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Serial Number ${index + 1}`}
                  className="border border-gray-400 py-1 px-2 w-full mb-2"
                  value={serial.serialName}
                  onChange={(e) =>
                    setFormData((prevFormData) => {
                      const updatedSerialNumbers = [
                        ...prevFormData.serialNumbers,
                      ];
                      updatedSerialNumbers[index] = {
                        ...updatedSerialNumbers[index],
                        serialName: e.target.value,
                      };
                      return {
                        ...prevFormData,
                        serialNumbers: updatedSerialNumbers,
                      };
                    })
                  }
                />
              ))}
            </div>
          )}

          <div className="mt-5">
            <button className="w-full bg-orange-600 py-3 text-center text-white">
              {batchToEdit ? "Update Batch" : "Add Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatches;
