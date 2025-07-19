import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import { domain } from "../../../../security";

const AddSerialNumber = ({ onClose, refreshData, serialToEdit }) => {
  const [formData, setFormData] = useState({
    serialName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (serialToEdit) {
      setFormData({
        serialName: serialToEdit.serialName || "",
      });
    }
  }, [serialToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = domain + "/api/SerialNumbers";

    try {
      if (serialToEdit) {
        // ✅ Merge the original object with updated serialName
        const updatedData = {
          ...serialToEdit,
          serialName: formData.serialName,
        };

        await axios.put(`${apiUrl}/${serialToEdit.id}`, updatedData);
        toast.success("Serial number updated successfully");
      } else {
        await axios.post(apiUrl, formData);
        toast.success("Serial number added successfully");
      }

      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      toast.error("Error processing request: " + error.message);
    }
  };

  return (
    <div className="relative w-full pt-4 py-4 px-12">
      {isLoading && <Loader />}
      <button
        onClick={onClose}
        className="absolute top-2 right-4 text-red-600 text-lg font-bold"
      >
        ×
      </button>

      <h2 className="text-3xl mb-4">
        {serialToEdit ? "Edit Serial Number" : "Add Serial Number"}
      </h2>

      <form onSubmit={handleFormSubmit}>
        <input
          id="serialName"
          type="text"
          placeholder="Enter Serial Number"
          className="border border-gray-400 py-2 px-3 w-full mb-4"
          value={formData.serialName}
          onChange={handleInputChange}
        />

        {serialToEdit && (
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p>
              <strong>Sold:</strong> {serialToEdit.isSold ? "Yes" : "No"}
            </p>
            <p>
              <strong>Batch ID:</strong> {serialToEdit.batchId}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-orange-600 py-3 text-white mt-2"
        >
          {serialToEdit ? "Update Serial Number" : "Add Serial Number"}
        </button>
      </form>
    </div>
  );
};

export default AddSerialNumber;
