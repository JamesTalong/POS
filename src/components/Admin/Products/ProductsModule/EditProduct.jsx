import React, { useState } from "react";
import Loader from "../../../loader/Loader";
import { toast } from "react-toastify";
import { db } from "../../../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import profile from "../../../../Images/profile.jpg";

const EditProduct = ({ product, onClose }) => {
  const [productName, setProductName] = useState(product.productName);
  const [price, setPrice] = useState(product.price);
  const [color, setColor] = useState(product.color);
  const [withBadge, setWithBadge] = useState(product.withBadge);
  const [brand, setBrand] = useState(product.brand);
  const [description, setDescription] = useState(product.description);
  const [category, setCategory] = useState(product.category);
  const [category2, setCategory2] = useState(product.category2);
  const [itemCode, setItemCode] = useState(product.itemCode);
  const [recommended, setRecommended] = useState(product.recommended);
  const [specs, setSpecs] = useState(product.specs);
  const [quantity, setQuantity] = useState(product.quantity);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (quantity < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    try {
      const productRef = doc(db, "product", product.id);
      await updateDoc(productRef, {
        productName,
        price,
        color,
        withBadge,
        brand,
        description,
        category,
        category2,
        itemCode,
        recommended,
        quantity,
        specs,
      });

      setIsLoading(false);
      toast.success("Product updated successfully");
      onClose();
    } catch (error) {
      setIsLoading(false);
      toast.error("Error updating product: " + error.message);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedSpecs = [...specs];
    updatedSpecs[index][field] = value;
    setSpecs(updatedSpecs);
  };

  const addField = () => {
    setSpecs([...specs, { label: "", value: "" }]);
  };

  const removeField = (index) => {
    const updatedSpecs = [...specs];
    updatedSpecs.splice(index, 1);
    setSpecs(updatedSpecs);
  };

  return (
    <div>
      {isLoading && <Loader />}
      <div className="relative w-full pt-4 py-4 px-12">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
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
        <h2 className="text-3xl mb-4">Edit Product</h2>
        <p className="mb-4">Edit the details of this product.</p>
        <form onSubmit={handleEditProduct}>
          <div className="flex justify-center">
            <div className="h-48 w-48 rounded-lg overflow-hidden mt-5">
              <img
                className="object-cover h-full w-full"
                src={product.imgUrl ? product.imgUrl : profile}
                alt="Product"
              />
            </div>
          </div>
          <div className="mt-5">
            <span>Product Name</span>
            <input
              type="text"
              placeholder="Product Name"
              className="border border-gray-400 py-1 px-2 w-full"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div className="mt-5">
            <span>Price</span>
            <input
              type="text"
              placeholder="Price"
              className="border border-gray-400 py-1 px-2 w-full"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="mt-5">
            <span>Color</span>
            <input
              type="text"
              placeholder="Color"
              className="border border-gray-400 py-1 px-2 w-full"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="mt-5">
            <span>With Badge?</span>
            <div>
              <label>
                <input
                  type="radio"
                  value="Yes"
                  checked={withBadge === "Yes"}
                  onChange={(e) => setWithBadge(e.target.value)}
                />{" "}
                Yes
              </label>
              <label className="mx-10">
                <input
                  type="radio"
                  value="No"
                  checked={withBadge === "No"}
                  onChange={(e) => setWithBadge(e.target.value)}
                />{" "}
                No
              </label>
            </div>
          </div>
          <div className="mt-5">
            <span>Brand</span>
            <input
              type="text"
              placeholder="Brand"
              className="border border-gray-400 py-1 px-2 w-full"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div className="mt-5">
            <span>Description</span>
            <textarea
              type="text"
              placeholder="Description"
              className="border border-gray-400 py-1 px-2 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="mt-5">
            <span>Category</span>
            <input
              type="text"
              placeholder="Category"
              className="border border-gray-400 py-1 px-2 w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="mt-5">
            <span>Category 2</span>
            <input
              type="text"
              placeholder="Category 2"
              className="border border-gray-400 py-1 px-2 w-full"
              value={category2}
              onChange={(e) => setCategory2(e.target.value)}
            />
          </div>
          <div className="mt-5">
            <span>Item Code</span>
            <input
              type="text"
              placeholder="Item Code"
              className="border border-gray-400 py-1 px-2 w-full"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
            />
          </div>
          <div className="my-5">
            <label htmlFor="recommended" className="block mb-1">
              Recommended
            </label>
            <select
              id="recommended"
              className="border border-gray-400 py-1 px-2 w-full"
              value={recommended}
              onChange={(e) => setRecommended(e.target.value)}
            >
              <option value="">Select an option...</option>
              <option value="New Arrivals">New Arrivals</option>
              <option value="Best Sellers">Best Sellers</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div>
            <div className="mt-5">
              <span>Quantity</span>
              <input
                id="quantity"
                type="number"
                min="0" // Ensures the input is non-negative
                placeholder="Enter quantity"
                className="border border-gray-400 py-1 px-2 w-full"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                }}
              />
            </div>

            <span>Specs</span>
            {specs.map((spec, index) => (
              <div key={index} className="grid grid-cols-3 gap-5 pt-2">
                <input
                  type="text"
                  name="label"
                  value={spec.label}
                  placeholder="Label"
                  onChange={(event) =>
                    handleInputChange(index, "label", event.target.value)
                  }
                  className="border border-gray-400 py-1 px-2"
                />
                <input
                  type="text"
                  name="value"
                  value={spec.value}
                  placeholder="Value"
                  onChange={(event) =>
                    handleInputChange(index, "value", event.target.value)
                  }
                  className="border border-gray-400 py-1 px-2"
                />
                {index === 0 ? (
                  <button
                    type="button"
                    onClick={addField}
                    className="rounded-full bg-green-600 text-white"
                  >
                    Add
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="rounded-full bg-red-600 text-white"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5">
            <button className="w-full bg-orange-600 py-3 text-center text-white">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
