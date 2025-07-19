// src/components/ProductPos.js

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  resetPos,
  increasePosQuantity,
  decreasePosQuantity,
  deleteItemPos,
  updateDiscount,
  updateQuantity,
  selectLastModifiedProduct,
  setSelectedCustomer,
  triggerRefresh,
} from "../../../../redux/IchthusSlice";
import TotalPos from "./TotalPos";
import { useReactToPrint } from "react-to-print";
import SelectedSerialModal from "./SelectedSerialModal";
import FormInputs from "./FormInputs";
import ProductTable from "./ProductTable";
import axios from "axios";
import CustomerDisplay from "./CustomerDisplay";
import PrintReceipt from "../../Transactions/TransactionsModule/PrintTransaction/PrintReceipt";
import { domain } from "../../../../security";

import { selectUserID, selectFullName } from "../../../../redux/IchthusSlice";
import { manilaISOString } from "../../../../date";
import { ArrowLeft } from "lucide-react"; // ADD: Import for back button icon

// CHANGE: Accept new props for mobile navigation
const ProductPos = ({ isCheckoutView, onBackToProducts }) => {
  const dispatch = useDispatch();
  const posProducts = useSelector((state) => state.orebiReducer.posProducts);

  const existingLocation = useSelector(
    (state) => state.orebiReducer.existingLocation
  );

  const selectedCustomer = useSelector(
    (state) => state.orebiReducer.selectedCustomer
  );
  const userID = useSelector(selectUserID);
  const fullName = useSelector(selectFullName);

  console.log(userID, fullName);

  const lastModifiedProduct = useSelector(selectLastModifiedProduct);
  const pageSize = 4;

  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    customerName: "",
    address: "",
    date: manilaISOString,
    tinNumber: "",
    mobileNumber: "",
    preparedBy: "",
    checkedBy: "",
    businessStyle: "",
    rfid: "",
    terms: "",
    isActive: true,
    payment: 0,
    paymentType: "",
  });
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchasedSerials, setPurchasedSerials] = useState({}); // Changed to object for better keying
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [refreshCustomerData, setRefreshCustomerData] = useState(
    () => () => {}
  );
  // Get current time in the Manila timezone (Asia/Manila)

  console.log(
    "Manila Local Time ISO String with Timezone Offset: ",
    manilaISOString
  );

  console.log(new Date().toISOString());

  const deleteSerialTempsByProductId = useCallback(async (productId) => {
    try {
      setPurchasedSerials((prev) => {
        const { [productId]: _, ...remaining } = prev;
        return remaining;
      });
      // Optionally, you might want to call an API to delete serial temps on the backend here
      // if they are persisted. The current code suggests managing them purely in state.
    } catch (error) {
      console.error(
        `Error deleting serialTemps for product ID: ${productId}`,
        error.response || error
      );
    }
  }, []); // Added useCallback for memoization

  useEffect(() => {
    if (lastModifiedProduct?.id) {
      deleteSerialTempsByProductId(lastModifiedProduct.id);
    }
  }, [lastModifiedProduct, deleteSerialTempsByProductId]); // Added deleteSerialTempsByProductId to dependencies

  const handleCustomerSelect = (customer) => {
    const customerData = {
      customerId: customer?.id,
      customerName: customer?.customerName,
      address: customer?.address,
      businessStyle: customer?.businessStyle,
      customerType: customer?.customerType,
      mobileNumber: customer?.mobileNumber,
      rfid: customer?.rfid,
      tinNumber: customer?.tinNumber,
    };

    dispatch(setSelectedCustomer(customerData));
  };

  const handleSaveForm = async () => {
    if (!selectedCustomer || !selectedCustomer.customerId) {
      alert("No customer selected to save.");
      return;
    }

    try {
      await axios.delete(`${domain}/api/CustomerTemps/delete-all`, {
        headers: { "Content-Type": "application/json" },
      });

      const response = await axios.post(
        `${domain}/api/CustomerTemps`,
        selectedCustomer,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        refreshCustomerData();
        alert("Customer saved successfully!");
        toggleFormModal();
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer. Please try again.");
    }
  };

  const totalAmount = posProducts.reduce(
    (total, product) =>
      total + product.price * product.quantity - (product.discount || 0),
    0
  );
  const totalQuantity = posProducts.reduce(
    (total, product) => total + product.quantity,
    0
  );
  const discountAmount =
    discountType === "percentage"
      ? ((parseFloat(discountValue) || 0) / 100) * totalAmount
      : parseFloat(discountValue) || 0;
  const adjustedTotalAmount = totalAmount - discountAmount;
  const change = (parseFloat(formData.payment) || 0) - adjustedTotalAmount;

  const handleDiscountTypeChange = (value) => setDiscountType(value);
  const handleDiscountValueChange = (value) => setDiscountValue(value);
  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.id]: e.target.value });
  const openSerialModal = (product) => {
    setSelectedProduct(product);
    setIsSerialModalOpen(true);
  };
  const closeSerialModal = () => {
    setIsSerialModalOpen(false);
    setSelectedProduct(null);
  };
  const toggleFormModal = () => setIsFormModalOpen(!isFormModalOpen);
  const handleSaveSerials = (productId, selectedSerials) => {
    setPurchasedSerials((prev) => ({ ...prev, [productId]: selectedSerials }));
    closeSerialModal();
  };
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  // RE-ADDED: Original pagination logic for ProductTable
  const paginatedProducts = posProducts.slice(startIndex, endIndex);

  const handleIncreaseQuantity = async (id) => {
    deleteSerialTempsByProductId(id);
    dispatch(increasePosQuantity({ id }));
  };

  const handleQuantityChange = async (id, quantity) => {
    deleteSerialTempsByProductId(id);
    dispatch(updateQuantity({ id, quantity }));
  };

  const handleDecreaseQuantity = async (id) => {
    deleteSerialTempsByProductId(id);
    dispatch(decreasePosQuantity({ id }));
  };

  const handleDeleteItem = async (id) => {
    deleteSerialTempsByProductId(id);
    dispatch(deleteItemPos(id));
  };

  const handleResetPos = async () => {
    try {
      await axios.delete(`${domain}/api/SerialTemps/delete-all`); // Ensure backend serial temps are also cleared
      dispatch(resetPos());
      setPurchasedSerials({}); // Clear purchased serials in state as well
    } catch (error) {
      console.error("Error deleting all SerialTemps:", error);
    }
  };

  const handleDiscountChange = (id, discount) => {
    dispatch(updateDiscount({ id, discount: parseFloat(discount) || 0 }));
  };

  const totalPages = Math.ceil(posProducts.length / pageSize);
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "POS Products",
  });

  const createCustomerTransactionData = () => {
    if (!selectedCustomer) return { customerData: null, transactionData: null };

    const customerData = {
      customerId: selectedCustomer.customerId,
      customerName: selectedCustomer?.customerName,
      customerAddress: selectedCustomer.address,
      contactNumber: selectedCustomer.mobileNumber,
      tinNumber: selectedCustomer.tinNumber,
      businessStyle: selectedCustomer.businessStyle,
      rfid: selectedCustomer.rfid,
    };
    const transactionData = {
      customerId: selectedCustomer.customerId,
      date: formData.date,
      payment: parseFloat(formData.payment) || 0,
      paymentType: formData.paymentType,
      terms: formData.terms,
      preparedBy: formData.preparedBy,
      checkedBy: formData.checkedBy,
      totalItems: totalQuantity,
      totalAmount: adjustedTotalAmount,
      discountType: discountType,
      discountAmount: discountAmount,
      change: change,
      locationId: existingLocation.id, // Add locationId here
      location: existingLocation.location, // Add location here
      userId: userID, // Added userID here
      fullName: fullName, // Added fullName here
    };
    return { customerData, transactionData };
  };

  const saveCustomerAndTransaction = async (isPrint = false) => {
    const { customerData, transactionData } = createCustomerTransactionData();

    if (!customerData) {
      alert("Please select a customer.");
      return;
    }

    if (
      !transactionData.paymentType ||
      transactionData.paymentType === "Others:"
    ) {
      alert("Please select a paymentType.");
      return;
    }

    if (posProducts.length === 0) {
      alert(
        "Purchased products cannot be empty. Please add products before saving."
      );
      return;
    }

    const missingSerialProduct = posProducts.find(
      (p) =>
        p.hasSerial &&
        (!purchasedSerials[p.id] || purchasedSerials[p.id].length === 0)
    );

    if (missingSerialProduct) {
      alert(`Serial numbers are required for ${missingSerialProduct.name}`);
      // Throwing an error here prevents the transaction from proceeding
      throw new Error(
        `Serial numbers are required for ${missingSerialProduct.name}`
      );
    }

    try {
      // START: THIS IS THE CORRECTED SECTION
      const purchasedProducts = posProducts.map((product) => ({
        id: product.id,
        productId: product.id,
        quantity: product.quantity,
        price: product.price,
        subtotal: product.quantity * product.price - (product.discount || 0),
        vatType: product.vatType,
        discountValue: product.discount || 0,
        serialNumbers: purchasedSerials[product.id]
          ? [
              // Wrap the object in an array
              {
                pricelistId: product.id,
                // The key must be "serialNumbers" (plural) and the value is the array of serials
                serialNumbers: purchasedSerials[product.id],
              },
            ]
          : [],
      }));
      // END: THIS IS THE CORRECTED SECTION

      const payload = {
        ...transactionData,
        purchasedProducts,
      };

      console.log(
        "Attempting to save transaction with payload:",
        JSON.stringify(payload, null, 2)
      );

      const response = await axios.post(`${domain}/api/Transactions`, payload);
      const transactionId = response.data.id; // Get the saved transaction ID
      await axios.delete(`${domain}/api/SerialTemps/delete-all`);

      setPurchasedSerials({}); // Resetting state is correct
      dispatch(resetPos());
      alert("Transaction saved successfully!");
      dispatch(triggerRefresh());

      if (isPrint) {
        // Fetch the latest transaction details before printing
        await fetchTransactionData(transactionId);
      }
    } catch (error) {
      // Tip: Log the server's specific response if it exists
      if (error.response) {
        console.error("Server responded with error:", error.response.data);
      }
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction. Check console for details.");
    }
  };

  const fetchTransactionData = async (transactionId) => {
    try {
      const response = await axios.get(
        `${domain}/api/Transactions/${transactionId}`
      );
      const transactionDetails = response.data;
      setPrintData(transactionDetails);
      setTimeout(() => {
        handlePrint();
      }, 500);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      alert("Failed to fetch transaction data for printing.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md overflow-x-auto">
      {isCheckoutView && (
        <button
          onClick={onBackToProducts}
          className="lg:hidden flex items-center gap-2 mb-4 bg-red-600 text-white font-semibold py-1 px-2 rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
        >
          <ArrowLeft size={20} />
          <span>Back to Products</span>
        </button>
      )}

      <h2 className="text-lg font-bold mb-3">POS Products</h2>
      {posProducts.length === 0 ? (
        <p>No products added to POS</p>
      ) : (
        <>
          <ProductTable
            paginatedProducts={paginatedProducts}
            totalPages={totalPages}
            currentPage={currentPage}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            onDeleteItem={handleDeleteItem}
            onChangePage={setCurrentPage}
            onOpenSerialModal={openSerialModal}
            onUpdateDiscount={handleDiscountChange}
            onUpdateQuantity={handleQuantityChange}
            purchasedSerials={purchasedSerials}
          />
        </>
      )}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
        <CustomerDisplay
          onRefresh={(refreshFunc) => setRefreshCustomerData(() => refreshFunc)}
        />
        <button
          className="bg-blue-500 text-white w-full sm:w-auto px-4 py-2 rounded-md mt-4 hover:bg-blue-600"
          onClick={toggleFormModal}
        >
          Edit Customer Info
        </button>
      </div>

      {isFormModalOpen && (
        // The main overlay
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl flex flex-col max-h-[90vh]">
            {/* Modal Header (Stays at the top) */}
            <h3 className="text-lg font-bold mb-4 flex-shrink-0">
              Select or Manage Customers
            </h3>
            <div
              className="flex-grow overflow-y-auto pr-2
                        scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500"
            >
              <FormInputs
                onCustomerSelect={handleCustomerSelect}
                onInputChange={handleInputChange}
              />
            </div>

            {/* Modal Footer (Stays at the bottom) */}
            <div className="mt-4 flex justify-end flex-shrink-0">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
                onClick={handleSaveForm}
              >
                Save
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded-md"
                onClick={toggleFormModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSerialModalOpen && (
        <SelectedSerialModal
          product={selectedProduct}
          onClose={closeSerialModal}
          onSave={handleSaveSerials}
        />
      )}
      <div style={{ display: "none" }}>
        <PrintReceipt ref={componentRef} transaction={printData} />
      </div>
      <TotalPos
        posProducts={posProducts}
        payment={formData.payment}
        paymentType={formData.paymentType}
        totalQuantity={totalQuantity}
        totalAmount={totalAmount}
        discountType={discountType}
        discountValue={discountValue}
        discountAmount={discountAmount}
        change={change}
        adjustedTotalAmount={adjustedTotalAmount}
        onDiscountTypeChange={handleDiscountTypeChange}
        onDiscountValueChange={handleDiscountValueChange}
        onPaymentChange={(value) =>
          setFormData((prev) => ({ ...prev, payment: value }))
        }
        onPaymentTypeChange={(value) =>
          setFormData((prev) => ({ ...prev, paymentType: value }))
        }
        preparedBy={formData.preparedBy}
        checkedBy={formData.checkedBy}
        terms={formData.terms}
        date={formData.date}
        onDateChange={(value) =>
          setFormData((prev) => ({ ...prev, date: value }))
        }
        onPreparedByChange={(value) =>
          setFormData((prev) => ({ ...prev, preparedBy: value }))
        }
        onCheckedByChange={(value) =>
          setFormData((prev) => ({ ...prev, checkedBy: value }))
        }
        onTermsChange={(value) =>
          setFormData((prev) => ({ ...prev, terms: value }))
        }
      />
      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleResetPos}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Reset POS
        </button>
        <button
          onClick={() => saveCustomerAndTransaction(false)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Save
        </button>
        <button
          onClick={() => saveCustomerAndTransaction(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Print and Save
        </button>
      </div>
    </div>
  );
};

export default ProductPos;
