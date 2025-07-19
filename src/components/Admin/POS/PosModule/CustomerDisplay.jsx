import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Loader from "../../../loader/Loader";
import { MdClose, MdPerson } from "react-icons/md";
import { clearSelectedCustomer } from "../../../../redux/IchthusSlice";
import { useDispatch } from "react-redux";
import { domain } from "../../../../security";

const CustomerNames = ({ onRefresh }) => {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const dispatch = useDispatch();

  const fetchCustomerData = useCallback(async () => {
    try {
      const response = await axios.get(`${domain}/api/CustomerTemps`, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (data.length > 0) {
        const promises = data.map(async (customer) => {
          const detailsResponse = await axios.get(
            `${domain}/api/Customers/${customer.customerId}`,
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          return {
            ...customer,
            details: detailsResponse.data,
          };
        });

        const detailedCustomerData = await Promise.all(promises);
        setCustomerData(detailedCustomerData);
      } else {
        setCustomerData(data);
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (onRefresh) onRefresh(fetchCustomerData);
  }, [onRefresh, fetchCustomerData]);

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await axios.get(
        `${domain}/api/Customers/${customerId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const customerInfo = response.data;
      setCustomerDetails(customerInfo);
      setPopupVisible(true);
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const deleteCustomer = async (customerId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this ?"
    );
    if (!confirmDelete) {
      return; // Exit the function if the user cancels
    }
    try {
      await axios.delete(
        `${domain}/api/CustomerTemps/by-customer/${customerId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setCustomerData((prev) =>
        prev.filter((c) => c.customerId !== customerId)
      );
      dispatch(clearSelectedCustomer()); // ✅ Correct
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const closePopup = () => {
    setPopupVisible(false);
    setCustomerDetails(null);
  };

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  return (
    <div className="container mx-auto mt-6">
      <h1 className="text-2xl font-semibold text-center text-gray-700">
        Customer{" "}
      </h1>
      <div className="overflow-x-auto shadow-md mt-4 p-4 bg-white rounded-lg">
        {loading ? (
          <Loader />
        ) : customerData.length > 0 ? (
          <ul className="space-y-2">
            {customerData.map((customer) => (
              <li
                key={customer.id}
                className="flex justify-between items-center text-gray-800 cursor-pointer hover:bg-gray-100 px-4 py-2 rounded-md"
              >
                <span
                  onClick={() => fetchCustomerDetails(customer.customerId)}
                  className="flex-grow"
                >
                  {customer?.customerName}

                  <div className="text-xs text-gray-500">
                    {customer.details?.customerType ||
                      "No customer type available"}
                  </div>
                </span>
                <MdClose
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomer(customer.customerId);
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No customers found.</p>
        )}
      </div>

      {popupVisible && customerDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Customer Details
              </h2>
              <button
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <MdClose size={28} />
              </button>
            </div>

            {/* Customer Overview */}
            <div className="flex items-center gap-x-4 mb-4">
              <MdPerson size={36} className="text-blue-500" />
              <div>
                <h6 className="text-lg font-semibold text-gray-800">
                  {customerDetails.customerName}
                </h6>
                <p className="text-sm text-gray-600">
                  {customerDetails.customerType || "No customer type available"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Customer Details */}
            <div className="space-y-4">
              <p className="text-gray-700 text-sm font-mono">
                <strong>Address:</strong> {customerDetails.address}
              </p>
              <p className="text-gray-700 text-sm font-mono">
                <strong>TIN Number:</strong> {customerDetails.tinNumber}
              </p>
              <p className="text-gray-700 text-sm font-mono">
                <strong>Mobile Number:</strong> {customerDetails.mobileNumber}
              </p>
              <p className="text-gray-700 text-sm font-mono">
                <strong>Business Style:</strong> {customerDetails.businessStyle}
              </p>
              <p className="text-gray-700 text-sm font-mono">
                <strong>RFID:</strong> {customerDetails.rfid}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerNames;
