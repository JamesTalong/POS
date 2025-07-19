import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import Loader from "../../../loader/Loader";
import { domain } from "../../../../security";

const RecentOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(!0);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sort, setSort] = useState({ key: "date", direction: "descending" });
  const fetchData = useCallback(async () => {
    try {
      const r = await axios.get(`${domain}/api/Transactions`);
      setData(r.data);
    } catch (e) {
      console.error("E:", e);
      toast.error("Fetch failed.");
    } finally {
      setLoading(!1);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleSort = (k) => {
    setSort((s) => ({
      key: k,
      direction:
        s.key === k && s.direction === "ascending" ? "descending" : "ascending",
    }));
  };
  const sortedData = useMemo(
    () =>
      [...data].sort((a, b) => {
        const asc = sort.direction === "ascending" ? 1 : -1;
        const vA = sort.key === "date" ? new Date(a.date) : a[sort.key];
        const vB = sort.key === "date" ? new Date(b.date) : b[sort.key];
        if (vA < vB) return -1 * asc;
        if (vA > vB) return 1 * asc;
        return 0;
      }),
    [data, sort]
  );
  const currentItems = sortedData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const formatAmount = (a) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(a || 0);
  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col bg-white p-4 rounded-lg shadow-sm border border-gray-200/50">
        <strong className="text-gray-700 font-bold text-md mb-2">
          Recent Orders
        </strong>
        <div className="border-x border-gray-200/50 rounded-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-500">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/70">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  Date{" "}
                  {sort.key === "date" &&
                    (sort.direction === "ascending" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-3 py-2">
                  Customer
                </th>
                <th scope="col" className="px-3 py-2">
                  Items
                </th>
                <th scope="col" className="px-3 py-2">
                  Prepared
                </th>
                <th scope="col" className="px-3 py-2">
                  Checked
                </th>
                <th scope="col" className="px-3 py-2">
                  Payment
                </th>
                <th scope="col" className="px-3 py-2">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <Loader />
              ) : (
                currentItems.map((t) => (
                  <tr
                    key={t.id}
                    className="bg-white border-b border-gray-200/40 hover:bg-gray-50/50 text-[12px]"
                  >
                    <td className="px-3 py-2">
                      {new Date(t.date).toLocaleDateString("en-US", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {t?.customer?.customerName || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {t?.purchasedProducts?.length > 0 ? (
                        t.purchasedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center text-[11px]"
                          >
                            <p className="font-semibold">
                              {p?.pricelist?.productName || "?"}
                            </p>
                            <p className="ml-2 text-gray-400">
                              x{p?.quantity || 0}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p>-</p>
                      )}
                    </td>
                    <td className="px-3 py-2">{t?.preparedBy || "-"}</td>
                    <td className="px-3 py-2">{t?.checkedBy || "-"}</td>
                    <td className="px-3 py-2">
                      {t?.paymentType || ""}
                      {t?.location ? `(${t.location})` : ""}
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-600">
                      ₱{formatAmount(t?.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center mt-3 space-x-2 text-xs">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className="px-3 py-1 bg-gray-200/80 rounded text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-gray-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-gray-200/80 rounded text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
export default RecentOrders;
