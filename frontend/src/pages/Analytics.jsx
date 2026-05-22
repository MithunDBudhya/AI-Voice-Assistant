import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const Analytics = () => {
  const sentimentData = [
    { name: 'Positive', value: 45 },
    { name: 'Neutral', value: 40 },
    { name: 'Frustrated', value: 15 },
  ];

  const COLORS = ['#10b981', '#64748b', '#f43f5e'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Deep Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Detailed insights into agent performance and customer satisfaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Sentiment Distribution</h3>
          <div className="h-72 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Top Customer Issues</h3>
          <div className="space-y-4">
            {[
              { issue: "Where is my order?", percentage: "45%", count: 120 },
              { issue: "Refund not received", percentage: "25%", count: 68 },
              { issue: "Product defective", percentage: "15%", count: 40 },
              { issue: "Change delivery address", percentage: "10%", count: 28 },
              { issue: "Other", percentage: "5%", count: 14 }
            ].map((item, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.issue}</span>
                  <span className="text-slate-500">{item.percentage}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: item.percentage }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
