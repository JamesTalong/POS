import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend } from "recharts";
import axios from "axios";
import Loader from "../../../loader/Loader";
import ChartWrapper from "./ChartWrapper";
import { domain } from "../../../../security";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#FF66C4"];

const LocationPieChart = () => {
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-04"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${domain}/api/Transactions`);
        const transactions = response.data;

        const thisMonthData = transactions.filter((tx) =>
          tx.date.startsWith(currentMonth)
        );

        const locationMap = {};

        thisMonthData.forEach((tx) => {
          const location = tx.location?.trim() || "Unknown";
          tx.purchasedProducts?.forEach((product) => {
            const key = `${location}-${product.productName}`;
            locationMap[key] = (locationMap[key] || 0) + product.quantity;
          });
        });

        const aggregated = {};

        for (const key in locationMap) {
          const [location, productName] = key.split("-");
          aggregated[location] = (aggregated[location] || 0) + locationMap[key];
        }

        const chartData = Object.entries(aggregated).map(([name, value]) => ({
          name,
          value,
        }));

        setLocationData(chartData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentMonth]);

  if (loading) return <Loader />;

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartWrapper>
      <PieChart width={400} height={300}>
        <Pie
          data={locationData}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={renderLabel}
          outerRadius={105}
          fill="#8884d8"
          dataKey="value"
        >
          {locationData.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Legend layout="vertical" />
      </PieChart>
    </ChartWrapper>
  );
};

export default LocationPieChart;
