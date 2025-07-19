import React, { useState, useEffect } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import axios from "axios";
import profile from "../../../../Images/profile.jpg";
import { IoMdArrowDown, IoMdArrowUp, IoMdCloseCircle } from "react-icons/io";
import { domain } from "../../../../security";

// Function to convert a file to Base64
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject("No file provided");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const AddProducts = ({ onClose, refreshData, productToEdit }) => {
  const [formData, setFormData] = useState({
    productImage: null,
    productName: "",
    itemCode: "",
    barCode: "",
    description: "",
    hasSerial: true,
    brandId: null,
    brand: "",
    categoryId: null,
    category: "",
    categoryTwoId: null,
    categoryTwo: "",
    categoryThreeId: null,
    categoryThree: "",
    categoryFourId: null,
    categoryFour: "",
    categoryFiveId: null,
    categoryFive: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(profile);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesTwo, setCategoriesTwo] = useState([]);
  const [categoriesThree, setCategoriesThree] = useState([]);
  const [categoriesFour, setCategoriesFour] = useState([]);
  const [categoriesFive, setCategoriesFive] = useState([]);
  const [showExtraCategories, setShowExtraCategories] = useState(false);

  const handleToggleCategories = () => {
    setShowExtraCategories(!showExtraCategories);
  };

  // Fetch brands
  useEffect(() => {
    axios
      .get(`${domain}/api/Brands`)
      .then((response) => setBrands(response.data))
      .catch((error) => console.error("Error fetching brands:", error));
  }, []);

  // Fetch categories
  useEffect(() => {
    axios
      .get(`${domain}/api/Categories`)
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Error fetching categories:", error));
  }, []);

  useEffect(() => {
    axios
      .get(`${domain}/api/CategoriesTwo`)
      .then((response) => setCategoriesTwo(response.data))
      .catch((error) => console.error("Error fetching categories:", error));
  }, []);

  useEffect(() => {
    axios
      .get(`${domain}/api/CategoriesThree`)
      .then((response) => setCategoriesThree(response.data))
      .catch((error) =>
        console.error("Error fetching categoriesThree:", error)
      );
  }, []);

  useEffect(() => {
    axios
      .get(`${domain}/api/CategoriesFour`)
      .then((response) => setCategoriesFour(response.data))
      .catch((error) => console.error("Error fetching categoriesFour:", error));
  }, []);

  useEffect(() => {
    axios
      .get(`${domain}/api/CategoriesFive`)
      .then((response) => setCategoriesFive(response.data))
      .catch((error) => console.error("Error fetching categoriesFive:", error));
  }, []);

  // Initialize form data and preview image if editing
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        productImage: null, // File upload remains null until changed
        productName: productToEdit.productName || "",
        itemCode: productToEdit.itemCode || "",
        barCode: productToEdit.barCode || "",
        description: productToEdit.description || "",
        hasSerial: productToEdit.hasSerial,
        brandId: productToEdit.brandId || "",
        brand:
          brands.find((b) => b.id === productToEdit.brandId)?.brandName || "",
        categoryId: productToEdit.categoryId || "",
        category:
          categories.find((c) => c.id === productToEdit.categoryId)
            ?.categoryName || "", // Set category name
        categoryTwoId: productToEdit.categoryTwoId || "",
        categoryTwo:
          categoriesTwo.find((c) => c.id === productToEdit.categoryTwoId)
            ?.categoryTwoName || "",
        categoryThreeId: productToEdit.categoryThreeId || "",
        categoryThree:
          categoriesThree.find((c) => c.id === productToEdit.categoryThreeId)
            ?.categoryThreeName || "",
        categoryFourId: productToEdit.categoryFourId || "",
        categoryFour:
          categoriesFour.find((c) => c.id === productToEdit.categoryFourId)
            ?.categoryFourName || "",
        categoryFiveId: productToEdit.categoryFiveId || "",
        categoryFive:
          categoriesFive.find((c) => c.id === productToEdit.categoryFiveId)
            ?.categoryFiveName || "",
      });

      const isValidURL = (string) => {
        try {
          new URL(string);
          return true;
        } catch {
          return false;
        }
      };

      // Determine preview image format
      const productImageUrl = productToEdit?.productImage
        ? isValidURL(productToEdit.productImage)
          ? productToEdit.productImage
          : `data:image/jpeg;base64,${productToEdit.productImage}`
        : profile; // Default profile image

      setPreviewImage(productImageUrl);
    }
  }, [
    productToEdit,
    brands,
    categories,
    categoriesFive,
    categoriesFour,
    categoriesThree,
    categoriesTwo,
  ]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = domain + "/api/Products";

    let imageToBeSaved = null;
    if (formData.productImage && typeof formData.productImage !== "string") {
      const base64String = await toBase64(formData.productImage);
      imageToBeSaved = base64String.split(",")[1]; // Extract Base64 content
    }

    const payload = {
      productName: formData.productName || "",
      itemCode: formData.itemCode || "",
      barCode: formData.barCode || "",
      description: formData.description || "",
      productImage:
        imageToBeSaved ||
        (productToEdit?.productImage?.startsWith("http")
          ? productToEdit.productImage
          : null),
      hasSerial: formData.hasSerial,
      brandId: formData.brandId || null,
      brand: formData.brand || "",
      categoryId: formData.categoryId || null,
      category: formData.category || "",
      categoryTwoId: formData.categoryTwoId || null, // ✅ Allow empty
      categoryTwo: formData.categoryTwo || "",
      categoryThreeId: formData.categoryThreeId || null, // ✅ Allow empty
      categoryThree: formData.categoryThree || "",
      categoryFourId: formData.categoryFourId || null, // ✅ Allow empty
      categoryFour: formData.categoryFour || "",
      categoryFiveId: formData.categoryFiveId || null, // ✅ Allow empty
      categoryFive: formData.categoryFive || "",
    };
    console.log("Final bulkData:", JSON.stringify(payload, null, 2));

    try {
      if (productToEdit) {
        await axios.put(`${apiUrl}/${productToEdit.id}`, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Product updated successfully");
      } else {
        await axios.post(apiUrl, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Product added successfully");
      }

      setIsLoading(false);
      refreshData();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      toast.error(
        `${productToEdit ? "Error updating" : "Error adding"} product: ${
          error.message
        }`
      );
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    if (id === "brandId") {
      const selectedBrand = brands.find((b) => b.id === Number(value));
      setFormData((prev) => ({
        ...prev,
        brandId: value || null,
        brand: selectedBrand ? selectedBrand.brandName : "",
      }));
    } else if (id === "categoryId") {
      const selectedCategory = categories.find((c) => c.id === Number(value));

      setFormData((prev) => ({
        ...prev,
        categoryId: value || null,
        category: selectedCategory?.categoryName || "",
      }));
    } else if (id === "categoryTwoId") {
      setFormData((prev) => ({
        ...prev,
        categoryTwoId: value || null, // ✅ Allow empty
        categoryTwo:
          categoriesTwo.find((c) => c.id === Number(value))?.categoryTwoName ||
          "",
      }));
    } else if (id === "categoryThreeId") {
      setFormData((prev) => ({
        ...prev,
        categoryThreeId: value || null, // ✅ Allow empty
        categoryThree:
          categoriesThree.find((c) => c.id === Number(value))
            ?.categoryThreeName || "",
      }));
    } else if (id === "categoryFourId") {
      setFormData((prev) => ({
        ...prev,
        categoryFourId: value || null, // ✅ Allow empty
        categoryFour:
          categoriesFour.find((c) => c.id === Number(value))
            ?.categoryFourName || "",
      }));
    } else if (id === "categoryFiveId") {
      setFormData((prev) => ({
        ...prev,
        categoryFiveId: value || null, // ✅ Allow empty
        categoryFive:
          categoriesFive.find((c) => c.id === Number(value))
            ?.categoryFiveName || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleRadioChange = (e) => {
    setFormData({ ...formData, hasSerial: e.target.value === "true" });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imagePreviewUrl = URL.createObjectURL(file);
      setPreviewImage(imagePreviewUrl); // Update preview
      setFormData({ ...formData, productImage: file }); // Store file for submission
    }
  };

  useEffect(() => {
    return () => {
      if (previewImage && !previewImage.startsWith("http")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage, onClose]);

  return (
    <div>
      {isLoading && <Loader />}
      <div className="relative w-full pt-4 py-4 px-12">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-4 text-gray-500 hover:text-gray-700 text-3xl"
        >
          <IoMdCloseCircle size={40} />
        </button>

        <h2 className="text-3xl mb-4">
          {productToEdit ? "Edit Product" : "Add Product"}
        </h2>
        <form onSubmit={handleFormSubmit}>
          <div className="flex flex-col items-center mb-4">
            <label className="block mb-2">Product Image</label>
            <div className="w-40 h-40 overflow-hidden border rounded-md mb-4">
              <img
                src={previewImage}
                alt="Product Preview"
                className="object-cover w-full h-full"
                onError={(e) => (e.target.src = profile)}
              />
            </div>
            <div className="mb-4">
              <input
                type="file"
                onChange={handleImageChange}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="mt-5">
            <label>Product Name</label>
            <input
              id="productName"
              type="text"
              value={formData.productName}
              onChange={handleInputChange}
              className="p-2 w-full border rounded"
            />
          </div>
          <div>
            <label>Item Code</label>
            <input
              id="itemCode"
              type="text"
              value={formData.itemCode}
              onChange={handleInputChange}
              className="p-2 w-full border rounded"
            />
          </div>
          <div className="mb-4">
            <label>Brand</label>
            <select
              id="brandId"
              value={formData.brandId}
              onChange={handleInputChange}
              className="p-2 w-full border rounded"
            >
              <option value="">Select a Brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label>Category</label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="p-2 w-full border rounded"
            >
              <option value="">Select a Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 ">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleToggleCategories}
                className="px-3 py-1 text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-xs font-medium rounded shadow flex items-center gap-2"
              >
                {showExtraCategories ? (
                  <>
                    <span>Hide Categories</span>
                    <IoMdArrowUp className="text-sm" />
                  </>
                ) : (
                  <>
                    <span>Show Categories</span>
                    <IoMdArrowDown className="text-sm" />
                  </>
                )}
              </button>
            </div>
            {showExtraCategories && (
              <div>
                <div className="mb-4">
                  <label>Category Two</label>
                  <select
                    id="categoryTwoId"
                    value={formData.categoryTwoId}
                    onChange={handleInputChange}
                    className="p-2 w-full border rounded"
                  >
                    <option value="">Select Category Two</option>
                    {categoriesTwo.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryTwoName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label>Category Three</label>
                  <select
                    id="categoryThreeId"
                    value={formData.categoryThreeId}
                    onChange={handleInputChange}
                    className="p-2 w-full border rounded"
                  >
                    <option value="">Select Category Three</option>
                    {categoriesThree.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryThreeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label>Category Four</label>
                  <select
                    id="categoryFourId"
                    value={formData.categoryFourId}
                    onChange={handleInputChange}
                    className="p-2 w-full border rounded"
                  >
                    <option value="">Select Category Four</option>
                    {categoriesFour.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryFourName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label>Category Five</label>
                  <select
                    id="categoryFiveId"
                    value={formData.categoryFiveId}
                    onChange={handleInputChange}
                    className="p-2 w-full border rounded"
                  >
                    <option value="">Select Category Five</option>
                    {categoriesFive.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryFiveName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label>Description</label>
            <textarea
              id="description"
              rows={5}
              value={formData.description}
              onChange={handleInputChange}
              className="p-2 w-full border rounded"
            />
          </div>
          <div className="mb-4">
            <span className="block text-gray-700">Has Serial</span>
            <label className="mr-4">
              <input
                type="radio"
                value="true"
                checked={formData.hasSerial === true}
                onChange={handleRadioChange}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                value="false"
                checked={formData.hasSerial === false}
                onChange={handleRadioChange}
              />
              No
            </label>
          </div>
          <div>
            <label>Barcode</label>
            <input
              id="barCode"
              type="text"
              value={formData.barCode}
              onChange={handleInputChange}
              className="p-2 w-full border rounded"
            />
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              disabled={isLoading}
            >
              {productToEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProducts;
