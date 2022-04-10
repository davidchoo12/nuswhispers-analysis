import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { wheelZoomPlugin, touchZoomPlugin } from './UplotPlugins';
// import {
//   BarChart,
//   Bar,
//   Brush,
//   ReferenceLine,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer
// } from 'recharts';

export default function TimelineChart({ dateStart, dateEnd }) {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  let data = [];
  let d = start;
  let i = 0;
  let xValues = [];
  let yValues = [];
  while (d <= end) {
    xValues.push(d.getTime() / 1000);
    yValues.push(Math.round(Math.random() * 1000));
    d.setDate(d.getDate() + 1);
  }
  data = [xValues, yValues];
  console.log(data);
  const chartRef = useRef(null);

  useEffect(() => {
    new uPlot(
      {
        width: 1200,
        height: 600,
        plugins: [wheelZoomPlugin({ factor: 0.75 })],
        scales: {
          x: {
            time: true
          }
        },
        series: [
          {},
          {
            // in-legend display
            label: 'Duration in hours',
            // series style
            stroke: '#1c5878',
            width: 1,
            fill: '#2e8fc2'
          }
        ]
      },
      data,
      chartRef.current
    );
  }, []);
  return (
    <div ref={chartRef}></div>
    // <ResponsiveContainer width="100%" height={300}>
    //   <BarChart width={500} height={300} data={data}>
    //     <CartesianGrid strokeDasharray="3 3" />
    //     <XAxis dataKey="date" />
    //     <YAxis />
    //     <Tooltip isAnimationActive={false} />
    //     <Brush dataKey="date" height={30} stroke="#8884d8" />
    //     <Bar dataKey="y" fill="blue" />
    //   </BarChart>
    // </ResponsiveContainer>
  );
}
