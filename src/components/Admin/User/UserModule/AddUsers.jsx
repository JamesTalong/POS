import React, { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "../../../../firebase/config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import Loader from "../../../loader/Loader";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import profile from "../../../../Images/profile.jpg";
import { domain } from "../../../../security";
import { EmailAuthProvider, signInWithCredential } from "firebase/auth";

const AddUsers = ({ onClose, selectedUser }) => {
  const [formData, setFormData] = useState({
    userImage: null,
    fullName: "",
    email: "",
    password: "",
    admin: "Yes",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedRoleName, setSelectedRoleName] = useState("");
  console.log("selectedRoleId", selectedRoleId);
  console.log("selectedRoleName", selectedRoleName);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        userImage: null,
        fullName: selectedUser.fullName || "",
        email: selectedUser.email || "",
        password: "",
        admin: selectedUser.admin || "",
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${domain}/api/JobRole`); // replace with actual `domain`
        const data = await response.json();
        setRoles(data);

        // If editing a user, pre-select the role ID
        if (selectedUser?.roleId) {
          setSelectedRoleId(selectedUser.roleId);
        }
      } catch (error) {
        console.error("Failed to fetch job roles", error);
      }
    };

    fetchRoles();
  }, [selectedUser]);

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { userImage, email, password, fullName, admin } = formData;

    try {
      let imgUrl = selectedUser?.imgUrl || null;

      if (userImage) {
        const storageRef = ref(
          storage,
          `userImages/${Date.now()}-${userImage.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, userImage);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => reject(error),
            async () => {
              imgUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      if (selectedUser) {
        // EDIT USER
        await updateDoc(doc(db, "user", selectedUser.id), {
          imgUrl,
          fullName,
          email,
          admin,
          roleId: selectedRoleId,
          roleName: selectedRoleName,
          updatedAt: serverTimestamp(),
        });

        toast.success("User updated successfully");
      } else {
        // SAVE original admin info
        const originalUser = auth.currentUser;
        const adminEmail = originalUser.email;
        const adminPassword = prompt("Re-enter your admin password:");
        if (!adminPassword) throw new Error("Admin password is required");

        const credential = EmailAuthProvider.credential(
          adminEmail,
          adminPassword
        );

        // CREATE new user (Firebase will log you in as the new user)
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await setDoc(doc(db, "user", user.uid), {
          imgUrl,
          fullName,
          email,
          admin,
          roleId: selectedRoleId,
          roleName: selectedRoleName,
          createdAt: serverTimestamp(),
        });

        toast.success("User added successfully");

        // RE-SIGN IN as original admin
        await signInWithCredential(auth, credential);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setFormData({
        userImage: null,
        fullName: "",
        email: "",
        password: "",
        admin: "",
      });

      setIsLoading(false);
      onClose();
    } catch (error) {
      toast.error("Error: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 relative">
      {isLoading && <Loader />}

      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {selectedUser ? "Edit User" : "Add User"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center mb-4">
          <img
            className="h-32 w-32 rounded-full object-cover border"
            src={
              formData.userImage
                ? URL.createObjectURL(formData.userImage)
                : selectedUser?.imgUrl || profile
            }
            alt="Profile"
          />
        </div>

        <input
          type="file"
          id="userImage"
          onChange={handleChange}
          ref={fileInputRef}
        />

        {[
          { id: "fullName", label: "Full Name", type: "text" },
          {
            id: "email",
            label: "Email",
            type: "email",
            disabled: !!selectedUser,
          },
        ].map(({ id, label, ...rest }) => (
          <div key={id} className="flex flex-col">
            <label htmlFor={id} className="text-sm font-medium text-gray-600">
              {label}
            </label>
            <input
              id={id}
              value={formData[id] || ""}
              onChange={handleChange}
              className="border py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              {...rest}
            />
          </div>
        ))}

        {!selectedUser && (
          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-600"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={passwordVisible ? "text" : "password"}
                value={formData.password || ""}
                onChange={handleChange}
                className="border py-2 px-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col">
          <label htmlFor="roleId" className="text-sm font-medium text-gray-600">
            Role
          </label>
          <select
            id="roleId"
            value={selectedRoleId}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedRole = roles.find(
                (role) => role.id === Number(selectedId)
              );
              setSelectedRoleId(selectedId);
              setSelectedRoleName(selectedRole?.roleName || "");
            }}
            className="border py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          >
            <option value="" disabled>
              Select a role
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id.toString()}>
                {role.roleName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition"
        >
          Save
        </button>
      </form>
    </div>
  );
};

export default AddUsers;
