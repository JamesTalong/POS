// src/components/ProductQuantityCounter.js
import React, { useEffect } from "react";

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../../../firebase/config";

const ProductQuantityCounter = ({ orders }) => {
  const productQuantities = orders.reduce((acc, order) => {
    order.products.forEach((product) => {
      if (acc[product.id]) {
        acc[product.id].quantity += product.quantity;
      } else {
        acc[product.id] = {
          name: product.name,
          quantity: product.quantity,
        };
      }
    });
    return acc;
  }, {});

  useEffect(() => {
    const updateSoldQuantities = async () => {
      try {
        for (const [productId, product] of Object.entries(productQuantities)) {
          const productRef = doc(db, "product", productId);
          const productDoc = await getDoc(productRef);

          if (productDoc.exists()) {
            await updateDoc(productRef, {
              sold: product.quantity,
            });
          } else {
            console.error(`No document found for product ID: ${productId}`);
          }
        }
        toast.success("Sold quantities updated successfully");
      } catch (error) {
        toast.error("Error updating sold quantities: " + error.message);
      }
    };

    updateSoldQuantities();
  }, [productQuantities]);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-center text-gray-600">
        Product Quantities
      </h2>
      <ul className="mt-4 space-y-2">
        {Object.entries(productQuantities).map(([productId, product]) => (
          <li
            key={productId}
            className="flex justify-between items-center px-4 py-2 bg-gray-100 rounded"
          >
            <span>
              {product.name} (ID: {productId})
            </span>
            <span>{product.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductQuantityCounter;
