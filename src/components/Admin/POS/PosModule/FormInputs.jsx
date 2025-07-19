import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import Loader from "../../../loader/Loader";
import AddCustomer from "./AddCustomer";
import { domain } from "../../../../security";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPencilAlt } from "@fortawesome/free-solid-svg-icons";

// NOTE: No changes needed to the logic of this component, only the z-index of its modal.
const FormInputs = ({ onCustomerSelect }) => {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState("Walk-In");
  const [searchQuery, setSearchQuery] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Customers`;
    try {
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setCustomerData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch customers.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteCustomer = async (id) => {
    const apiUrl = `${domain}/api/Customers/${id}`;
    try {
      await axios.delete(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer.");
    }
  };

  const openModal = (customer = null) => {
    setCustomerToEdit(customer);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setCustomerToEdit(null);
  };

  const handleRowClick = (customer) => {
    setSelectedCustomer(customer);
    onCustomerSelect(customer);
  };

  const filteredData = customerData
    .filter((item) => item.customerType === viewMode)
    .filter((item) =>
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex flex-col h-full">
      <ToastContainer />
      <h1 className="text-2xl font-semibold text-center text-gray-600">
        All Customers
      </h1>
      <button
        onClick={() => openModal()}
        className="bg-blue-600 text-white px-4 py-2 rounded-md m-4 self-start"
      >
        Add Customer
      </button>
      <p className="text-[10px] text-gray-700 px-4 ">
        Click on a table row to select a customer before clicking the
        <span className="font-medium">"Save"</span> button.
      </p>

      <div className="flex items-center gap-4 m-4">
        <label className="text-gray-600 font-medium">View Mode:</label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="viewMode"
              value="Walk-In"
              checked={viewMode === "Walk-In"}
              onChange={() => setViewMode("Walk-In")}
            />{" "}
            Walk-In
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="viewMode"
              value="Client"
              checked={viewMode === "Client"}
              onChange={() => setViewMode("Client")}
            />{" "}
            Client
          </label>
        </div>
      </div>

      <div className="flex justify-center my-4 px-4">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded-md px-4 py-2 w-full md:w-1/2 global-search-input"
        />
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-30">
          <div className="bg-white p-8 rounded-lg">
            <AddCustomer
              onClose={closeModal}
              refreshData={fetchData}
              customerToEdit={customerToEdit}
            />
          </div>
        </div>
      )}

      <div className="flex-grow overflow-auto rounded-lg shadow-md mx-4">
        {loading ? (
          <Loader />
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 bg-gray-50 sticky top-0 z-[1]">
              <tr>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3 hidden md:table-cell">Address</th>
                <th className="px-6 py-3 hidden md:table-cell">TIN Number</th>
                {/* CHANGE 1: Hide the Mobile Number header on mobile screens */}
                <th className="px-6 py-3 hidden md:table-cell">
                  Mobile Number
                </th>
                <th className="px-6 py-3 hidden md:table-cell">
                  Business Style
                </th>
                <th className="px-6 py-3 hidden md:table-cell">RFID</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className={`bg-white border-b cursor-pointer ${
                    selectedCustomer?.id === item.id
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleRowClick(item)}
                >
                  {/* CHANGE 2: Conditionally render this cell's content based on screen size */}
                  <td className="px-6 py-4">
                    {/* This div will contain both name and number on mobile */}
                    <div>
                      <div className="font-semibold text-gray-800">
                        {item.customerName}
                      </div>
                      {/* Show the mobile number here ONLY on mobile screens */}
                      <div className="text-xs text-gray-500 md:hidden">
                        ({item.mobileNumber})
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {item.address}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {item.tinNumber}
                  </td>
                  {/* CHANGE 3: The original mobile number cell is now ONLY visible on medium screens and up */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    {item.mobileNumber}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {item.businessStyle}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {item.rfid}
                  </td>
                  <td className="px-6 py-4">
                    {isMobile ? (
                      <div className="flex items-center justify-center gap-5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomer(item.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-lg"
                          title="Delete Customer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(item);
                          }}
                          className="text-green-600 hover:text-green-800 text-lg"
                          title="Edit Customer"
                        >
                          <FontAwesomeIcon icon={faPencilAlt} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomer(item.id);
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(item);
                          }}
                          className="bg-green-600 text-white px-2 py-1 rounded ml-2"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FormInputs;
