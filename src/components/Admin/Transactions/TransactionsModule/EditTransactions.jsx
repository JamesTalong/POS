import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../../../firebase/config";
import Loader from "../../../loader/Loader";

const EditTransactions = ({ order, closePopup, onSave }) => {
  const [updatedOrder, setUpdatedOrder] = useState(order);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUpdatedOrder(order);
  }, [order]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder((prevOrder) => ({
      ...prevOrder,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    // Only update if the order status has changed
    if (updatedOrder.orderStatus === order.orderStatus) {
      closePopup();
      toast.info("No changes made.");
      return;
    }

    setIsLoading(true);
    try {
      const orderRef = doc(db, "ordered", order.id);

      // Fetch the existing order document
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        // Extract the existing orders array
        const existingOrders = orderDoc.data().orders;

        // Find the index of the order to update
        if (order.index !== -1) {
          // Update only the orderStatus field of the specified order
          existingOrders[order.index].orderStatus = updatedOrder.orderStatus;

          // Update the document with the modified orders array
          await updateDoc(orderRef, { orders: existingOrders });

          // Notify and update the UI
          onSave(updatedOrder);
          closePopup();
          toast.success("Order status updated successfully!");
        } else {
          toast.error("Order not found.");
        }
      } else {
        toast.error("Order document not found.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-10">
      <ToastContainer />
      {isLoading && <Loader />}
      <div className="relative w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={closePopup}
        >
          <FontAwesomeIcon icon={faClose} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Edit Order</h2>
        <div className="mb-4">
          <label className="block font-bold text-gray-700">Order Status</label>
          <select
            name="orderStatus"
            value={updatedOrder.orderStatus || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="To Ship">To Ship</option>
            <option value="To Receive">To Receive</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Return/Refund">Return/Refund</option>
          </select>
        </div>
        <button
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
          onClick={handleUpdate}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default EditTransactions;
