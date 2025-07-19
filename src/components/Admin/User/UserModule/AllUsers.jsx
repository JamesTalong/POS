import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import useUsersData from "../../../../CustomHooks/useGetData";
import { db, auth, storage } from "../../../../firebase/config";
import { deleteDoc, doc } from "firebase/firestore";
import Loader from "../../../loader/Loader";
import AddUsers from "../UserModule/AddUsers";
import { deleteUser as deleteAuthUser } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { deleteObject, ref } from "firebase/storage";
import useUserData from "../../../../CustomHooks/useUserData";
import noImage from "../../../../Images/noImage.jpg";

const AllUsers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({
    field: "createdAt",
    order: "asc",
  });
  // const [loading, setLoading] = useState(false); // Loading is now managed by useUsersData
  const { users, loading, fetchNext, fetchPrev, noMore } = useUserData(search);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search query changes
  }, [searchQuery]);

  const deleteUser = async (id, imgUrl) => {
    // setLoading(true); // Removed: Loading state is in the hook
    try {
      // Delete user image from Firebase Storage if imgUrl is defined
      if (imgUrl) {
        const storageRef = ref(storage, imgUrl);
        await deleteObject(storageRef);
      } else {
        console.warn("No image URL provided for deletion.");
      }

      // Delete Firestore document
      await deleteDoc(doc(db, "user", id));
      const userToDelete = await auth.getUser(id); // Get user info by uid
      await auth.deleteUser(userToDelete);
      // Delete Authentication user
      const user = auth.id;
      if (user) {
        await deleteAuthUser(user);
        toast.success("User and associated data deleted successfully!");
      } else {
        toast.error("User not found in Authentication.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting the user.");
    } finally {
      // setLoading(false); // Removed: Loading state is in the hook
    }
  };

  const openAddModal = () => {
    setSelectedUser(null); // Clear selected user for "Add" mode
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user); // Set selected user for "Edit" mode
    setShowAddModal(true);
  };

  const closeModal = () => {
    setSelectedUser(null); // Reset selected user
    setShowAddModal(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (field) => {
    // Toggle between ascending and descending
    setSortConfig((prevSortConfig) => ({
      field,
      order:
        prevSortConfig.field === field && prevSortConfig.order === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aField = a[sortConfig.field];
    let bField = b[sortConfig.field];

    // Check if the field is "createdAt" and convert to date if necessary
    if (sortConfig.field === "createdAt") {
      aField = aField?.toDate ? aField.toDate() : new Date();
      bField = bField?.toDate ? bField.toDate() : new Date();
    }

    // Comparison based on ascending or descending order
    if (aField < bField) {
      return sortConfig.order === "asc" ? -1 : 1;
    }
    if (aField > bField) {
      return sortConfig.order === "asc" ? 1 : -1;
    }
    return 0;
  });

  const filteredUsers = sortedUsers.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return <FontAwesomeIcon icon={faSort} />;
    if (sortConfig.order === "asc") return <FontAwesomeIcon icon={faSortUp} />;
    return <FontAwesomeIcon icon={faSortDown} />;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-4 sm:p-6 dark:bg-gray-800 min-h-screen">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-center sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          All Users
        </h2>
      </div>
      <button
        onClick={openAddModal}
        className="w-full sm:w-auto bg-orange-600 text-white font-bodyFont px-4 py-2 hover:bg-orange-700 duration-300 font-semibold rounded-md"
      >
        Add User
      </button>
      <div className="my-6">
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="Search by Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // Better responsive width
            className="p-2 w-full lg:w-1/2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
          />
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50 p-4">
          {/* Added responsive width and margin to the modal */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
            <AddUsers onClose={closeModal} selectedUser={selectedUser} />
          </div>
        </div>
      )}

      {/* --- RESPONSIVE DATA DISPLAY --- */}
      {loading ? (
        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
          No users found.
        </div>
      ) : (
        <>
          {/* CARD VIEW - For Mobile (default, hidden on md and up) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 flex flex-col text-center"
              >
                {/* === Profile Section (Image, Name, Email) === */}
                <div className="flex-grow">
                  <img
                    src={user.imgUrl || noImage}
                    alt="user"
                    // Centered the image by using mx-auto
                    className="h-20 w-20 rounded-full object-cover border-2 border-orange-500 mx-auto mb-3"
                  />
                  <p className="font-semibold text-base text-gray-800 dark:text-white">
                    {user.fullName}
                  </p>
                  {/* truncate class automatically adds "..." for long text */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>

                  {/* === Details Section (Role, Status) === */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                  {/* Using grid for clean alignment of details */}
                  <div className="grid grid-cols-2 gap-x-4 text-sm text-left">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      Admin:
                    </span>
                    <span className="text-gray-800 dark:text-white">
                      {user.admin ? "Yes" : "No"}
                    </span>

                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      Role:
                    </span>
                    <span className="text-gray-800 dark:text-white">
                      {user.roleName}
                    </span>

                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      Joined:
                    </span>
                    <span className="text-gray-800 dark:text-white">
                      {user.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                    </span>
                  </div>
                </div>

                {/* === Action Buttons Section === */}
                {/* Using a grid with a gap for evenly spaced buttons */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditModal(user)}
                    className="w-full bg-blue-500 text-white px-4 py-2 text-sm font-semibold rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="w-full bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TABLE VIEW - For Desktop (hidden by default, visible on md and up) */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={user.imgUrl || noImage}
                          alt="user"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.roleName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.admin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination remains largely the same, maybe with some style tweaks */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={fetchPrev}
          disabled={loading}
          className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          Prev
        </button>
        <button
          onClick={fetchNext}
          disabled={loading || noMore}
          className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllUsers;
