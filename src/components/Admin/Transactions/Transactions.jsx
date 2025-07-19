import React, { useCallback, useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../../loader/Loader";
import axios from "axios";
import CustomerModal from "./Modals/CustomerModal";
import TransactionDetailsModal from "./Modals/TransactionDetailsModal";
import ProductModal from "./Modals/ProductModal";
import { useReactToPrint } from "react-to-print";
import PrintInternal from "./TransactionsModule/PrintTransaction/PrintInternal";
import PrintReceipt from "./TransactionsModule/PrintTransaction/PrintReceipt";
import {
  faPrint,
  faReceipt,
  faRecycle,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Pagination from "../Pagination";
import { domain } from "../../../security";
import PrintThermal from "./TransactionsModule/PrintTransaction/PrintThermal";
import { useSelector } from "react-redux";
import { selectUserID, selectFullName } from "../../../redux/IchthusSlice";
import SalesReportPDFComponent from "./SalesReportPDFComponent/SalesReportPDFComponent";
import "react-datepicker/dist/react-datepicker.css";
import ReportModal from "./Modals/ReportModal";

const Transactions = () => {
  // --- STATES ---
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [Print, setPrint] = useState(null);
  const [Receipt, setReceipt] = useState(null);
  const [receiptThermal, setReceiptThermal] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [mySelectedLocation, setMySelectedLocation] = useState("");
  const [reportType, setReportType] = useState("daily");
  const [selectedReportDate, setSelectedReportDate] = useState(new Date());
  const [reportPayload, setReportPayload] = useState(null);
  const [isSalesReportModalOpen, setIsSalesReportModalOpen] = useState(false);
  const [reportLocationName, setReportLocationName] = useState("");
  const userID = useSelector(selectUserID);
  const fullName = useSelector(selectFullName);
  const [transactionView, setTransactionView] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });
  const [openMenuId, setOpenMenuId] = useState(null); // For mobile dropdown

  // --- DATA FETCHING AND LOGIC ---
  const fetchLocations = useCallback(async () => {
    try {
      const res = await axios.get(`${domain}/api/Locations`);
      setLocations(res.data);
    } catch (error) {
      toast.error("Failed to fetch locations.");
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let apiUrl;
    if (transactionView === "my") {
      if (userID) {
        apiUrl = `${domain}/api/Transactions/UserId/${userID}`;
      } else {
        setLoading(false);
        setTransactionData([]);
        return;
      }
    } else {
      apiUrl = selectedLocationId
        ? `${domain}/api/Transactions/ByLocation/${selectedLocationId}`
        : `${domain}/api/Transactions`;
    }
    try {
      const response = await axios.get(apiUrl);
      setTransactionData(response.data);
    } catch (error) {
      toast.error("Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId, transactionView, userID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const revertTransaction = async (id, fullName) => {
    if (!window.confirm("Are you sure you want to revert this?")) return;
    try {
      await axios.post(
        `${domain}/api/Transactions/revert/${id}`,
        { voidBy: fullName },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Successfully Reverted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to revert transaction.");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const myLocationsOptions = React.useMemo(() => {
    if (transactionView === "my" && transactionData.length > 0) {
      const uniqueLocations = new Map();
      transactionData.forEach((t) => {
        if (t.locationId && t.location)
          uniqueLocations.set(t.locationId, t.location);
      });
      return Array.from(uniqueLocations, ([id, name]) => ({
        id: id.toString(),
        name,
      }));
    }
    return [];
  }, [transactionData, transactionView]);

  const sortedAndFilteredTransactions = React.useMemo(() => {
    let transactionsToFilter = [...transactionData];
    if (sortConfig !== null) {
      transactionsToFilter.sort((a, b) => {
        if (sortConfig.key === "date") {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA < dateB)
            return sortConfig.direction === "ascending" ? -1 : 1;
          if (dateA > dateB)
            return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        } else {
          const valA = a[sortConfig.key],
            valB = b[sortConfig.key];
          if (typeof valA === "string" && typeof valB === "string")
            return sortConfig.direction === "ascending"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
          if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }
      });
    }
    if (searchTerm) {
      transactionsToFilter = transactionsToFilter.filter(
        (t) =>
          t.customer?.customerName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          t.id.toString().includes(searchTerm)
      );
    }
    if (transactionView === "all" && selectedLocationId)
      transactionsToFilter = transactionsToFilter.filter(
        (t) => t.locationId === parseInt(selectedLocationId)
      );
    else if (transactionView === "my" && mySelectedLocation)
      transactionsToFilter = transactionsToFilter.filter(
        (t) => t.locationId === parseInt(mySelectedLocation)
      );
    return transactionsToFilter;
  }, [
    transactionData,
    sortConfig,
    searchTerm,
    transactionView,
    selectedLocationId,
    mySelectedLocation,
  ]);

  const currentItems = sortedAndFilteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const printInternalRef = useRef();
  const printReceiptRef = useRef();
  const printThermalRef = useRef();
  const salesReportRef = useRef();

  const handlePrintInternal = useReactToPrint({
    content: () => printInternalRef.current,
    documentTitle: "Internal Transaction",
  });
  const handlePrintReceipt = useReactToPrint({
    content: () => printReceiptRef.current,
    documentTitle: "Receipt",
  });
  const handlePrintThermal = useReactToPrint({
    content: () => printThermalRef.current,
    documentTitle: "Receipt",
  });
  const handlePrintSalesReport = useReactToPrint({
    content: () => salesReportRef.current,
    documentTitle: "Sales Report",
    onAfterPrint: () => setReportPayload(null),
  });

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    let newReportLocationName = "All Locations";
    const findLocationName = (id, options, nameKey) =>
      options.find((loc) => loc.id.toString() === id.toString())?.[nameKey];
    if (transactionView === "all" && selectedLocationId)
      newReportLocationName =
        findLocationName(selectedLocationId, locations, "locationName") ||
        "All Locations";
    else if (transactionView === "my" && mySelectedLocation)
      newReportLocationName =
        findLocationName(mySelectedLocation, myLocationsOptions, "name") ||
        "All Locations";
    setReportLocationName(newReportLocationName);
  }, [
    selectedLocationId,
    mySelectedLocation,
    locations,
    myLocationsOptions,
    transactionView,
  ]);

  // --- RENDER ---
  return (
    <div>
      <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto">
        <ToastContainer />
        <ReportModal
          isSalesReportModalOpen={isSalesReportModalOpen}
          setIsSalesReportModalOpen={setIsSalesReportModalOpen}
          transactionData={sortedAndFilteredTransactions}
          reportType={reportType}
          setReportType={setReportType}
          selectedReportDate={selectedReportDate}
          setSelectedReportDate={setSelectedReportDate}
          handlePrintSalesReport={handlePrintSalesReport}
          setReportPayload={setReportPayload}
          selectedLocationName={reportLocationName}
        />
        <button
          onClick={() => setIsSalesReportModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
        >
          Generate Sales Report
        </button>
        <h1 className="text-3xl lg:text-4xl font-bold text-center text-gray-800 my-8">
          {transactionView === "all" ? "All Transactions" : "My Transactions"}
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full mb-6">
          <div className="w-full sm:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={
                transactionView === "all"
                  ? selectedLocationId
                  : mySelectedLocation
              }
              onChange={(e) =>
                transactionView === "all"
                  ? setSelectedLocationId(e.target.value)
                  : setMySelectedLocation(e.target.value)
              }
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Locations</option>
              {(transactionView === "all" ? locations : myLocationsOptions).map(
                (loc) => (
                  <option key={loc.id} value={loc.id}>
                    {transactionView === "all" ? loc.locationName : loc.name}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by customer name or ID"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
      <div className="sm:w-1/3">
        <div className={`inline-flex rounded-t-md overflow-hidden`}>
          {["all", "my"].map((type) => (
            <label
              key={type}
              className={`cursor-pointer px-5 py-2 text-sm select-none ${
                transactionView === type
                  ? type === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-200 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                value={type}
                checked={transactionView === type}
                onChange={(e) => setTransactionView(e.target.value)}
              />
              <span className="capitalize">{type} Transactions</span>
            </label>
          ))}
        </div>
      </div>

      <div
        className={`relative shadow-md sm:rounded-b-lg border ${
          transactionView === "all" ? "border-blue-600" : "border-blue-200"
        }`}
        style={{ borderTopWidth: 0 }}
      >
        {loading && <Loader />}

        {/* --- DESKTOP TABLE VIEW --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 hidden md:table">
            <thead
              className={`text-xs uppercase ${
                transactionView === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-200 text-blue-800"
              }`}
            >
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  Transaction / Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Customer Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Sales Rep
                </th>
                <th scope="col" className="px-6 py-3">
                  Items Purchased
                </th>
                <th scope="col" className="px-6 py-3">
                  Location
                </th>
                <th scope="col" className="px-6 py-3">
                  Prepared / Checked By
                </th>
                <th scope="col" className="px-6 py-3">
                  Payment / Terms
                </th>
                <th scope="col" className="px-6 py-3">
                  Total Amount
                </th>
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                currentItems.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className={`${
                      transaction?.isVoid
                        ? "bg-red-100 hover:bg-red-200"
                        : "odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                    } border-b transition-colors`}
                  >
                    <th
                      scope="row"
                      className={`px-6 py-4 font-medium whitespace-nowrap ${
                        transaction?.isVoid ? "text-red-900" : "text-gray-900"
                      }`}
                    >
                      <div className="font-bold text-base">
                        {transaction.id} {transaction.isVoid && "(VOID)"}
                      </div>
                      <div className="font-normal text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </div>
                    </th>
                    <td
                      className="px-6 py-4 font-medium text-blue-600 hover:underline cursor-pointer"
                      onClick={() =>
                        transaction?.customer &&
                        setSelectedCustomer(transaction.customer)
                      }
                    >
                      {transaction?.customer?.customerName || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {transaction?.fullName || "N/A"}
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => {
                        if (transaction?.purchasedProducts?.length > 0) {
                          setSelectedProducts(transaction.purchasedProducts);
                          setTransactionId(transaction.id);
                        }
                      }}
                    >
                      {transaction?.purchasedProducts?.length > 0 ? (
                        transaction.purchasedProducts.map((p) => (
                          <div key={p.id} className="text-xs">
                            {p.quantity}x {p.pricelist?.productName}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">No items</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {transaction?.location || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {transaction?.preparedBy || "N/A"} /{" "}
                      {transaction?.checkedBy || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {transaction?.paymentType || "N/A"} (
                      {transaction?.terms || "N/A"})
                    </td>
                    <td
                      className="px-6 py-4 font-bold text-blue-600 hover:underline cursor-pointer"
                      onClick={() =>
                        transaction && setSelectedTransaction(transaction)
                      }
                    >
                      ₱{" "}
                      {transaction?.totalAmount
                        ? transaction.totalAmount.toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-2 w-40">
                        <button
                          onClick={() =>
                            !transaction?.isVoid &&
                            revertTransaction(transaction.id, fullName)
                          }
                          disabled={transaction?.isVoid}
                          className={`font-semibold py-2 px-3 text-xs rounded-lg shadow-md flex items-center justify-center gap-2 ${
                            transaction?.isVoid
                              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                        >
                          <FontAwesomeIcon icon={faRecycle} />{" "}
                          {transaction?.isVoid ? "Voided" : "Void"}
                        </button>
                        {!transaction?.isVoid && (
                          <button
                            onClick={() => {
                              setReceiptThermal(transaction);
                              setTimeout(handlePrintThermal, 300);
                            }}
                            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-3 text-xs rounded-lg shadow-md flex items-center justify-center gap-2"
                          >
                            <FontAwesomeIcon icon={faReceipt} /> Print Thermal
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPrint(transaction);
                            setTimeout(handlePrintInternal, 300);
                          }}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 text-xs rounded-lg shadow-md flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faPrint} /> Print Internal
                        </button>
                        {!transaction?.isVoid && (
                          <button
                            onClick={() => {
                              setReceipt(transaction);
                              setTimeout(handlePrintReceipt, 300);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 text-xs rounded-lg shadow-md flex items-center justify-center gap-2"
                          >
                            <FontAwesomeIcon icon={faReceipt} /> Print Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE CARD VIEW --- */}
        <div className="md:hidden divide-y divide-gray-200">
          {!loading &&
            currentItems.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-4 ${
                  transaction.isVoid ? "bg-red-50" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      #{transaction.id}{" "}
                      {transaction.isVoid && (
                        <span className="text-red-600 font-semibold">
                          (VOID)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === transaction.id ? null : transaction.id
                        )
                      }
                      className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
                    >
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    {openMenuId === transaction.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl z-20 border">
                          <div className="py-1">
                            <button
                              onClick={() =>
                                !transaction?.isVoid &&
                                revertTransaction(transaction.id, fullName)
                              }
                              disabled={transaction?.isVoid}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 ${
                                transaction.isVoid
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <FontAwesomeIcon
                                icon={faRecycle}
                                className="w-4"
                              />{" "}
                              {transaction.isVoid
                                ? "Voided"
                                : "Void Transaction"}
                            </button>
                            {!transaction?.isVoid && (
                              <button
                                onClick={() => {
                                  setReceiptThermal(transaction);
                                  setTimeout(handlePrintThermal, 300);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                              >
                                <FontAwesomeIcon
                                  icon={faReceipt}
                                  className="w-4"
                                />{" "}
                                Print Thermal
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setPrint(transaction);
                                setTimeout(handlePrintInternal, 300);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                            >
                              <FontAwesomeIcon icon={faPrint} className="w-4" />{" "}
                              Print Internal
                            </button>
                            {!transaction?.isVoid && (
                              <button
                                onClick={() => {
                                  setReceipt(transaction);
                                  setTimeout(handlePrintReceipt, 300);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                              >
                                <FontAwesomeIcon
                                  icon={faReceipt}
                                  className="w-4"
                                />{" "}
                                Print Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Customer</p>
                    <p
                      className="font-medium text-blue-600"
                      onClick={() =>
                        transaction?.customer &&
                        setSelectedCustomer(transaction.customer)
                      }
                    >
                      {transaction.customer?.customerName || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium text-gray-700">
                      {transaction.location || "N/A"}
                    </p>
                  </div>
                  <div
                    className="col-span-2 cursor-pointer"
                    onClick={() => {
                      if (transaction?.purchasedProducts?.length > 0) {
                        setSelectedProducts(transaction.purchasedProducts);
                        setTransactionId(transaction.id);
                      }
                    }}
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      Items Purchased
                    </p>
                    <div className="text-sm text-gray-800 space-y-1">
                      {transaction.purchasedProducts?.length > 0 ? (
                        transaction.purchasedProducts.map((p) => (
                          <div key={p.id}>
                            {p.quantity}x{" "}
                            {p.pricelist?.productName || "Unknown"}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No items</p>
                      )}
                    </div>
                  </div>
                  <div
                    className="col-span-2 text-right mt-2 cursor-pointer"
                    onClick={() =>
                      transaction && setSelectedTransaction(transaction)
                    }
                  >
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      ₱{" "}
                      {transaction.totalAmount
                        ? transaction.totalAmount.toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={sortedAndFilteredTransactions.length}
        currentPage={currentPage}
        paginate={paginate}
      />

      <div style={{ display: "none" }}>
        <PrintInternal ref={printInternalRef} transaction={Print} />
        <PrintReceipt ref={printReceiptRef} transaction={Receipt} />
        <PrintThermal ref={printThermalRef} transaction={receiptThermal} />
        {reportPayload && (
          <SalesReportPDFComponent
            ref={salesReportRef}
            reportPayload={reportPayload}
          />
        )}
      </div>
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
      {selectedProducts && (
        <ProductModal
          products={selectedProducts}
          transactionId={transactionId}
          onClose={() => setSelectedProducts(null)}
        />
      )}
    </div>
  );
};

export default Transactions;
