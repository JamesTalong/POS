import React, { useCallback, useEffect, useState } from "react";
import AddLocations from "./AddLocations";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import Loader from "../../../loader/Loader"; // Assuming this path is correct for your custom Loader component
import { domain } from "../../../../security";

const AllLocations = () => {
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationToEdit, setLocationToEdit] = useState(null); // Changed initial state to null for clarity
  const [isModalVisible, setIsModalVisible] = useState(false); // Changed initial state to false
  const [currentPage, setCurrentPage] = useState(1);
  const [locationsPerPage] = useState(10); // Number of items per page
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Locations`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setLocationData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Locations.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter locations based on search term whenever data or search term changes
  useEffect(() => {
    const results = locationData.filter((location) =>
      location.locationName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLocations(results);
    setCurrentPage(1); // Reset to the first page when search term changes
  }, [searchTerm, locationData]);

  const deleteLocation = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this location?"
    );

    if (!confirmDelete) {
      return; // Exit the function if the user cancels
    }

    const apiUrl = `${domain}/api/Locations/${id}`;
    try {
      await axios.delete(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Location Successfully Deleted!");
      fetchData(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete Location.");
    }
  };

  const openModal = (location = null) => {
    setLocationToEdit(location);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setLocationToEdit(null);
    fetchData(); // Refresh data after closing modal (e.g., after add/edit)
  };

  // Pagination Logic
  const indexOfLastLocation = currentPage * locationsPerPage;
  const indexOfFirstLocation = indexOfLastLocation - locationsPerPage;
  const currentLocations = filteredLocations.slice(
    indexOfFirstLocation,
    indexOfLastLocation
  );

  const totalPages = Math.ceil(filteredLocations.length / locationsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8  min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-800 mb-8 tracking-tight font-raleway">
        All Locations 📍
      </h1>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* Add Location Button */}
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-base"
        >
          <span className="inline md:hidden">➕ Add</span>{" "}
          {/* Visible only on screens smaller than md */}
          <span className="hidden md:inline">➕ Add New Location</span>{" "}
          {/* Hidden on screens smaller than md, visible on md+ */}
        </button>

        {/* Search Input */}
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="🔍 Search by Location Name..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Modal for Add/Edit Location */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
            <AddLocations
              onClose={closeModal}
              refreshData={fetchData}
              locationToEdit={locationToEdit}
            />
          </div>
        </div>
      )}

      {/* Locations Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        {loading ? (
          <Loader /> // Display Loader component
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Location Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLocations.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan="2"
                      className="px-6 py-4 text-center text-gray-500 text-lg"
                    >
                      No locations found.
                    </td>
                  </tr>
                ) : (
                  currentLocations.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.locationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openModal(item)}
                            className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 font-medium py-1 px-3 rounded-md border border-indigo-600 hover:border-indigo-900 transition duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLocation(item.id)}
                            className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 font-medium py-1 px-3 rounded-md border border-red-600 hover:border-red-900 transition duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex justify-center items-center space-x-2 mt-8"
          aria-label="Pagination"
        >
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`min-w-[40px] px-4 py-2 rounded-lg text-sm font-semibold transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                currentPage === index + 1
                  ? "bg-purple-600 text-white shadow-md focus:ring-purple-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default AllLocations;
