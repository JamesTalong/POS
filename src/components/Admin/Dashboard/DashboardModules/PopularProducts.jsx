import { useState, useEffect } from "react";
import axios from "axios";
import Loader from "../../../loader/Loader";
import { domain } from "../../../../security";
import noImage from "../../../../Images/noImage.jpg";

const PopularProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!0);
  const [page, setPage] = useState(1);
  const prodsPerPage = 5;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await axios.get(`${domain}/api/Transactions/top-products`);
        const transformed = r.data.map((i) => ({
          id: i.productId,
          name: i.productName,
          img: `data:image/png;base64,${i.productImage}`,
          sold: i.totalQuantity,
        }));
        setProducts(transformed);
      } catch (e) {
        console.error("E:", e);
      } finally {
        setLoading(!1);
      }
    };
    fetchData();
  }, []);
  const totalPages = Math.ceil(products.length / prodsPerPage) || 1;
  const currentProds = products.slice(
    (page - 1) * prodsPerPage,
    page * prodsPerPage
  );
  return (
    <div className="flex flex-col h-full bg-white p-4 rounded-lg shadow-sm border border-gray-200/50">
      <strong className="flex-shrink-0 text-gray-700 font-bold text-md">
        Popular Products
      </strong>
      <div className="mt-2 flex-grow flex flex-col gap-2">
        {loading ? (
          <Loader />
        ) : (
          currentProds.map((p) => (
            <div
              key={p.id}
              className="flex items-center border-b border-gray-200/40 pb-2 last:border-b-0"
            >
              <img
                className="w-8 h-8 min-w-[2rem] bg-gray-200/50 rounded-sm object-cover"
                src={p.img}
                alt={p.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = noImage;
                }}
              />
              <div className="ml-3 flex-1">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {p.name}
                </p>
                <p className="text-[11px] text-gray-500">Sold: {p.sold}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex-shrink-0 flex justify-center items-center mt-3 space-x-2 text-xs">
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
  );
};
export default PopularProducts;
