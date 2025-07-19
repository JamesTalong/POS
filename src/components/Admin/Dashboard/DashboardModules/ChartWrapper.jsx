import React from "react";
import { ResponsiveContainer } from "recharts";

const ChartWrapper = ({ children }) => {
  return (
    <div>
      <div className="w-auto h-full bg-white p-4 rounded-sm  flex flex-col border border-gray-200 ">
        <strong className="text-gray-700 font-medium">Month Sales</strong>
        <div className="mt-3 w-full flex-1 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartWrapper;
