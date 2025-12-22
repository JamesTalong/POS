import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../security";
import ReceivedItemModal from "./ReceivedItemModal";
import { useSelector } from "react-redux";
// --- 1. UPDATED: Using selectUserName for consistency ---
import { selectUserName } from "../../../redux/IchthusSlice";

const TransferHistoryTable = ({ refreshTrigger, onReceiveSuccess }) => {
  // --- State Management ---
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // --- 2. UPDATED: Using userName from Redux store ---
  const userName = useSelector(selectUserName);

  // --- 3. OPTIMIZED: Memoized fetch function for stability ---
  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `${domain}/api/Transfers`;
      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });
      setTransfers(response.data);
    } catch (err) {
      setError(err);
      toast.error("Failed to fetch awaiting transfers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [refreshTrigger, fetchTransfers]); // Effect depends on the memoized function

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // --- 4. IMPROVED: Using toast for confirmation and feedback ---
  const handleRevert = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel transfer ID ${id}?`)) {
      return;
    }

    const revertPromise = axios.post(`${domain}/api/Transfers/revert/${id}`);

    toast.promise(revertPromise, {
      pending: `Cancelling transfer ID ${id}...`,
      success: {
        render() {
          fetchTransfers(); // Re-fetch data on success
          return `Transfer ID ${id} was successfully cancelled.`;
        },
      },
      error: `Failed to cancel transfer ID ${id}.`,
    });
  };

  const handleConfirmReceive = async (transfer, processedItems) => {
    const receivePromise = new Promise(async (resolve, reject) => {
      try {
        const payload = {
          transferId: transfer.id,
          fromLocation: transfer.fromLocation,
          toLocation: transfer.toLocation,
          status: "Completed",
          releaseBy: transfer.releaseBy,
          receiveBy: userName, // Using updated userName
          transferredDate: transfer.transferredDate,
          RecievedDate: new Date().toISOString(),
          items: processedItems.map((item) => ({
            receiverPricelistId: item.receiverPricelistId,
            PricelistId: item.PricelistId,
            quantity: item.quantity,
            serialNumbers: item.serialNumbers.map((sn) => ({
              serialNumberId: sn.id,
              status: sn.status,
              serialName: sn.serialName,
            })),
          })),
        };

        await axios.post(`${domain}/api/CompletedTransfers`, payload);

        // --- 5. RELIABLE STATE: Call external refresh triggers on success ---
        if (onReceiveSuccess) {
          onReceiveSuccess();
        }
        closeReceiveModal(); // This function will trigger a local refresh
        resolve(); // Resolve promise for toast
      } catch (err) {
        console.error(
          "Receive failed:",
          err.response ? err.response.data : err.message
        );
        reject(err); // Reject promise for toast
      }
    });

    toast.promise(receivePromise, {
      pending: `Receiving transfer ID ${transfer.id}...`,
      success: `Transfer ID ${transfer.id} successfully received.`,
      error: `Failed to receive transfer ID ${transfer.id}. Please try again.`,
    });
  };

  const openReceiveModal = (transfer) => {
    setSelectedTransfer(transfer);
    setIsModalOpen(true);
  };

  // Closing the modal triggers a data refresh to ensure the list is up-to-date
  const closeReceiveModal = () => {
    setIsModalOpen(false);
    setSelectedTransfer(null);
    fetchTransfers();
  };

  if (loading)
    return (
      <p className="text-center text-gray-600 py-4">Loading transfers...</p>
    );
  if (error)
    return (
      <p className="text-center text-red-500 py-4">
        Error loading transfers: {error.message}
      </p>
    );
  if (transfers.length === 0)
    return (
      <p className="text-center text-gray-600 py-4">
        No transfers are awaiting delivery.
      </p>
    );

  return (
    <div className="container mx-auto mt-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
        Awaiting Delivery
      </h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-200">
            <tr>
              {[
                "ID",
                "Release Date",
                "From",
                "To",
                "Items",
                "Status",
                "Released By",
                "Product Details",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-gray-100">
                <td className="py-3 px-4">{transfer.id}</td>
                <td className="py-3 px-4">
                  {formatDate(transfer.transferredDate)}
                </td>
                <td className="py-3 px-4">{transfer.fromLocation}</td>
                <td className="py-3 px-4">{transfer.toLocation}</td>
                <td className="py-3 px-4">{transfer.items.length}</td>
                <td className="py-3 px-4">{transfer.status}</td>
                <td className="py-3 px-4">{transfer.releaseBy}</td>
                <td className="py-3 px-4">
                  {transfer.items?.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {transfer.items.map((item, index) => (
                        <li key={item.id || index} className="mb-1">
                          <strong>
                            {item.pricelist?.product?.productName || "N/A"}
                          </strong>
                          {item.pricelist?.color?.colorName &&
                            ` (${item.pricelist.color.colorName})`}
                          <br />
                          Qty: {item.quantity} | SNs:{" "}
                          {item.pricelist?.serialNumbers?.length > 0
                            ? item.pricelist.serialNumbers
                                .map((sn) => sn.serialName)
                                .join(", ")
                            : "No Serial"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 italic">
                      No items in transfer.
                    </p>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleRevert(transfer.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => openReceiveModal(transfer)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1 rounded"
                  >
                    Receive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ReceivedItemModal
          transfer={selectedTransfer}
          onClose={closeReceiveModal}
          onConfirmReceive={handleConfirmReceive}
        />
      )}
    </div>
  );
};

export default TransferHistoryTable;
