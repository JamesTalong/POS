import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../security";

const Menus = [
  { title: "Dashboard", path: "dashboard" },
  { title: "Users", path: "users" },
  { title: "User Restriction", path: "userRestriction" },
  { title: "Inventory Cost", path: "inventoryCost" },
  { title: "Transfer Items", path: "transferItems" },
  { title: "transfer", path: "transfer" },
  {
    title: "Product Setup",
    dropdown: [
      { title: "Categories", path: "categories" },
      { title: "Categories 2", path: "categories2" },
      { title: "Categories 3", path: "categories3" },
      { title: "Categories 4", path: "categories4" },
      { title: "Categories 5", path: "categories5" },
      { title: "Brands", path: "brands" },
    ],
  },
  {
    title: "PriceList Setup",
    dropdown: [
      { title: "Colors", path: "colors" },
      { title: "Locations", path: "locations" },
      { title: "Products", path: "productList" },
    ],
  },
  {
    title: "POS Item Setup",
    dropdown: [
      { title: "Pricelists", path: "pricelists" },
      { title: "Batches", path: "batches" },
    ],
  },
  { title: "SerialNumbers", path: "serialNumbers" },
  { title: "Customers", path: "customers" },
  { title: "Inventory", path: "inventory" },
  { title: "InventoryStaging", path: "inventoryStaging" },
  { title: "Transactions", path: "transactions" },
  { title: "POS", path: "pos" },
];

const flattenMenus = (menus) => {
  const result = [];
  menus.forEach((item) => {
    if (item.dropdown) {
      item.dropdown.forEach((sub) => result.push(sub));
    } else {
      result.push(item);
    }
  });
  return result;
};

const rows = flattenMenus(Menus);

const AddRestriction = ({ isOpen, setIsOpen, refreshData, jobRoleToEdit }) => {
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (jobRoleToEdit) {
      setRoleName(jobRoleToEdit.roleName || "");
      const updatedPerms = {};
      rows.forEach((item) => {
        updatedPerms[item.path] = jobRoleToEdit[item.path] || false;
      });
      setPermissions(updatedPerms);
    } else {
      setRoleName("");
      setPermissions({});
    }
  }, [jobRoleToEdit]);

  if (!isOpen) return null;

  const handleCheckboxChange = (path) => {
    setPermissions((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.warning("Job role is required.");
      return;
    }

    const payload = {
      roleName,
      ...rows.reduce((acc, item) => {
        acc[item.path] = !!permissions[item.path];
        return acc;
      }, {}),
    };

    const url = jobRoleToEdit
      ? `${domain}/api/JobRole/${jobRoleToEdit.id}`
      : `${domain}/api/JobRole`;

    try {
      if (jobRoleToEdit) {
        await axios.put(url, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Job role updated successfully");
      } else {
        await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Job role added successfully");
      }
      setIsOpen(false);
      refreshData?.();
    } catch (error) {
      console.error(error);
      toast.error(`Error ${jobRoleToEdit ? "updating" : "saving"} job role`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 bg-">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 relative overflow-y-auto max-h-[96vh]">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-4 text-gray-600 hover:text-gray-800 text-xl"
        >
          <FaTimes />
        </button>

        <div className="space-y-6">
          {/* Job Role Input Section */}
          <div className="max-w-sm mx-auto">
            <label
              className="block text-gray-800 text-lg font-bold mb-2"
              htmlFor="role-input"
            >
              Job Role
            </label>
            <input
              id="role-input"
              type="text"
              placeholder="Enter job role"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg bg-gray-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="off"
            />
          </div>

          {/* Permissions Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="table-auto w-full text-sm">
              <thead className="bg-gray-700 text-white">
                <tr>
                  <th className="p-3 text-left">Access</th>
                  <th className="p-3 text-center">Allowed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((menu, idx) => (
                  <tr
                    key={menu.path}
                    className={idx % 2 === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    <td className="p-3">{menu.title}</td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={!!permissions[menu.path]}
                        onChange={() => handleCheckboxChange(menu.path)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="text-center">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
            >
              {jobRoleToEdit ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRestriction;
