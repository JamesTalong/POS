import React, { useState } from "react";
// -----------------------------------------------------------------
// IMPORT: Using 'xlsx-js-style' for colors and formatting
import XLSX from "xlsx-js-style";
// -----------------------------------------------------------------
import {
  Package,
  MapPin,
  Tag,
  Eye,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  QrCode,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";

// --- Serial Number Modal Component (No changes) ---
const SerialNumberModal = ({ isOpen, onClose, item }) => {
  const [activeTab, setActiveTab] = useState("unsold");
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !item) return null;

  const getList = () => {
    let list = [];
    if (activeTab === "unsold") list = item.unsoldSerials || [];
    if (activeTab === "sold") list = item.soldSerials || [];
    if (activeTab === "bad") list = item.badSerials || [];

    return list.filter((s) =>
      s.serialName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const currentList = getList();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <QrCode className="text-indigo-600" size={20} />
              Serial Numbers
            </h3>
            <p className="text-sm text-slate-500">
              {item.productName} ({item.itemCode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 bg-white border-b border-slate-100 space-y-4">
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab("unsold")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "unsold"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckCircle size={14} /> Good ({item.unsoldSerials?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("sold")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "sold"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShoppingCart size={14} /> Sold ({item.soldSerials?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("bad")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "bad"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AlertCircle size={14} /> Bad ({item.badSerials?.length || 0})
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial number..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {currentList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentList.map((serial) => (
                <div
                  key={serial.id}
                  className="bg-white px-3 py-2.5 rounded border border-slate-200 text-sm font-mono text-slate-700 hover:border-indigo-300 transition-colors shadow-sm flex items-center justify-between"
                >
                  <span>{serial.serialName}</span>
                  <span className="text-[10px] text-slate-400">
                    #{serial.id}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Search size={32} className="mb-2 opacity-50" />
              <p>No serial numbers found.</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Table Component ---
// UPDATED: Added 'allData' to props
const InventoryOverrideTable = ({ data, allData }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openSerialModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeSerialModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // --- EXPORT TO EXCEL FUNCTION ---
  const handleDownloadExcel = () => {
    // UPDATED: Use allData (full filtered list) if available, otherwise fallback to data (current page)
    const dataToExport = allData && allData.length > 0 ? allData : data;

    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    try {
      // 1. Prepare Data
      const exportData = dataToExport.map((item) => ({
        "Product Name": item.productName,
        "Item Code": item.itemCode,
        Location: item.locationName,
        UOM: item.uomName,
        "Total Stock": item.totalCount,

        // Serial Number Lists in the middle
        "Good Serial Numbers":
          item.unsoldSerials?.map((s) => s.serialName).join(", ") || "",
        "Sold Serial Numbers":
          item.soldSerials?.map((s) => s.serialName).join(", ") || "",
        "Bad Serial Numbers":
          item.badSerials?.map((s) => s.serialName).join(", ") || "",

        // Metrics at the END (Right side)
        "Serialized?": item.hasSerial ? "Yes" : "No",
        "Good Stock": item.unsoldCount, // Green Header
        "Sold Count": item.soldCount, // Blue Header
        "Bad Stock": item.badStock, // Red Header
      }));

      // 2. Create Worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 3. Define Styles
      const baseHeaderStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      // Header Colors
      const defaultHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "4F46E5" } },
      }; // Indigo
      const goodHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "10B981" } },
      }; // Green
      const soldHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "3B82F6" } },
      }; // Blue
      const badHeader = {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: "EF4444" } },
      }; // Red

      const cellStyle = {
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      // 4. AutoFit Columns
      const colWidths = Object.keys(exportData[0]).map((key) => {
        let maxLen = key.length;
        exportData.slice(0, 50).forEach((row) => {
          const val = String(row[key] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        // Cap width to prevent massive serial columns
        return { wch: Math.min(maxLen + 2, 60) };
      });
      ws["!cols"] = colWidths;

      // 5. Apply Styles
      const range = XLSX.utils.decode_range(ws["!ref"]);

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[address]) continue;

          if (R === 0) {
            // Header Row Logic
            const cellValue = ws[address].v;

            if (cellValue === "Good Stock") {
              ws[address].s = goodHeader;
            } else if (cellValue === "Sold Count") {
              ws[address].s = soldHeader;
            } else if (cellValue === "Bad Stock") {
              ws[address].s = badHeader;
            } else {
              ws[address].s = defaultHeader;
            }
          } else {
            // Body Rows
            ws[address].s = cellStyle;
          }
        }
      }

      // 6. Generate
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Physical_Inventory_Base_${dateStr}.xlsx`);

      toast.success("Excel downloaded successfully!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export data.");
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">
          No Inventory Found
        </h3>
        <p className="text-slate-500 mt-2">
          Try adjusting your search or location filters.
        </p>
      </div>
    );
  }

  const InventoryCard = ({ item }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4 relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-lg leading-tight">
            {item.productName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              {item.itemCode}
            </span>
            {item.hasSerial && (
              <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-wide flex items-center gap-1">
                <QrCode size={10} /> Serialized
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
          <MapPin size={12} />
          {item.locationName}
        </div>
      </div>

      <div className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mb-3">
        <div>
          <span className="text-xs text-indigo-500 font-bold uppercase block">
            Total Stock
          </span>
          <span className="text-2xl font-bold text-indigo-700">
            {item.totalCount}
          </span>
          <span className="text-xs text-indigo-400 ml-1">{item.uomName}</span>
        </div>

        {item.hasSerial && (
          <button
            onClick={() => openSerialModal(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 text-xs font-bold rounded-md hover:bg-indigo-50 shadow-sm"
          >
            <Eye size={14} /> View Serials
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-slate-50 border border-slate-100">
          <p className="text-slate-400 mb-0.5">Good</p>
          <p className="font-bold text-teal-600 text-base">
            {item.unsoldCount}
          </p>
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-100">
          <p className="text-slate-400 mb-0.5">Sold</p>
          <p className="font-bold text-slate-600 text-base">{item.soldCount}</p>
        </div>
        <div className="p-2 rounded bg-slate-50 border border-slate-100">
          <p className="text-slate-400 mb-0.5">Bad</p>
          <p className="font-bold text-orange-600 text-base">{item.badStock}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SerialNumberModal
        isOpen={isModalOpen}
        onClose={closeSerialModal}
        item={selectedItem}
      />

      <div className="flex justify-end mb-4">
        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-medium text-sm"
        >
          <Download size={16} /> Download Excel
        </button>
      </div>

      <div className="md:hidden">
        {data.map((item) => (
          <InventoryCard
            key={`${item.productId}-${item.locationId}`}
            item={item}
          />
        ))}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-medium">
            <tr>
              <th className="px-6 py-4 w-[25%]">Product Details</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4 text-center">Unit</th>
              <th className="px-6 py-4 text-center bg-indigo-50/40 text-indigo-700">
                Total Stock
              </th>
              <th className="px-6 py-4 text-center text-teal-700">Good</th>
              <th className="px-6 py-4 text-center text-slate-600">Sold</th>
              <th className="px-6 py-4 text-center text-orange-700">Bad</th>
              <th className="px-6 py-4 text-center">Serials</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr
                key={`${item.productId}-${item.locationId}`}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-base">
                      {item.productName}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-slate-500 text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        <Tag size={10} /> {item.itemCode}
                      </div>
                      {item.hasSerial && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                          SERIALIZED
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <MapPin size={14} className="text-slate-400" />
                    {item.locationName}
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md bg-white text-slate-600 text-xs font-medium border border-slate-200 shadow-sm">
                    {item.uomName}
                  </span>
                </td>

                <td className="px-6 py-4 text-center bg-indigo-50/20">
                  <span className="text-lg font-bold text-indigo-700 block">
                    {item.totalCount}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="font-medium text-teal-600">
                    {item.unsoldCount}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className="font-medium text-slate-500">
                    {item.soldCount}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`font-medium ${
                      item.badStock > 0 ? "text-orange-600" : "text-slate-300"
                    }`}
                  >
                    {item.badStock}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  {item.hasSerial ? (
                    <button
                      onClick={() => openSerialModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-all"
                      title="View Serial Numbers"
                    >
                      <Eye size={14} /> View
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300 italic">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InventoryOverrideTable;
