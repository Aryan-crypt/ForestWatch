import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { DeforestationDriver } from '../types';

interface DeforestationPieChartProps {
  data: DeforestationDriver[];
}

const COLORS = ['#059669', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-gray-800/80 text-white rounded-md border border-gray-600">
        <p className="font-bold">{`${payload[0].name}`}</p>
        <p>{`Contribution: ${payload[0].value.toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

export const DeforestationPieChart: React.FC<DeforestationPieChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          // FIX: Cast data to `any` to resolve a type mismatch with recharts' `Pie` component.
          // The component's `data` prop can be overly strict, expecting a type with an index
          // signature which `DeforestationDriver[]` does not have. This cast bypasses
          // the check, as the data structure is functionally correct for the chart.
          data={data as any}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="percentage"
          nameKey="reason"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
            iconSize={10} 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            wrapperStyle={{ fontSize: '12px', color: 'rgb(156 163 175)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
