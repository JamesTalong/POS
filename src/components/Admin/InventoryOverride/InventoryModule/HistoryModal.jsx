import React from "react";
import { FaTimes } from "react-icons/fa";

const HistoryModal = ({ isOpen, onClose, historyData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">
            Adjustment History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {historyData && historyData.length > 0 ? (
                historyData.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {log.productName}
                      </div>
                      <div className="text-xs">{log.locationName}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          log.targetType === "Unsold"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {log.targetType}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        log.quantity > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {log.quantity > 0 ? "+" : ""}
                      {log.quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    No history found (Requires backend implementation)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
