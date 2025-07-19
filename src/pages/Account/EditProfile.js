import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Select from "react-select";
import Loader from "../../components/loader/Loader";
import { db, storage } from "../../firebase/config";
import { profile } from "../../assets/images";
import barangay from "barangay";

const EditProfile = ({ userId, onClose }) => {
  const [userImage, setUserImage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [regionsOptions, setRegionsOptions] = useState([]);
  const [provincesOptions, setProvincesOptions] = useState([]);
  const [citiesOptions, setCitiesOptions] = useState([]);
  const [barangaysOptions, setBarangaysOptions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  useEffect(() => {
    const fetchRegions = () => {
      const regionsData = barangay();
      const options = regionsData.map((region) => ({
        value: region,
        label: region,
      }));
      setRegionsOptions(options);
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "user", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setFullName(userData.fullName);
          setPhone(userData.phone);
          setAddress(userData.address);
          setEmail(userData.email);
          setUserImage(userData.imgUrl);

          setSelectedRegion(
            userData.region && {
              value: userData.region,
              label: userData.region,
            }
          );
          setSelectedProvince(
            userData.province && {
              value: userData.province,
              label: userData.province,
            }
          );
          setSelectedCity(
            userData.city && {
              value: userData.city,
              label: userData.city,
            }
          );
          setSelectedBarangay(
            userData.barangay && {
              value: userData.barangay,
              label: userData.barangay,
            }
          );
        } else {
          console.error("User does not exist!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleRegionChange = (selectedOption) => {
    setSelectedRegion(selectedOption);
    const provincesData = barangay(selectedOption.value);
    const options = provincesData.map((province) => ({
      value: province,
      label: province,
    }));
    setProvincesOptions(options);
    setSelectedProvince(null);
    setSelectedCity(null);
    setCitiesOptions([]);
    setBarangaysOptions([]);
  };

  const handleProvinceChange = (selectedOption) => {
    setSelectedProvince(selectedOption);
    const citiesData = barangay(selectedRegion.value, selectedOption.value);
    const options = citiesData.map((city) => ({
      value: city,
      label: city,
    }));
    setCitiesOptions(options);
    setSelectedCity(null);
    setBarangaysOptions([]);
  };

  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
    const barangaysData = barangay(
      selectedRegion.value,
      selectedProvince.value,
      selectedOption.value
    );
    const options = barangaysData.map((barangay) => ({
      value: barangay,
      label: barangay,
    }));
    setBarangaysOptions(options);
    setSelectedBarangay(null);
  };

  const handleBarangayChange = (selectedOption) => {
    setSelectedBarangay(selectedOption);
  };

  const updateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const updateData = {
      fullName,
      phone,
      address,
      email,
      region: selectedRegion?.value,
      province: selectedProvince?.value,
      city: selectedCity?.value,
      barangay: selectedBarangay?.value,
    };

    try {
      if (userImage && typeof userImage !== "string") {
        const storageRef = ref(
          storage,
          `userImages/${Date.now() + userImage.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, userImage);

        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            toast.error("Image upload failed: " + error.message);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              updateData.imgUrl = downloadURL;

              const userRef = doc(db, "user", userId);
              await updateDoc(userRef, updateData);

              setIsLoading(false);
              toast.success("User updated successfully");
              onClose();
            } catch (error) {
              setIsLoading(false);
              toast.error("Error updating user: " + error.message);
            }
          }
        );
      } else {
        const userRef = doc(db, "user", userId);
        await updateDoc(userRef, updateData);

        setIsLoading(false);
        toast.success("User updated successfully");
        onClose();
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Error updating user: " + error.message);
    }
  };

  return (
    <div>
      {isLoading && <Loader />}
      <div className="relative w-full pt-4 py-4 px-12 ">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-white hover:text-gray-700 bg-red-500 rounded-full transition transform hover:scale-110 mt-10 "
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
        <h2 className="text-3xl mb-4 mt-10">Edit Profile</h2>
        <p className="mb-4">Update user information.</p>
        <form onSubmit={updateUser}>
          <div className="flex justify-center">
            <div className="h-48 w-48 rounded-lg overflow-hidden mt-5">
              <img
                className="object-cover h-full w-full"
                src={
                  userImage
                    ? typeof userImage === "string"
                      ? userImage
                      : URL.createObjectURL(userImage)
                    : profile
                }
                alt="Profile"
              />
            </div>
          </div>
          <div className="mt-5">
            <span>User Image</span>
            <input
              id="userImage"
              type="file"
              className="border border-gray-400 py-1 px-2 w-full"
              onChange={(e) => setUserImage(e.target.files[0])}
            />
          </div>
          <div className="mt-5">
            <span>Full Name</span>
            <input
              id="fullName"
              type="text"
              placeholder="First, MI., and LastName"
              className="border border-gray-400 py-1 px-2 w-full"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="mt-5">
            <span>Phone</span>
            <input
              id="phone"
              type="text"
              placeholder="0975*******"
              className="border border-gray-400 py-1 px-2 w-full"
              value={phone}
              onChange={(e) => {
                const input = e.target.value
                  .replace(/\D/g, "")
                  .substring(0, 11);
                setPhone(input);
              }}
              pattern="\d*"
              maxLength={11}
            />
          </div>

          <div className="mt-5">
            <span>Email</span>
            <input
              id="email"
              type="email"
              placeholder="Email...."
              className="border border-gray-400 py-1 px-2 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly
            />
          </div>
          <div className="mt-5">
            <label>Region</label>
            <Select
              options={regionsOptions}
              value={selectedRegion}
              onChange={handleRegionChange}
              placeholder="Select Region"
              className="w-full"
            />
          </div>
          <div className="mt-5">
            <label>Province</label>
            <Select
              options={provincesOptions}
              value={selectedProvince}
              onChange={handleProvinceChange}
              placeholder="Select Province"
              className="w-full"
              isDisabled={!selectedRegion}
            />
          </div>
          <div className="mt-5">
            <label>City</label>
            <Select
              options={citiesOptions}
              value={selectedCity}
              onChange={handleCityChange}
              placeholder="Select City"
              className="w-full"
              isDisabled={!selectedProvince}
            />
          </div>
          <div className="mt-5">
            <label>Barangay</label>
            <Select
              options={barangaysOptions}
              value={selectedBarangay}
              onChange={handleBarangayChange}
              placeholder="Select Barangay"
              className="w-full"
              isDisabled={!selectedCity}
            />
          </div>
          <div className="mt-5">
            <span>Complete Address</span>
            <input
              id="address"
              type="text"
              placeholder="Blk and Lot No., Street, Subdivision, Barangay, City/Municipal, Province."
              className="border border-gray-400 py-1 px-2 w-full"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-700 text-white w-full py-3 text-center mt-4"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
