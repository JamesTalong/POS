import React, { useCallback, useEffect, useRef, useState } from "react";
import AddProducts from "./AddProducts";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import {
  Loader,
  PrinterIcon,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  X,
} from "lucide-react";
import noImage from "../../../../Images/noImage.jpg";
import Pagination from "../../Pagination"; // Assuming this is well-designed
import { useReactToPrint } from "react-to-print";
import PrintBarcodeComponent from "./PrintBarcodeComponent"; // Assuming this is well-designed
import { domain } from "../../../../security"; // Ensure this import is correct
import PrintSelectionModal from "./PrintSelectionModal"; // Assuming this is well-designed

const AllProducts = () => {
  // --- STATE MANAGEMENT ---
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10); // Changed to 10 for potentially more content
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedProductsForPrint, setSelectedProductsForPrint] = useState([]);
  const [barcodeToPrint, setBarcodeToPrint] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null); // For mobile card action menu

  // --- REFS ---
  const printBarcodeRef = useRef();
  const menuRef = useRef(); // For click outside the mobile action menu

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${domain}/api/Products`, {
        headers: { "Content-Type": "application/json" },
      });
      const formattedData = response.data.map((item) => ({
        ...item,
        // Ensure productImage is always a valid string for the src attribute
        productImage: item.productImage
          ? item.productImage.startsWith("http")
            ? item.productImage
            : `data:image/jpeg;base64,${item.productImage}`
          : noImage,
      }));
      setProductData(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- SEARCH FILTERING ---
  useEffect(() => {
    const results = productData.filter(
      (product) =>
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, productData]);

  // --- CLICK OUTSIDE HANDLER for mobile action menu ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- CRUD & ACTIONS ---
  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await axios.delete(`${domain}/api/Products/${id}`);
      toast.success("Product successfully deleted! 🗑️");
      fetchData(); // Refresh data after deletion
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. 😔");
    }
  };

  const openModal = (product = null) => {
    setProductToEdit(product);
    setIsModalVisible(true);
  };

  const handlePrint = (product) => {
    // Check if barcode is valid EAN-13
    if (product?.barCode?.length !== 13 || !/^\d{13}$/.test(product.barCode)) {
      toast.error("Barcode must be a 13-digit EAN-13 format to print. 🚫");
      return;
    }
    setBarcodeToPrint(product); // Set for single product print
    setTimeout(handlePrintBarcode, 500); // Allow state update to render component
  };

  // --- PRINTING LOGIC ---
  const handlePrintBarcode = useReactToPrint({
    content: () => printBarcodeRef.current,
    documentTitle: "Product-Barcode",
  });

  const handlePrintAll = () => {
    // Filter out products without valid EAN-13 barcodes for printing
    const printableProducts = filteredProducts.filter(
      (p) => p.barCode && p.barCode.length === 13 && /^\d{13}$/.test(p.barCode)
    );
    if (printableProducts.length === 0) {
      toast.info("No products with valid EAN-13 barcodes to print. 😔");
      return;
    }
    setSelectedProductsForPrint(printableProducts); // Pass only printable ones
    setPrintModalVisible(true);
  };

  const handlePrintSelected = () => {
    const printData = selectedProductsForPrint.map((p) => ({
      barCode: p.barCode,
      productName: p.productName,
    }));

    if (
      printData.some(
        (p) => p.barCode?.length !== 13 || !/^\d{13}$/.test(p.barCode)
      )
    ) {
      toast.error("One or more selected barcodes are not in EAN-13 format. 🚫");
      return;
    }
    setBarcodeToPrint(printData); // Set for multiple products print
    setTimeout(handlePrintBarcode, 500);
    setPrintModalVisible(false);
  };

  // --- PAGINATION DATA ---
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- MODAL CONTROLS ---
  const closeModal = () => setIsModalVisible(false);
  const openDescriptionModal = (description) =>
    setSelectedDescription(description);
  const closeDescriptionModal = () => setSelectedDescription("");
  const openImageModal = (image) => setSelectedImage(image);
  const closeImageModal = () => setSelectedImage("");

  return (
    <div className=" md:p-6 min-h-screen  dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-center font-raleway mb-6 text-gray-800 dark:text-white">
          Product 📦
        </h1>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="relative w-full md:w-auto md:flex-1 md:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, item code, or barcode"
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            {" "}
            {/* Removed justify-end */}
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 bg-sky-600 text-white text-sm px-4 py-2 hover:bg-sky-700 duration-300 font-semibold rounded-md shadow-sm"
            >
              <PrinterIcon size={16} />
              <span className="hidden sm:inline">Print All</span>
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-orange-600 text-white text-sm px-4 py-2 hover:bg-orange-700 duration-300 font-semibold rounded-md shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader className="animate-spin text-orange-500" size={48} />
          </div>
        ) : filteredProducts.length === 0 && searchTerm === "" ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>No products available. Add some products to get started! ✨</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>
              No products found matching your search. Try a different term. 🔎
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {currentProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-600 flex"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0 cursor-pointer border border-gray-300 dark:border-gray-600"
                    onClick={() => openImageModal(item.productImage)}
                  />
                  <div className="flex-1 min-w-0 ml-3">
                    {" "}
                    {/* Added ml-3 for spacing */}
                    <h3 className="font-bold text-gray-800 dark:text-white truncate">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300 truncate">
                      Item Code: {item.itemCode}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-300 truncate">
                      Barcode: {item.barCode || "N/A"}
                    </p>
                    <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Brand:</span>{" "}
                      {item.brandName || "N/A"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Category:</span>{" "}
                      {item.categoryName || "N/A"}
                    </p>
                  </div>
                  <div
                    className="relative flex-shrink-0"
                    ref={activeMenu === item.id ? menuRef : null}
                  >
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === item.id ? null : item.id)
                      }
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <MoreVertical
                        className="text-gray-600 dark:text-gray-300"
                        size={20}
                      />
                    </button>
                    {activeMenu === item.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-md shadow-xl z-10 border border-gray-200 dark:border-gray-600">
                        <a
                          onClick={() => {
                            openModal(item);
                            setActiveMenu(null);
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <Edit size={16} /> Edit
                        </a>
                        <a
                          onClick={() => {
                            deleteProduct(item.id);
                            setActiveMenu(null);
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <Trash2 size={16} /> Delete
                        </a>
                        <a
                          onClick={() => {
                            handlePrint(item);
                            setActiveMenu(null);
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <PrinterIcon size={16} /> Print Barcode
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3">Image</th>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Codes</th>
                    <th className="px-6 py-3">Details</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-center">Has Serial</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentProducts.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-md shadow-sm cursor-pointer hover:scale-105 transition-transform border border-gray-200 dark:border-gray-600"
                          onClick={() => openImageModal(item.productImage)}
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white max-w-xs truncate">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Item:
                          </span>{" "}
                          {item.itemCode}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Barcode:
                          </span>{" "}
                          {item.barCode || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300">
                        {item.brandName && (
                          <div>
                            <span className="font-semibold">Brand:</span>{" "}
                            {item.brandName}
                          </div>
                        )}
                        {item.categoryName && (
                          <div>
                            <span className="font-semibold">Category:</span>{" "}
                            {item.categoryName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs text-gray-700 dark:text-gray-300">
                        {item.description && item.description.length > 30 ? (
                          <>
                            {`${item.description.slice(0, 30)}...`}
                            <button
                              onClick={() =>
                                openDescriptionModal(item.description)
                              }
                              className="text-blue-600 hover:underline ml-1 font-medium text-xs dark:text-blue-400"
                            >
                              More
                            </button>
                          </>
                        ) : (
                          item.description || "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.hasSerial ? "Yes ✅" : "No ❌"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => deleteProduct(item.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => handlePrint(item)}
                            className="p-2 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-800 rounded-full transition-colors"
                            title="Print Barcode"
                          >
                            <PrinterIcon size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  itemsPerPage={productsPerPage}
                  totalItems={filteredProducts.length}
                  currentPage={currentPage}
                  paginate={paginate}
                />
              </div>
            )}

            {/* Hidden Print Component */}
            <div style={{ display: "none" }}>
              <PrintBarcodeComponent
                ref={printBarcodeRef}
                barcode={barcodeToPrint}
              />
            </div>
          </>
        )}
      </main>

      {/* --- MODALS --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-40 p-4">
          <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-lg w-full max-w-4xl shadow-xl overflow-y-auto max-h-[90vh] relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
            <AddProducts
              onClose={closeModal}
              refreshData={fetchData}
              productToEdit={productToEdit}
            />
          </div>
        </div>
      )}

      {selectedDescription && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Full Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 max-h-60 overflow-y-auto">
              {selectedDescription}
            </p>
            <button
              onClick={closeDescriptionModal}
              className="bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 transition w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
          onClick={closeImageModal}
        >
          <img
            src={selectedImage}
            alt="Product full view"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          />
        </div>
      )}

      <PrintSelectionModal
        visible={printModalVisible}
        products={filteredProducts}
        selectedProducts={selectedProductsForPrint}
        onClose={() => setPrintModalVisible(false)}
        onPrint={handlePrintSelected}
        onCheckboxChange={(selection) => setSelectedProductsForPrint(selection)}
      />
    </div>
  );
};

export default AllProducts;
