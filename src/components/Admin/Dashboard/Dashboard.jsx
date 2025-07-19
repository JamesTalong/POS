import React, { useState } from "react";
import DashboardStatsGrid from "./DashboardModules/DashboardStatsGrid";
import TransactionChart from "./DashboardModules/TransactionChart";
import RecentOrders from "./DashboardModules/RecentOrders";
import LocationPieChart from "./DashboardModules/LocationPieChart";
import PopularProducts from "./DashboardModules/PopularProducts";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4">
      <DashboardStatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full h-full">
        <TransactionChart className="lg:col-span-2 flex flex-col  " />
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
