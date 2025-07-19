import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import Loader from "../../../loader/Loader";
import AddBrands from "./AddBrands";
import Pagination from "../../Pagination";
import { domain } from "../../../../security";

const AllBrands = () => {
  const [brandData, setBrandData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [brandsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBrands, setFilteredBrands] = useState([]);

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Brands`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setBrandData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch brands.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = brandData.filter((brand) =>
      brand.brandName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBrands(results);
    setCurrentPage(1);
  }, [searchTerm, brandData]);

  const deleteBrand = async (id) => {
    const apiUrl = `${domain}/api/Brands/${id}`;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this ?"
    );

    if (!confirmDelete) {
      return; // Exit the function if the user cancels
    }
    try {
      await axios.delete(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand.");
    }
  };

  const openModal = (brand = null) => {
    setBrandToEdit(brand);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setBrandToEdit(null);
  };

  const indexOfLastBrand = currentPage * brandsPerPage;
  const indexOfFirstBrand = indexOfLastBrand - brandsPerPage;
  const currentBrands = filteredBrands.slice(
    indexOfFirstBrand,
    indexOfLastBrand
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <ToastContainer />
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center text-gray-600 leading-tight font-raleway">
        All Brands
      </h1>
      <div className="flex justify-between items-center m-4">
        <button
          onClick={() => openModal()}
          className="bg-orange-600 text-white text-sm font-bodyFont px-4 py-2 hover:bg-orange-700 duration-300 font-semibold rounded-md"
        >
          Add Brand
        </button>
        <div className="flex flex-col sm:flex-row justify-center items-center w-full mb-6">
          <div className="w-full sm:w-1/2 mb-4 sm:mb-0">
            <input
              type="text"
              placeholder="Search by Brand Name"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
          <div className="bg-white p-8 rounded-lg max-h-screen overflow-y-auto">
            <AddBrands
              onClose={closeModal}
              refreshData={fetchData}
              brandToEdit={brandToEdit}
            />
          </div>
        </div>
      )}
      <div className="relative overflow-x-auto">
        {loading ? (
          <Loader />
        ) : (
          <>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Brand
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentBrands.map((item) => (
                  <tr
                    key={item.id}
                    className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      {item.brandName}
                    </th>
                    <td className="px-2 py-4">
                      <div className="inline-flex">
                        <button
                          onClick={() => deleteBrand(item.id)}
                          className="bg-orange-600 hover:bg-orange-800 text-gray-800 font-bold py-2 px-4 rounded-l"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openModal(item)}
                          className="bg-green-600 hover:bg-green-800 text-gray-800 font-bold py-2 px-4 rounded-r"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-4">
              <nav className="inline-flex rounded-md shadow">
                <Pagination
                  itemsPerPage={brandsPerPage}
                  totalItems={filteredBrands.length} // Corrected line
                  currentPage={currentPage}
                  paginate={paginate}
                />
              </nav>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllBrands;
