import React, { useState, useEffect } from "react";
import axios from "axios";
import { domain } from "../../../../security";

const SelectedSerialModal = ({ product, onClose, onSave }) => {
  const [unsoldSerials, setUnsoldSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSerials, setSelectedSerials] = useState(new Set());

  useEffect(() => {
    const fetchSerials = async () => {
      try {
        const apiUrl = `${domain}/api/Pricelists`;
        const response = await axios.get(apiUrl, {
          headers: { "Content-Type": "application/json" },
        });

        // Filter pricelists based on product.id
        const selectedPricelist = response.data.find(
          (pricelist) => pricelist.id === product.id
        );

        if (!selectedPricelist) {
          setError("No matching pricelist found.");
          setUnsoldSerials([]);
        } else {
          // Consolidate serial numbers from all batches
          const allSerialNumbers = selectedPricelist.batches.flatMap(
            (batch) => batch.serialNumbers
          );

          const hasSerial = selectedPricelist.batches.flatMap(
            (batch) => batch.hasSerial
          );

          console.log(hasSerial);

          // Filter unsold serials
          const transformedData = allSerialNumbers
            .filter((serial) => !serial.isSold)
            .map((serial) => ({
              id: serial.id,
              serialName: serial.serialName,
            }));

          setUnsoldSerials(transformedData);
        }
      } catch (err) {
        console.error("Error fetching serials:", err);
        setError("Failed to load serials. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (product) {
      fetchSerials();
    }
  }, [product]);

  // Filter serials based on search query
  const filteredSerials = unsoldSerials.filter((serial) =>
    (serial.serialName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckboxChange = (serialId) => {
    setSelectedSerials((prevSelected) => {
      const newSet = new Set(prevSelected);

      if (newSet.has(serialId)) {
        newSet.delete(serialId);
      } else if (newSet.size < product.quantity) {
        newSet.add(serialId);
      } else {
        alert(`You can only select up to ${product.quantity} serials.`);
      }

      return newSet;
    });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const firstMatchingSerial = filteredSerials[0]; // Get the first matching serial
      if (firstMatchingSerial) {
        setSelectedSerials((prevSelected) => {
          const newSet = new Set(prevSelected);
          if (newSet.size < product.quantity) {
            newSet.add(firstMatchingSerial.id);
          } else {
            alert(`You can only select up to ${product.quantity} serials.`);
          }
          return newSet;
        });
        setSearchQuery(""); // Clear the search field
      } else {
        alert("Serial not found.");
      }
    }
  };

  const handleSave = async () => {
    const totalSelected = Array.from(selectedSerials).length;

    if (totalSelected < product.quantity) {
      alert(
        `Not enough serials selected. Required: ${product.quantity}, Selected: ${totalSelected}`
      );
      return;
    }

    // const payload = {
    //   pricelistId: product.id,
    //   serialNumbers: Array.from(selectedSerials),
    // };

    try {
      const deleteUrl = `${domain}/api/SerialTemps/by-pricelist/${product.id}`;
      await axios.delete(deleteUrl);

      // Pass the selected serials back to the parent
      onSave(product.id, Array.from(selectedSerials));
    } catch (error) {
      console.error(
        "Error handling SerialTemps operations:",
        error.response?.data || error
      );
      alert("Failed to save selected serials. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Select Serial Numbers</h2>
        <p>
          Selected {selectedSerials.size} of {product.quantity} serials.
        </p>
        <input
          type="text"
          placeholder="Search serial numbers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown} // Add this line
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md global-search-input"
        />
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : loading ? (
          <p>Loading...</p>
        ) : filteredSerials.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            {filteredSerials.map((serial) => (
              <div key={serial.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`serial-${serial.id}`}
                  className="mr-2"
                  checked={selectedSerials.has(serial.id)}
                  onChange={() => handleCheckboxChange(serial.id)}
                />
                <label htmlFor={`serial-${serial.id}`}>
                  {serial.serialName || "(Empty Serial)"}
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p>No serial numbers available.</p>
        )}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectedSerialModal;
