import React, { useState } from "react";
import DashboardStatsGrid from "./DashboardModules/DashboardStatsGrid";
import TransactionChart from "./DashboardModules/TransactionChart";
import RecentOrders from "./DashboardModules/RecentOrders";
import LocationPieChart from "./DashboardModules/LocationPieChart";
import PopularProducts from "./DashboardModules/PopularProducts";
import DashboardFilter from "./DashboardModules/DashboardFilter"; // Import the new component

export default function Dashboard() {
  // LIFTED STATE: These manage the filters for the whole dashboard
  const [sourceType, setSourceType] = useState("Transactions");
  const [selectedLocation, setSelectedLocation] = useState("All");

  return (
    <div className="flex flex-col gap-6">
      {/* 1. The Global Filter Component */}
      <DashboardFilter
        sourceType={sourceType}
        setSourceType={setSourceType}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />

      {/* 2. Stats Grid (Receives props) */}
      <DashboardStatsGrid
        sourceType={sourceType}
        selectedLocation={selectedLocation}
      />

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full h-full">
        {/* Transaction Chart (Receives props) */}
        <TransactionChart
          className="lg:col-span-4 flex flex-col"
          sourceType={sourceType}
          selectedLocation={selectedLocation}
        />
        <LocationPieChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full h-full">
        <div className="lg:col-span-4 flex flex-col h-full">
          <RecentOrders />
        </div>
        <div className="flex flex-col h-full ">
          <PopularProducts />
        </div>
      </div>
    </div>
  );
}
