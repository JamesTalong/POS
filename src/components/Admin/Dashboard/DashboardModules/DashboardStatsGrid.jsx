import React, { useEffect, useState } from "react";
import { IoBagHandle, IoPeople, IoCart } from "react-icons/io5";
import axios from "axios";
import { domain } from "../../../../security";

export default function DashboardStatsGrid() {
  const [transactionData, setTransactionData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [salesPerMonth, setSalesPerMonth] = useState(0);
  const [ordersPerMonth, setOrdersPerMonth] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${domain}/api/Transactions`);
        setTransactionData(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (transactionData && transactionData.length > 0) {
      let totalSalesCalc = 0;
      let salesPerMonthCalc = 0;
      let ordersPerMonthCalc = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      transactionData.forEach((transaction) => {
        totalSalesCalc += transaction.totalAmount;
        const transactionDate = new Date(transaction.date);
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();

        if (
          transactionMonth === currentMonth &&
          transactionYear === currentYear
        ) {
          salesPerMonthCalc += transaction.totalAmount;
          ordersPerMonthCalc += 1;
        }
      });

      setTotalSales(totalSalesCalc);
      setSalesPerMonth(salesPerMonthCalc);
      setOrdersPerMonth(ordersPerMonthCalc);
    }
  }, [transactionData]);

  return (
    <div>
      {/* --- MOBILE VIEW --- */}
      {/* This view is visible by default and hidden on medium screens and up (md:hidden) */}
      <div className="md:hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex justify-around items-start text-center">
          {/* Stat 1: Total Sales */}
          <div className="flex flex-col items-center space-y-2">
            <IoBagHandle className="w-7 h-7 text-blue-400" />
            <p className="text-sm font-medium text-gray-300">Total Sales</p>
            <p className="text-2xl font-bold">₱{totalSales.toLocaleString()}</p>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-20 bg-gray-600"></div>

          {/* Stat 2: Sales This Month */}
          <div className="flex flex-col items-center space-y-2">
            <IoPeople className="w-7 h-7 text-green-400" />
            <p className="text-sm font-medium text-gray-300">This Month</p>
            <p className="text-2xl font-bold">
              ₱{salesPerMonth.toLocaleString()}
            </p>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-20 bg-gray-600"></div>

          {/* Stat 3: Orders This Month */}
          <div className="flex flex-col items-center space-y-2">
            <IoCart className="w-7 h-7 text-purple-400" />
            <p className="text-sm font-medium text-gray-300">Orders</p>
            <p className="text-2xl font-bold">
              {ordersPerMonth.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* --- DESKTOP VIEW --- */}
      {/* This view is hidden by default and displayed as a grid on medium screens and up (hidden md:grid) */}
      <div className="hidden md:grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-3 text-white">
        <StatCard
          icon={<IoBagHandle className="w-8 h-8" />}
          title="Total Sales"
          value={`₱ ${totalSales.toLocaleString()}`}
          fromColor="from-blue-500"
          toColor="to-blue-700"
        />
        <StatCard
          icon={<IoPeople className="w-8 h-8" />}
          title="Sales This Month"
          value={`₱ ${salesPerMonth.toLocaleString()}`}
          fromColor="from-green-500"
          toColor="to-green-700"
        />
        <StatCard
          icon={<IoCart className="w-8 h-8" />}
          title="Orders This Month"
          value={ordersPerMonth.toLocaleString()}
          fromColor="from-purple-500"
          toColor="to-purple-700"
        />
      </div>
    </div>
  );
}

// This component is now only used for the desktop view and does not need to be changed.
function StatCard({ icon, title, value, fromColor, toColor }) {
  return (
    <div
      className={`bg-gradient-to-br ${fromColor} ${toColor} rounded-2xl p-6 shadow-xl flex items-center justify-center space-x-4`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-left">
        <p className="text-base md:text-lg font-medium opacity-90">{title}</p>
        <p className="text-3xl md:text-4xl font-bold mt-1 leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}
