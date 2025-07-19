import React, { useState, useEffect } from "react";

const ReceivedItemModal = ({ transfer, onClose, onConfirmReceive }) => {
  const [itemsToReceive, setItemsToReceive] = useState([]);
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);
  const [itemWithMismatch, setItemWithMismatch] = useState(null);
  const [showSerialDeletionWarning, setShowSerialDeletionWarning] =
    useState(false);
  const [serialDeletionWarningItem, setSerialDeletionWarningItem] =
    useState(null);
  const [serialDeletionProposedAction, setSerialDeletionProposedAction] =
    useState(null);

  useEffect(() => {
    if (transfer && transfer.items) {
      const initialItems = transfer.items.map((item) => ({
        ...item,
        receivedQuantity:
          item.pricelist?.serialNumbers?.length > 0
            ? item.pricelist.serialNumbers.length // Default to full quantity if serials exist
            : item.quantity,
        hasSerials: item.pricelist?.serialNumbers?.length > 0,
        // Store original serials to always have the full list for tagging
        receivedSerialNumbers: item.pricelist?.serialNumbers
          ? item.pricelist.serialNumbers.map((sn) => ({ ...sn }))
          : [],
        // This will store IDs of serials confirmed to be "Missing"
        serialsToMarkAsMissingIds: [], // Changed from serialsToDeleteIds for clarity
      }));
      setItemsToReceive(initialItems);
    }
  }, [transfer]);

  if (!transfer) {
    return null;
  }

  const handleReceivedQuantityChange = (itemId, newQuantityStr) => {
    const newQuantity = Math.max(0, parseInt(newQuantityStr, 10) || 0);

    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const clampedQuantity = Math.min(newQuantity, item.quantity); // item.quantity is original expected

          if (item.hasSerials) {
            // receivedSerialNumbers always holds the original full list of serials
            const originalSerialCount = item.receivedSerialNumbers.length;
            // Number of serials currently NOT marked as missing
            const currentReceivedSerialCount =
              item.receivedSerialNumbers.filter(
                (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
              ).length;

            if (clampedQuantity < currentReceivedSerialCount) {
              // User is reducing the received quantity below the current non-missing count
              setSerialDeletionWarningItem(item);
              setSerialDeletionProposedAction({
                itemId,
                newEffectiveReceivedQuantity: clampedQuantity, // This is the target number of "Received" serials
              });
              setShowSerialDeletionWarning(true);
              return { ...item, receivedQuantity: clampedQuantity };
            } else if (clampedQuantity > currentReceivedSerialCount) {
              // User is increasing the received quantity
              const difference = clampedQuantity - currentReceivedSerialCount;
              let tempSerialsToMarkAsMissingIds = [
                ...item.serialsToMarkAsMissingIds,
              ];
              let unMarkedCount = 0;

              // Try to unmark 'difference' serials from those marked as missing
              const updatedMissingIds = [];
              for (
                let i = tempSerialsToMarkAsMissingIds.length - 1;
                i >= 0;
                i--
              ) {
                if (unMarkedCount < difference) {
                  // This serial was missing, now it's considered received again
                  unMarkedCount++;
                } else {
                  updatedMissingIds.unshift(tempSerialsToMarkAsMissingIds[i]);
                }
              }
              tempSerialsToMarkAsMissingIds = updatedMissingIds;

              return {
                ...item,
                receivedQuantity: clampedQuantity, // User's intended received quantity
                serialsToMarkAsMissingIds: tempSerialsToMarkAsMissingIds,
              };
            } else {
              // Quantity matches current non-missing count
              return { ...item, receivedQuantity: clampedQuantity };
            }
          } else {
            // Item does not have serials, update quantity directly
            return { ...item, receivedQuantity: clampedQuantity };
          }
        }
        return item;
      })
    );
  };

  const handleConfirmSerialDeletionWarning = () => {
    const { itemId, newEffectiveReceivedQuantity, markAsMissingSerialId } =
      serialDeletionProposedAction;

    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          let updatedSerialsToMarkAsMissingIds = [
            ...item.serialsToMarkAsMissingIds,
          ];

          if (markAsMissingSerialId) {
            // Individual serial marked as missing
            if (
              !updatedSerialsToMarkAsMissingIds.includes(markAsMissingSerialId)
            ) {
              updatedSerialsToMarkAsMissingIds.push(markAsMissingSerialId);
            }
          } else {
            const originalSerials = item.receivedSerialNumbers; // Full list
            const currentlyConsideredReceived = originalSerials.filter(
              (sn) => !updatedSerialsToMarkAsMissingIds.includes(sn.id)
            );

            const numToMarkMissing =
              currentlyConsideredReceived.length - newEffectiveReceivedQuantity;

            if (numToMarkMissing > 0) {
              const serialsToNowMarkMissing = currentlyConsideredReceived
                .slice(-numToMarkMissing)
                .map((sn) => sn.id);

              serialsToNowMarkMissing.forEach((idToMark) => {
                if (!updatedSerialsToMarkAsMissingIds.includes(idToMark)) {
                  updatedSerialsToMarkAsMissingIds.push(idToMark);
                }
              });
            }
          }
          // Update item's receivedQuantity to reflect the count of serials NOT marked as missing
          const actualReceivedCount = item.receivedSerialNumbers.filter(
            (sn) => !updatedSerialsToMarkAsMissingIds.includes(sn.id)
          ).length;

          return {
            ...item,
            receivedQuantity: actualReceivedCount,
            serialsToMarkAsMissingIds: updatedSerialsToMarkAsMissingIds,
          };
        }
        return item;
      })
    );

    setShowSerialDeletionWarning(false);
    setSerialDeletionWarningItem(null);
    setSerialDeletionProposedAction(null);
  };

  const handleCancelSerialDeletionWarning = () => {
    // Revert receivedQuantity to match the count of non-missing serials if action is cancelled
    if (serialDeletionProposedAction && serialDeletionWarningItem) {
      setItemsToReceive((prevItems) =>
        prevItems.map((item) => {
          if (item.id === serialDeletionWarningItem.id) {
            const currentNonMissingSerialsCount =
              item.receivedSerialNumbers.filter(
                (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
              ).length;
            return {
              ...item,
              receivedQuantity: currentNonMissingSerialsCount,
            };
          }
          return item;
        })
      );
    }
    setShowSerialDeletionWarning(false);
    setSerialDeletionWarningItem(null);
    setSerialDeletionProposedAction(null);
  };

  const handleToggleSerialNumberStatus = (
    itemId,
    serialId,
    isCurrentlyMissing
  ) => {
    setItemsToReceive((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          let updatedSerialsToMarkAsMissingIds = [
            ...item.serialsToMarkAsMissingIds,
          ];
          let newReceivedQuantity = item.receivedQuantity;

          if (isCurrentlyMissing) {
            // If currently missing, unmark it
            updatedSerialsToMarkAsMissingIds =
              updatedSerialsToMarkAsMissingIds.filter((id) => id !== serialId);
            newReceivedQuantity = Math.min(
              item.quantity, // Cap at original expected quantity
              newReceivedQuantity + 1
            );
          } else {
            const currentNonMissingCount = item.receivedSerialNumbers.filter(
              (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
            ).length;

            if (currentNonMissingCount - 1 < item.quantity) {
              setSerialDeletionWarningItem(item);
              setSerialDeletionProposedAction({
                itemId,
                markAsMissingSerialId: serialId,
              });
              setShowSerialDeletionWarning(true);
              return item; // Return item as is, change will happen on confirmation
            } else {
              updatedSerialsToMarkAsMissingIds.push(serialId);
              newReceivedQuantity = Math.max(0, newReceivedQuantity - 1);
            }
          }

          return {
            ...item,
            receivedQuantity: newReceivedQuantity,
            serialsToMarkAsMissingIds: updatedSerialsToMarkAsMissingIds,
          };
        }
        return item;
      })
    );
  };

  // Helper function to prepare the data for onConfirmReceive
  const prepareConfirmationData = () => {
    return itemsToReceive.map((item) => {
      let finalSerialNumbers = [];
      let quantityForOutput; // This will be the quantity field in the final JSON item

      if (item.hasSerials) {
        // item.receivedSerialNumbers contains all original serial numbers for this item
        finalSerialNumbers = item.receivedSerialNumbers.map((sn) => ({
          id: sn.id,
          serialName: sn.serialName,
          status: item.serialsToMarkAsMissingIds.includes(sn.id)
            ? "Missing"
            : "Received",
        }));
        quantityForOutput = finalSerialNumbers.length;
      } else {
        // For items without serial numbers, quantity is what was effectively received.
        quantityForOutput = item.receivedQuantity;
        finalSerialNumbers = [];
      }

      return {
        PricelistId: item.pricelist.id,
        quantity: quantityForOutput, // This is the total count of serials (Received + Missing) for serialized items
        receiverPricelistId: item.receiverPricelistId,
        serialNumbers: finalSerialNumbers, // field name is "serialNumbers" and contains objects
      };
    });
  };

  const checkAndDelete = () => {
    // Rename to checkAndProceed or similar later if "delete" is misleading
    let hasMismatch = false;
    let mismatchedItem = null;

    for (const item of itemsToReceive) {
      const expectedQty = item.quantity; // Original expected quantity
      const effectivelyReceivedQty = item.hasSerials
        ? item.receivedSerialNumbers.filter(
            (sn) => !item.serialsToMarkAsMissingIds.includes(sn.id)
          ).length
        : item.receivedQuantity;

      if (effectivelyReceivedQty < expectedQty) {
        hasMismatch = true;
        mismatchedItem = {
          // Pass necessary info to warning
          ...item,
          effectivelyReceivedQty, // Add this for the warning message
        };
        break;
      }
    }

    if (hasMismatch) {
      setItemWithMismatch(mismatchedItem);
      setShowConfirmWarning(true);
    } else {
      const dataToSave = prepareConfirmationData();
      onConfirmReceive(transfer, dataToSave);
    }
  };

  // This confirmation is for the mismatch warning (shortage of items)
  const handleConfirmDeletion = () => {
    const dataToSave = prepareConfirmationData();
    onConfirmReceive(transfer, dataToSave);
    setShowConfirmWarning(false);
    setItemWithMismatch(null);
  };

  const displayItemInfo = (item) => {
    const expectedQty = item.quantity;

    const receivedQtyDisplay = item.hasSerials
      ? item.receivedQuantity
      : item.receivedQuantity;

    const canEditReceivedQtyInput =
      !item.hasSerials ||
      (item.hasSerials &&
        !item.receivedSerialNumbers.some((sn) => sn.serialName));

    return (
      <div className="flex items-center space-x-2">
        <span>Expected: {expectedQty}</span>
        <span>Received: </span>
        <label htmlFor={`received-qty-${item.id}`} className="sr-only">
          Received Quantity{" "}
        </label>{" "}
        {canEditReceivedQtyInput ? (
          <input
            id={`received-qty-${item.id}`}
            type="number"
            value={receivedQtyDisplay}
            onChange={(e) =>
              handleReceivedQuantityChange(item.id, e.target.value)
            }
            className="w-20 p-1 border border-gray-300 rounded-md text-sm"
            min="0"
            max={expectedQty}
          />
        ) : (
          <span>{receivedQtyDisplay}</span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Receive Transfer ID: {transfer.id}
        </h3>
        <p className="mb-2">
          <strong className="font-semibold">From Location:</strong>
          {transfer.fromLocation}
        </p>
        <p className="mb-4">
          <strong className="font-semibold">To Location:</strong>
          {transfer.toLocation}
        </p>

        <h4 className="text-lg font-semibold mb-3 text-gray-700">Items:</h4>
        {itemsToReceive && itemsToReceive.length > 0 ? (
          <ul className="list-disc list-inside mb-6 space-y-2">
            {itemsToReceive.map((item, itemIndex) => {
              // Filter out serial numbers that don't have a serialName for display purposes
              const displayableSerials = item.receivedSerialNumbers.filter(
                (sn) => sn.serialName
              );

              return (
                <ul
                  key={item.id || itemIndex}
                  className="bg-orange-50 p-3 rounded-md"
                >
                  <p>
                    <strong className="font-medium">Product:</strong>{" "}
                    {item.pricelist?.product?.productName || "N/A"}
                    {item.pricelist?.color?.colorName &&
                      ` (${item.pricelist.color.colorName})`}
                  </p>
                  <p>
                    {/* <strong className="font-medium">Quantity:</strong>{" "} */}
                    {displayItemInfo(item)}
                  </p>
                  <div className="text-sm text-gray-600">
                    {item.hasSerials && displayableSerials.length > 0 && (
                      <strong className="font-medium">Serial Numbers:</strong>
                    )}
                    {item.hasSerials ? (
                      <ul className="list-none pl-4 mt-1 space-y-1">
                        {item.receivedSerialNumbers.length > 0
                          ? item.receivedSerialNumbers.map((sn) => {
                              // NEW: Check if serialName exists. If not, don't render this list item.
                              if (!sn.serialName) {
                                return null;
                              }

                              const isMissing =
                                item.serialsToMarkAsMissingIds.includes(sn.id);
                              return (
                                <li
                                  key={sn.id}
                                  className={`flex items-center justify-between bg-white p-2 rounded-md shadow-sm ${
                                    isMissing ? "opacity-60" : ""
                                  }`}
                                >
                                  <span>
                                    {sn.serialName}
                                    {isMissing && (
                                      <span className="ml-2 text-xs font-semibold text-red-500">
                                        (Missing)
                                      </span>
                                    )}
                                  </span>
                                  {isMissing ? (
                                    <button
                                      onClick={() =>
                                        handleToggleSerialNumberStatus(
                                          item.id,
                                          sn.id,
                                          true
                                        )
                                      }
                                      className="ml-3 px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 text-xs"
                                      title="Unmark Serial Number as Missing"
                                    >
                                      Unmark Missing
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleToggleSerialNumberStatus(
                                          item.id,
                                          sn.id,
                                          false
                                        )
                                      }
                                      className="ml-3 px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-200 text-xs"
                                      title="Mark Serial Number as Missing"
                                    >
                                      Mark Missing
                                    </button>
                                  )}
                                </li>
                              );
                            })
                          : "No Serials Expected"}{" "}
                      </ul>
                    ) : (
                      "No Serial Numbers for this item"
                    )}
                  </div>
                </ul>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-600 italic mb-6">
            No items associated with this transfer.
          </p>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={checkAndDelete}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
          >
            Confirm Received
          </button>
        </div>

        {/* Warning for Mismatch / Shortage */}
        {showConfirmWarning && itemWithMismatch && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
              <h4 className="text-lg font-bold mb-4 text-red-600">
                Warning! Mismatch Detected
              </h4>
              <p className="mb-4">
                Expected quantity for "
                <strong>
                  {itemWithMismatch.pricelist?.product?.productName}
                </strong>
                " is <strong>{itemWithMismatch.quantity}</strong>, but
                effectively received quantity is{" "}
                <strong>{itemWithMismatch.effectivelyReceivedQty}</strong>.
              </p>
              <p className="mb-6">
                This means{" "}
                <strong>
                  {itemWithMismatch.quantity -
                    itemWithMismatch.effectivelyReceivedQty}
                </strong>{" "}
                item(s) will be marked as 'Missing'. Do you want to confirm this
                reception?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmWarning(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeletion}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                >
                  Confirm with Missing Items
                </button>
              </div>
            </div>
          </div>
        )}
        {showSerialDeletionWarning && serialDeletionWarningItem && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
              <h4 className="text-lg font-bold mb-4 text-orange-600">
                Confirm Status Change
              </h4>
              {serialDeletionProposedAction.markAsMissingSerialId ? ( // If a specific serial is being marked
                <p className="mb-6">
                  You are about to mark the serial number "
                  <strong>
                    {serialDeletionWarningItem.receivedSerialNumbers.find(
                      (sn) =>
                        sn.id ===
                        serialDeletionProposedAction.markAsMissingSerialId
                    )?.serialName ||
                      `Empty Serial (ID: ${serialDeletionProposedAction.markAsMissingSerialId})`}
                  </strong>
                  " as 'Missing'. Are you sure you want to proceed?
                </p>
              ) : (
                // If quantity change is causing serials to be marked missing
                <p className="mb-6">
                  You are changing the received quantity for "
                  <strong>
                    {serialDeletionWarningItem.pricelist?.product?.productName}
                  </strong>
                  ". This will result in{" "}
                  <strong>
                    {serialDeletionWarningItem.receivedSerialNumbers.filter(
                      (sn) =>
                        !serialDeletionWarningItem.serialsToMarkAsMissingIds.includes(
                          sn.id
                        )
                    ).length -
                      serialDeletionProposedAction.newEffectiveReceivedQuantity}
                  </strong>{" "}
                  additional serial number(s) being marked as 'Missing'. Are you
                  sure you want to proceed?
                </p>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCancelSerialDeletionWarning}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSerialDeletionWarning}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-200" // Changed color for less "destructive" feel
                >
                  Confirm Status Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivedItemModal;
