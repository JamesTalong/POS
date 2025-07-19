import React, { useEffect, useState, useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import axios from "axios";
import Loader from "../../../loader/Loader";
import { domain } from "../../../../security";

export default function TransactionChart() {
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [keys, setKeys] = useState([]);
  const [topN, setTopN] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${domain}/api/Transactions`);
        setTransactionData(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processed = useMemo(() => {
    const monthMap = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const years = new Set();
    const productTotals = {};
    const monthData = Array.from({ length: 12 }, (_, i) => ({
      month: monthMap[i],
    }));

    transactionData.forEach((txn) => {
      const date = new Date(txn.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      years.add(year);

      if (year === selectedYear) {
        txn.purchasedProducts.forEach((p) => {
          const name = p.pricelist?.productName;
          productTotals[name] = (productTotals[name] || 0) + p.quantity;
          monthData[month][name] = (monthData[month][name] || 0) + p.quantity;
        });
      }
    });

    // Get top N products
    const sortedProducts = Object.entries(productTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const selectedKeys =
      topN === "all" ? sortedProducts : sortedProducts.slice(0, topN);

    // Filter month data to only include selected keys
    const filteredMonthData = monthData.map((month) => {
      const filtered = { month: month.month };
      selectedKeys.forEach((key) => {
        if (month[key]) filtered[key] = month[key];
      });
      return filtered;
    });

    return {
      years: Array.from(years),
      chartData: filteredMonthData,
      keys: selectedKeys,
    };
  }, [transactionData, selectedYear, topN]);

  useEffect(() => {
    setAvailableYears(processed.years);
    setChartData(processed.chartData);
    setKeys(processed.keys);
  }, [processed]);

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col flex-grow bg-white p-6 rounded-lg shadow-md border border-gray-200 lg:col-span-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
          Popular Products Monthly
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm text-gray-600">
              Select Year:
            </label>
            <select
              id="year-select"
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="top-n-select" className="text-sm text-gray-600">
              Top Products:
            </label>
            <select
              id="top-n-select"
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={topN}
              onChange={(e) =>
                setTopN(
                  e.target.value === "all" ? "all" : parseInt(e.target.value)
                )
              }
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="30">Top 30</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-[500px] w-full">
        <ResponsiveBar
          data={chartData}
          keys={keys}
          indexBy="month"
          margin={{ top: 30, right: 180, bottom: 50, left: 40 }}
          padding={0.3}
          groupMode="stacked"
          layout="vertical"
          colors={{ scheme: "nivo" }}
          borderRadius={3}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Month",
            legendPosition: "middle",
            legendOffset: 40,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Quantity",
            legendPosition: "middle",
            legendOffset: -30,
          }}
          tooltip={({ id, value, color, indexValue }) => (
            <div className="p-2 text-sm bg-white shadow-md border rounded-md">
              <strong style={{ color }}>{id}</strong>
              <br />
              Month: {indexValue}
              <br />
              Quantity: {value}
            </div>
          )}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          legends={
            keys.length <= 30
              ? [
                  {
                    dataFrom: "keys",
                    anchor: "right",
                    direction: "column",
                    justify: false,
                    translateX: 160,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemsSpacing: 2,
                    symbolSize: 14,
                    effects: [
                      {
                        on: "hover",
                        style: {
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]
              : [] // hide legend if too many keys
          }
          animate
          motionStiffness={90}
          motionDamping={15}
        />
      </div>
    </div>
  );
}
