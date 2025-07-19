import React, { useEffect, useState } from "react";
import axios from "axios";
import noImage from "../../../../Images/noImage.jpg";
import { domain } from "../../../../security";

const ProductModal = ({ transactionId, onClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${domain}/api/Transactions/${transactionId}`
        );

        setProducts(response.data.purchasedProducts || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };
    if (transactionId) {
      fetchData();
    }
  }, [transactionId]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Purchased Products</h2>
        <div className="max-h-64 overflow-y-auto">
          {products.map((product) => {
            return (
              <div key={product.productId} className="mb-6 border-b pb-4">
                <div className="flex items-center mb-3">
                  <img
                    src={
                      product.pricelist?.productImage?.startsWith("http")
                        ? product.pricelist?.productImage
                        : product.pricelist?.productImage
                        ? `data:image/jpeg;base64,${product.pricelist?.productImage}`
                        : noImage
                    }
                    alt={product.pricelist?.productName || "No Name"}
                    className="w-16 h-16 object-cover rounded mr-3"
                  />
                  <div>
                    <p className="font-medium text-lg">
                      {product.pricelist?.productName || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Item Code: {product.pricelist?.itemCode || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  <p>
                    <span className="font-semibold">Product ID:</span>{" "}
                    {product.productId}
                  </p>
                  <p>
                    <span className="font-semibold">Quantity:</span>{" "}
                    {product.quantity}
                  </p>
                  <p>
                    <span className="font-semibold">Price:</span> ₱
                    {product.price.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-semibold">Subtotal:</span> ₱
                    {product.subtotal.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-semibold">Discount Value:</span> ₱
                    {product.discountValue.toFixed(2)}
                  </p>
                </div>
                {product.serialNumbers?.length > 0 ? (
                  <div className="mt-2">
                    <p className="font-semibold">Serial Numbers:</p>
                    <ul className="list-disc pl-5 text-sm">
                      {product.serialNumbers.map((serialObj, index) => (
                        <li key={index}>{serialObj.serialName}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    No Serial Numbers
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ProductModal;
