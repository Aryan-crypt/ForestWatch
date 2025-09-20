import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { ChartDataPoint } from '../types';

interface DeforestationChartProps {
  data: ChartDataPoint[];
}

export const DeforestationChart: React.FC<DeforestationChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 10,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
        <XAxis 
          dataKey="year" 
          stroke="rgb(156 163 175)" 
          angle={-45} 
          textAnchor="end"
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis stroke="rgb(156 163 175)" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.8)', 
            borderColor: '#4b5563',
            color: '#ffffff'
          }} 
          cursor={{fill: 'rgba(110, 231, 183, 0.1)'}}
        />
        <Legend />
        <Bar dataKey="loss" name="Annual Loss (sq km)" fill="#16a34a" />
        <Line type="monotone" dataKey="loss" name="Trend" stroke="#facc15" strokeWidth={2} dot={{ r: 4, fill: '#facc15' }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};