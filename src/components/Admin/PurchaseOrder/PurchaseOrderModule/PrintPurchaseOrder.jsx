import React from "react";
import { FaShoppingCart } from "react-icons/fa"; // Using FontAwesome Icon as requested

const PrintPurchaseOrder = React.forwardRef(({ po }, ref) => {
  if (!po) return null;

  // 1. Currency Formatter (PHP)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: po.currency || "PHP",
    }).format(amount || 0);
  };

  // 2. Date Formatter
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      ref={ref}
      className="bg-white p-8 w-full max-w-[210mm] mx-auto text-slate-800 text-xs font-sans leading-tight"
    >
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end mb-6">
        <div>
          {/* Replaced Company Name with Fa Icon */}
          <div className="text-slate-700 text-4xl">
            <FaShoppingCart />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-normal text-blue-600 uppercase tracking-wide">
            Purchase Order
          </h2>
        </div>
      </div>

      {/* --- GRAY INFO BLOCK --- */}
      <div className="bg-slate-100 p-4 flex justify-between border-t border-slate-300 mb-0">
        {/* Column 1: Supplier Info from JSON */}
        <div className="w-1/3 space-y-1.5">
          <div className="flex">
            <span className="font-bold w-24">Supplier Code:</span>
            <span>{po.vendorId}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Supplier Name:</span>
            <span className="font-semibold">{po.vendor}</span>
          </div>
        </div>

        {/* Column 2: PO Details from JSON */}
        <div className="w-1/3 space-y-1.5 border-l border-slate-300 pl-4">
          <div className="flex">
            <span className="font-bold w-24">PO Date:</span>
            <span>{formatDate(po.creationDate)}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">PO No:</span>
            <span>{po.poNumber}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Status:</span>
            <span className="uppercase">{po.status}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Freight:</span>
            <span>{formatCurrency(po.shippingCost)}</span>
          </div>
        </div>

        {/* Column 3: Payment/Delivery from JSON */}
        <div className="w-1/3 space-y-1.5 border-l border-slate-300 pl-4">
          <div className="flex">
            <span className="font-bold w-28">Payment Terms:</span>
            <span>{po.paymentTerms}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-28">Delivery Date:</span>
            <span>{formatDate(po.expectedDeliveryDate)}</span>
          </div>
        </div>
      </div>

      {/* --- BLUE HEADERS --- */}
      <div className="flex bg-blue-600 text-white font-bold py-1.5 mt-4">
        <div className="w-1/2 px-4">Bill To:</div>
        <div className="w-1/2 px-4 border-l border-blue-400">Ship To:</div>
      </div>

      {/* --- ADDRESSES --- */}
      <div className="flex mb-6 border-b border-l border-r border-slate-200">
        <div className="w-1/2 p-4 border-r border-slate-200">
          <p className="text-slate-400 italic">
            (Billing address not provided)
          </p>
        </div>

        {/* Ship To: Using 'location' from JSON */}
        <div className="w-1/2 p-4">
          <p className="font-bold mb-1">{po.location}</p>
        </div>
      </div>

      {/* --- ITEMS TABLE --- */}
      <div className="mb-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="py-2 px-2 text-center border-r border-blue-400 w-12">
                S.No
              </th>
              <th className="py-2 px-2 text-center border-r border-blue-400 w-24">
                Prod Code
              </th>
              <th className="py-2 px-2 text-left border-r border-blue-400">
                Product Name
              </th>
              <th className="py-2 px-2 text-center border-r border-blue-400 w-20">
                Qty
              </th>
              <th className="py-2 px-2 text-center border-r border-blue-400 w-20">
                Units
              </th>
              <th className="py-2 px-2 text-right border-r border-blue-400 w-24">
                Rate
              </th>
              <th className="py-2 px-2 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {po.purchaseOrderLineItems.map((item, index) => (
              <tr key={item.id} className="border-b border-slate-200">
                <td className="py-2.5 px-2 text-center border-r border-slate-200">
                  {index + 1}
                </td>
                <td className="py-2.5 px-2 text-center border-r border-slate-200">
                  {item.productId}
                </td>
                <td className="py-2.5 px-2 font-medium border-r border-slate-200">
                  {item.productName}
                </td>
                <td className="py-2.5 px-2 text-center border-r border-slate-200">
                  {item.orderedQuantity}
                </td>
                <td className="py-2.5 px-2 text-center border-r border-slate-200">
                  {item.unitOfMeasure}
                </td>
                <td className="py-2.5 px-2 text-right border-r border-slate-200">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-2.5 px-2 text-right font-bold">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- TOTALS --- */}
      <div className="flex justify-end mb-8">
        <div className="w-1/3">
          <div className="flex justify-between py-2 px-2">
            <span className="font-bold">Total</span>
            <span className="font-bold">{formatCurrency(po.grandTotal)}</span>
          </div>
          {/* No tax/discount data in JSON, so strictly showing Grand Total */}
          <div className="flex justify-between py-2 px-2 border-t-2 border-slate-800 bg-slate-50">
            <span className="font-bold text-sm">Grand total</span>
            <span className="font-bold text-sm">
              {formatCurrency(po.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* --- FOOTER / TERMS & SIGNATURE --- */}
      <div className="flex justify-between items-end mt-auto pt-8 border-t border-slate-200">
        {/* Terms */}
        <div className="w-3/5 text-[10px] text-slate-600">
          <p className="font-bold mb-1 text-slate-800">Terms and conditions:</p>
          <ol className="list-decimal pl-4 space-y-0.5 leading-tight">
            <li>
              We reserve the right to cancel the purchase order anytime before
              product shipment.
            </li>
            <li>
              Invoice raised to us should contain the details of purchase order.
            </li>
            <li>Adherence to agreed product specifications is a must.</li>
            <li>
              Delivery should be strictly done by{" "}
              {formatDate(po.expectedDeliveryDate)}.
            </li>
          </ol>
          {po.internalNotes && (
            <p className="mt-2 text-slate-500">Note: {po.internalNotes}</p>
          )}
        </div>

        {/* Signature Box */}
        <div className="w-1/3 border border-slate-300">
          <div className="bg-blue-600 text-white text-center font-bold py-1">
            Authorized Signature
          </div>
          <div className="h-16"></div>
          <div className="text-center text-slate-400 italic text-[10px] pb-2 border-t border-slate-200 mx-4 mt-2">
            Signatory
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintPurchaseOrder;
