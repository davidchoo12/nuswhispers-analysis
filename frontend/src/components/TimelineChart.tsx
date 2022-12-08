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
  xAxisLabel: string
  yAxisLabel: string
}

export default function TimelineChart({
  data,
  isXAxisDateType = true,
  isCategorical = false,
  xAxisLabel,
  yAxisLabel,
}: TimelineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const theme = useContext(ThemeContext)

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
        },
      },
      cursor: {
        points: {
          size: 10,
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
          label: xAxisLabel,
          font: '12px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          stroke: theme.palette.fgColor,
          ticks: {
            stroke: theme.palette.graphGrid,
            width: 1,
          },
          space: isCategorical ? 1 : 40,
          incrs: isCategorical ? [1] : undefined,
          grid: {
            stroke: theme.palette.graphGrid,
            width: 1,
          },
          values: isCategorical ? xLabels : undefined,
        },
        {
          label: yAxisLabel,
          // copied from https://leeoniya.github.io/uPlot/demos/axis-autosize.html
          size: (self, values, axisIdx, cycleNum) => {
            let axis = self.axes[axisIdx]
            // bail out, force convergence
            if (cycleNum > 1) {
              // @ts-ignore
              return axis._size
            }
            let axisSize = (axis.ticks?.size || 10) + (axis.gap || 5)
            // find longest value
            let longestVal = (values ?? []).reduce((acc, val) => (val.length > acc.length ? val : acc), '')
            if (longestVal !== '') {
              self.ctx.font = axis.font?.[0] ?? '12px sans-serif'
              axisSize += self.ctx.measureText(longestVal).width / devicePixelRatio
            }
            return Math.ceil(axisSize)
          },
          font: '12px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          stroke: theme.palette.fgColor,
          labelGap: 10,
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
  }, [data, isXAxisDateType, isCategorical, xAxisLabel, yAxisLabel, theme])

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div ref={chartRef}></div>
      </div>
    </div>
  )
}
