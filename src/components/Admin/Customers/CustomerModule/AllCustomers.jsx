import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Plus, Search, User, Briefcase, Pencil, Trash2 } from "lucide-react";

// Keep your existing components
import Loader from "../../../loader/Loader";
import AddCustomers from "./AddCustomers";
import { domain } from "../../../../security";

// Import the new card component for mobile view
import CustomerCard from "./CustomerCard";

const AllCustomers = () => {
  // ... (All your existing state and functions remain exactly the same)
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState("Walk-In");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${domain}/api/Customers`, {
        headers: { "Content-Type": "application/json" },
      });
      setCustomerData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      await axios.delete(`${domain}/api/Customers/${id}`, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Customer successfully deleted!");
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
  };

  const filteredData = customerData
    .filter((item) => item.customerType === viewMode)
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8  min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <div className="max-w-7xl mx-auto">
        {/* --- Header & Title --- */}
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          All Customers
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your client and walk-in customer information.
        </p>

        {/* --- Controls Bar --- */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Segmented Control for View Mode */}
          <div className="p-1 bg-slate-200 rounded-lg flex">
            <button
              onClick={() => setViewMode("Walk-In")}
              className={`w-full flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                viewMode === "Walk-In"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100/50"
              }`}
            >
              <User size={16} /> Walk-In
            </button>
            <button
              onClick={() => setViewMode("Client")}
              className={`w-full flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                viewMode === "Client"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100/50"
              }`}
            >
              <Briefcase size={16} /> Client
            </button>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>

        {/* --- Search & Info Bar --- */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${viewMode}s...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 px-1">
            Click on a customer to select them for other operations.
          </p>
        </div>

        {/* --- Content Area --- */}
        <div className="mt-6">
          {loading ? (
            <Loader />
          ) : (
            <>
              {/* ---------------------------------- */}
              {/* ---- DESKTOP VIEW: TABLE ---- */}
              {/* ---------------------------------- */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                      <th className="px-6 py-3">Customer Name</th>
                      <th className="px-6 py-3">Address</th>
                      <th className="px-6 py-3">Mobile Number</th>
                      <th className="px-6 py-3">TIN</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className={`border-b border-slate-200 cursor-pointer transition-colors ${
                          selectedCustomer?.id === item.id
                            ? "bg-indigo-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {item.customerName}
                        </td>
                        <td className="px-6 py-4">{item.address}</td>
                        <td className="px-6 py-4">{item.mobileNumber}</td>
                        <td className="px-6 py-4">{item.tinNumber}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(item);
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-md"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCustomer(item.id);
                              }}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-md"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ---------------------------------- */}
              {/* ---- MOBILE VIEW: CARDS ---- */}
              {/* ---------------------------------- */}
              <div className="grid grid-cols-1 gap-5 md:hidden">
                {filteredData.map((item) => (
                  <CustomerCard
                    key={item.id}
                    customer={item}
                    isSelected={selectedCustomer?.id === item.id}
                    onSelect={handleRowClick}
                    onEdit={openModal}
                    onDelete={deleteCustomer}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto w-[90vw] max-w-lg">
            <AddCustomers
              onClose={closeModal}
              refreshData={fetchData}
              customerToEdit={customerToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCustomers;
