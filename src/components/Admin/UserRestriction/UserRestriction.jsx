import React, { useEffect, useState } from "react";
import axios from "axios";
import AddRestriction from "./AddRestriction";
import { domain } from "../../../security";
import Pagination from "../Pagination";
import { ChevronDownIcon, ChevronUpIcon, Pencil, Trash2 } from "lucide-react";

const UserRestriction = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const itemsPerPage = 10;

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${domain}/api/JobRole`);
      setJobRoles(response.data);
    } catch (error) {
      console.error("Failed to fetch job roles", error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (role) => {
    setSelectedRole(role);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${domain}/api/JobRole/${id}`);
      fetchRoles();
    } catch (error) {
      console.error("Failed to delete job role", error);
    }
  };

  const filteredRoles = jobRoles.filter((role) =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const accessKeys =
    filteredRoles.length > 0
      ? Object.keys(filteredRoles[0]).filter(
          (key) => key !== "id" && key !== "roleName"
        )
      : [];

  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const toggleExpand = (roleId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title for User Role Permissions */}
      <h2 className="text-3xl font-extrabold text-gray-900 text-center md:text-left mb-6">
        User Role Permissions
      </h2>

      {/* Top Controls: Search and Create Button */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <input
          type="text"
          placeholder="Search by role name..."
          className="border border-gray-300 px-4 py-2 rounded-lg w-full md:w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button
          onClick={() => {
            setSelectedRole(null);
            setIsOpen(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition w-full md:w-auto"
        >
          + Create Role
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-md bg-white">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="px-6 py-3 text-left font-semibold tracking-wide">
                Role
              </th>
              <th className="px-6 py-3 text-center font-semibold hidden md:table-cell">
                Access Details
              </th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRoles.map((role, idx) => (
              <React.Fragment key={role.id}>
                <tr className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-6 py-4 font-medium">{role.roleName}</td>
                  <td className="px-6 py-4 text-center hidden md:table-cell">
                    <button
                      onClick={() => toggleExpand(role.id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition"
                    >
                      {expandedRows[role.id] ? (
                        <>
                          <ChevronUpIcon className="h-4 w-4" />
                          <span>Hide Details</span>
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-4 w-4" />
                          <span>View Details</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-white border border-blue-600 hover:bg-blue-600 font-medium min-w-[120px] px-4 py-2 rounded-lg transition-all duration-200"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(role.id)}
                        className="flex items-center justify-center gap-2 text-sm text-red-600 hover:text-white border border-red-600 hover:bg-red-600 font-medium min-w-[120px] px-4 py-2 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows[role.id] && (
                  <tr className={idx % 2 === 0 ? "bg-gray-100" : "bg-gray-50"}>
                    <td colSpan="3" className="px-6 py-4">
                      <div className="block md:hidden mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Access Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {accessKeys.map((key) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="capitalize text-gray-600">
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              {role[key] ? (
                                <span className="text-green-500">&#10004;</span>
                              ) : (
                                <span className="text-red-500">&#10006;</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accessKeys.map((key) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="capitalize text-gray-600">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            {role[key] ? (
                              <span className="text-green-500">&#10004;</span>
                            ) : (
                              <span className="text-red-500">&#10006;</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {paginatedRoles.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-6 text-gray-500">
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={filteredRoles.length}
        currentPage={currentPage}
        paginate={paginate}
      />

      {/* Modal */}
      <AddRestriction
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        refreshData={fetchRoles}
        jobRoleToEdit={selectedRole}
      />
    </div>
  );
};

export default UserRestriction;
