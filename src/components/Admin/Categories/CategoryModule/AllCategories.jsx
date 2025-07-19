import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../../../loader/Loader"; // Assuming this is a valid path
import AddCategories from "../CategoryModule/AddCategories"; // Assuming this is a valid path
import axios from "axios";
import { domain } from "../../../../security"; // Assuming this is a valid path

const AllCategories = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [CategoryToEdit, setCategoryToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Categories`;
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setCategoryData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch categories.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = categoryData.filter((category) =>
      category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(results);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, categoryData]);

  const deleteCategory = async (id) => {
    const apiUrl = `${domain}/api/Categories/${id}`;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) {
      return;
    }
    try {
      await axios.delete(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Category Successfully Deleted!");
      fetchData(); // Refresh data after deletion
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category.");
    }
  };

  const openModal = (category = null) => {
    setCategoryToEdit(category);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setCategoryToEdit(null);
    fetchData(); // Refresh data when modal closes (after add/edit)
  };

  // Pagination Logic
  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(
    indexOfFirstCategory,
    indexOfLastCategory
  );

  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

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
        All Categories 📚
      </h1>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* Add Category Button */}
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-base"
        >
          <span className="inline md:hidden">➕ Add</span>{" "}
          {/* Visible only on screens smaller than md */}
          <span className="hidden md:inline">➕ Add New Category</span>{" "}
          {/* Hidden on screens smaller than md, visible on md+ */}
        </button>

        {/* Search Input */}
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="🔍 Search by Category Name..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Modal for Add/Edit Category */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
            <AddCategories
              onClose={closeModal}
              refreshData={fetchData}
              CategoryToEdit={CategoryToEdit}
            />
          </div>
        </div>
      )}

      {/* Category Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        {loading ? (
          <Loader /> // Display loader while data is being fetched
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Category Name
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
                {currentCategories.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan="2"
                      className="px-6 py-4 text-center text-gray-500 text-lg"
                    >
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  currentCategories.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.categoryName}
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
                            onClick={() => deleteCategory(item.id)}
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

export default AllCategories;
