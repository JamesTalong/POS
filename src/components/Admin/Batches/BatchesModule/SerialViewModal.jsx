import React from "react";

const SerialViewModal = ({ isVisible, onClose, serialData }) => {
  if (!isVisible) return null; // Only render when visible

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md w-96 max-h-[80vh] overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">Serial Numbers</h2>
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">
                  Serial Name
                </th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(serialData.serialNumbers || []).map((serial, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">
                    {serial.serialName.trim() !== ""
                      ? serial.serialName
                      : index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {serial.isSold ? "Sold" : "Unsold"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-red-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SerialViewModal;
