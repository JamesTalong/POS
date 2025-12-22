import React, { useCallback, useEffect, useState } from "react";
import AddEmployee from "./AddEmployee";
import ViewEmployeeModal from "./ViewEmployeeModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loader from "../../../loader/Loader";
import { domain } from "../../../../security";

const AllEmployees = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false); // --- NEW --- State for loading single employee details
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeToView, setEmployeeToView] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const apiUrl = `${domain}/api/Employees`;

    try {
      const response = await axios.get(apiUrl);
      setEmployeeData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const results = employeeData.filter((employee) => {
      const fullName = `${employee.firstName || ""} ${
        employee.middleName || ""
      } ${employee.lastName || ""}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    setFilteredEmployees(results);
    setCurrentPage(1);
  }, [searchTerm, employeeData]);

  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    const apiUrl = `${domain}/api/Employees/${id}`;
    try {
      await axios.delete(apiUrl);
      toast.success("Employee Successfully Deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete Employee.");
    }
  };

  // --- MODIFIED --- Handlers for Add/Edit Modal
  const openModal = async (employee = null) => {
    // If we are adding a new employee, just open the modal
    if (!employee) {
      setEmployeeToEdit(null);
      setIsModalVisible(true);
      return;
    }

    // If we are editing, first fetch the full employee details
    setIsDetailLoading(true);
    try {
      const response = await axios.get(
        `${domain}/api/Employees/${employee.id}`
      );
      setEmployeeToEdit(response.data); // Use the complete data from the API
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to fetch employee details for editing.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEmployeeToEdit(null);
  };

  // --- MODIFIED --- Handlers for View Modal
  const openViewModal = async (employee) => {
    setIsDetailLoading(true);
    try {
      const response = await axios.get(
        `${domain}/api/Employees/${employee.id}`
      );
      setEmployeeToView(response.data); // Use the complete data from the API
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to fetch employee details for viewing.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeViewModal = () => {
    setEmployeeToView(null);
  };

  // Pagination Logic
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
      {/* --- NEW --- Loader for fetching single employee details */}
      {isDetailLoading && <Loader />}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-800 mb-8 tracking-tight">
        All Employees
      </h1>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
        >
          ➕ Add New Employee
        </button>
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="🔍 Search by Employee Name..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
          <AddEmployee
            onClose={closeModal}
            refreshData={fetchData}
            employeeToEdit={employeeToEdit}
          />
        </div>
      )}

      {/* Render the View Modal */}
      {employeeToView && (
        <ViewEmployeeModal employee={employeeToView} onClose={closeViewModal} />
      )}

      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Employment Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500 text-lg"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  currentEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {`${employee.firstName} ${employee.lastName}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            employee.employmentStatus === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {employee.employmentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openViewModal(employee)}
                            className="text-green-600 hover:text-green-900 font-medium py-1 px-3 rounded-md border border-green-600 hover:border-green-900 transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal(employee)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium py-1 px-3 rounded-md border border-indigo-600 hover:border-indigo-900 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900 font-medium py-1 px-3 rounded-md border border-red-600 hover:border-red-900 transition"
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

      {totalPages > 1 && (
        <nav
          className="flex justify-center items-center space-x-2 mt-8"
          aria-label="Pagination"
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`min-w-[40px] px-4 py-2 rounded-lg text-sm font-semibold transition ${
                currentPage === i + 1
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default AllEmployees;
