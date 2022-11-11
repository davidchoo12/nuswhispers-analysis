import { useContext, useEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { tooltipsPlugin } from './UplotPlugins'
import './TimelineChart.css'
import { ThemeContext } from '../ThemeContext'

interface TimelineChartProps {
  data: [(number | string)[], number[]]
  isXAxisDateType?: boolean
  isCategorical?: boolean
}

export default function TimelineChart({ data, isXAxisDateType = true, isCategorical = false }: TimelineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const theme = useContext(ThemeContext)
  console.log('timelinechart render', theme.palette)

  const lineColor = '#10b981'
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

    const parentWidth = chartRef.current.parentElement!.clientWidth
    const opts: uPlot.Options = {
      width: parentWidth,
      height: Math.max(parentWidth / 3, 300),
      scales: {
        x: {
          time: isXAxisDateType,
          distr: isCategorical ? 2 : 1, // align x axis ticks with labels, src https://jsfiddle.net/571rx4y0/2/
        },
      },
      cursor: {
        points: {
          size: 8,
          stroke: lineColor,
          width: 2,
          fill: 'white',
        },
      },
      plugins: [tooltipsPlugin(isCategorical ? { xLabels } : undefined)],
      tzDate: (ts) => uPlot.tzDate(new Date(ts * 1e3), 'Etc/UTC'),
      series: [
        {},
        {
          stroke: lineColor,
          width: 1,
          fill: theme.palette.graphFill,
        },
      ],
      legend: {
        show: false,
      },
      axes: [
        {
          font: '12px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          stroke: theme.palette.fgColor,
          ticks: {
            stroke: theme.palette.graphGrid,
            width: 1,
          },
          grid: {
            stroke: theme.palette.graphGrid,
            width: 1,
          },
          values: isCategorical ? xLabels : undefined,
        },
        {
          size: 60,
          font: '12px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          stroke: theme.palette.fgColor,
          ticks: {
            stroke: theme.palette.graphGrid,
            width: 1,
          },
          grid: {
            stroke: theme.palette.graphGrid,
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
  }, [data, isXAxisDateType, isCategorical, theme])

  return <div ref={chartRef}></div>
}
