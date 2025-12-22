import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../../../loader/Loader";
import AddUsers from "../UserModule/AddUsers";
import axios from "axios";
import { domain } from "../../../../security";

const AllUsers = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const fetchData = useCallback(async () => {
    const apiUrl = `${domain}/api/Users`;
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      // Assuming your data structure is like the example you provided
      // If not, you might need to adjust the properties accessed below
      setUserData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch users.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // UPDATED: Filter users by employeeName instead of userName
    const results = userData.filter((user) =>
      user.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, userData]);

  const deleteUser = async (id) => {
    const apiUrl = `${domain}/api/Users/${id}`;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) {
      return;
    }
    try {
      await axios.delete(apiUrl);
      toast.success("User Successfully Deleted!");
      fetchData(); // Refresh data after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const openModal = (user = null) => {
    setUserToEdit(user);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setUserToEdit(null);
    fetchData(); // Refresh data when modal closes
  };

  // Pagination Logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-800 mb-8 tracking-tight font-raleway">
        System Users
      </h1>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
        >
          ➕ Add New User
        </button>

        <div className="w-full sm:w-1/2">
          <input
            type="text"
            // UPDATED: Changed placeholder text
            placeholder="🔍 Search by Employee Name..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isModalVisible && (
        <AddUsers
          onClose={closeModal}
          refreshData={fetchData}
          userToEdit={userToEdit}
        />
      )}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                {/* --- CHANGES START HERE --- */}
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Employee ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    UserName
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Employee Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Role Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
                {/* --- CHANGES END HERE --- */}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500 text-lg"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* --- CHANGES START HERE --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {user.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.employeeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {user.roleName}
                      </td>
                      {/* --- CHANGES END HERE --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openModal(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
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
        <nav className="flex justify-center items-center space-x-2 mt-8">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={`min-w-[40px] px-4 py-2 rounded-lg text-sm font-semibold transition ${
                currentPage === index + 1
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 border"
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

export default AllUsers;
