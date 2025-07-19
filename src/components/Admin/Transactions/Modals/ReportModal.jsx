import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { generateReportData } from "../SalesReportPDFComponent/reportLogic"; // Adjust path
import { toast } from "react-toastify";

const ReportModal = ({
  isSalesReportModalOpen,
  setIsSalesReportModalOpen,
  transactionData, // This will be sortedAndFilteredTransactions
  reportType,
  setReportType,
  selectedReportDate,
  setSelectedReportDate,
  handlePrintSalesReport,
  setReportPayload,
  selectedLocationName, // New prop
}) => {
  const prepareAndPrintReport = () => {
    if (!transactionData || transactionData.length === 0) {
      toast.warn("No transaction data available to generate a report.");
      return;
    }
    if (!selectedReportDate) {
      toast.warn("Please select a date for the report.");
      return;
    }
    const payload = generateReportData(
      transactionData,
      reportType,
      selectedReportDate,
      selectedLocationName
    );
    setReportPayload(payload);

    setTimeout(() => {
      handlePrintSalesReport();
    }, 500);
  };

  return (
    <div>
      {isSalesReportModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h2 className="text-xl font-semibold text-gray-700">
                Generate Sales Report
              </h2>
              <button
                onClick={() => setIsSalesReportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>

            <div className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label
                    htmlFor="reportTypeModal"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Report Type
                  </label>
                  <select
                    id="reportTypeModal"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="reportDateModal"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Select Date
                    {reportType === "weekly" && " (any day in week)"}
                    {reportType === "monthly" && " (any day in month)"}
                    {reportType === "yearly" && " (any day in year)"}
                  </label>
                  <DatePicker
                    id="reportDateModal"
                    selected={selectedReportDate}
                    onChange={(date) => setSelectedReportDate(date)}
                    dateFormat={
                      reportType === "monthly"
                        ? "MM/yyyy"
                        : reportType === "yearly"
                        ? "yyyy"
                        : "MM/dd/yyyy"
                    }
                    showMonthYearPicker={reportType === "monthly"}
                    showYearPicker={reportType === "yearly"}
                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    popperPlacement="bottom-start"
                  />
                </div>
                <div>
                  <button
                    onClick={prepareAndPrintReport}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out"
                  >
                    Generate & Print Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportModal;
