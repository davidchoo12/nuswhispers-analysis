import React, { useEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { tooltipsPlugin } from './UplotPlugins'
import './TimelineChart.css'

interface TimelineChartProps {
  data: [(number | string)[], number[]]
  isXAxisDateType?: boolean
  isCategorical?: boolean
}

export default function TimelineChart({ data, isXAxisDateType = true, isCategorical = false }: TimelineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data || chartRef.current === null) {
      return
    }

    let uplotData: [number[], number[]] = [[], []] // copy so that original data is not mutated
    const xLabels = [...data[0]]
    if (isCategorical) {
      uplotData[0] = [...xLabels.keys()]
    } else {
      uplotData[0] = [...data[0]] as number[]
    }
    uplotData[1] = [...data[1]]

    const opts: uPlot.Options = {
      width: 1200,
      height: 600,
      scales: {
        x: {
          time: isXAxisDateType,
          distr: isCategorical ? 2 : 1, // align x axis ticks with labels, src https://jsfiddle.net/571rx4y0/2/
        },
      },
      cursor: {
        points: {
          size: 8,
          stroke: 'blue',
          width: 2,
          fill: 'white',
        },
      },
      plugins: [tooltipsPlugin(isCategorical ? { xLabels } : undefined)],
      tzDate: (ts) => uPlot.tzDate(new Date(ts * 1e3), 'Etc/UTC'),
      series: [
        {},
        {
          stroke: '#0057b7',
          width: 1,
          fill: 'rgba(0, 87, 183,0.15)',
        },
      ],
      legend: {
        show: false,
      },
      axes: [
        {
          font: '12px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          ticks: {
            stroke: 'rgba(0,0,0,0.1)',
            width: 1,
          },
          grid: {
            stroke: 'rgba(0,0,0,0.1)',
            width: 1,
          },
          values: isCategorical ? xLabels : undefined,
        },
        {
          size: 60,
          font: '12px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          ticks: {
            stroke: 'rgba(0,0,0,0.1)',
            width: 1,
          },
          grid: {
            stroke: 'rgba(0,0,0,0.1)',
            width: 1,
          },
        },
      ],
    }

    chartRef.current.innerHTML = ''
    const elem = chartRef.current
    new uPlot(opts, uplotData, elem)

    return () => {
      if (elem?.innerHTML) {
        elem.innerHTML = ''
      }
    }
  }, [data, isXAxisDateType, isCategorical])

  return <div ref={chartRef}></div>
}
