import { ParseResult } from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'
import FetchCsv from '../CsvFetcher'
import { Median } from '../models'

const metrics = ['likes', 'comments', 'shares']
const timedeltas: Record<string, string> = {
  year: 'Year',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  hourofday: 'Hour of Day',
}
const titles: Record<string, string> = {
  likes: 'Median Likes',
  comments: 'Median Comments',
  shares: 'Median Shares',
}

interface MetricMediansProps {
  metric: string
  timedeltaMedians: Record<string, Median[]>
}

function MetricMedians({ metric, timedeltaMedians }: MetricMediansProps) {
  const [selectedTimedelta, setSelectedTimedelta] = useState<string>(Object.keys(timedeltas)[0])
  const isDateType = !['year', 'hourofday', 'minuteofday'].includes(selectedTimedelta)
  // console.log('MetricMedians metricDataset[selectedTimedelta]', metricDataset[selectedTimedelta])
  // transpose [{X: 1, Y: 10}, {X: 2, Y: 20}] => [[1,2], [10,20]]
  const medians = timedeltaMedians[selectedTimedelta]
  const xySeries: [number[], number[]] = [
    medians.map((m) => (isDateType ? Date.parse(m.post_time) / 1000 : parseInt(m.post_time))),
    medians.map((m) => m.median),
  ]

  return (
    <Section title={titles[metric]} level={3}>
      <ButtonGroup
        options={Object.entries(timedeltas).map(([value, name]) => ({ name: `Per ${name}`, value }))}
        onChange={(value: string) => setSelectedTimedelta(value)}
      />
      <TimelineChart
        data={xySeries}
        isXAxisDateType={isDateType}
        isCategorical={!isDateType}
        xAxisLabel={timedeltas[selectedTimedelta]}
        yAxisLabel={`Median no. of ${metric}`}
      />
    </Section>
  )
}

type TimedeltaMedianDataset = Record<string, Median[]>
type MetricTimedeltaMedianDataset = Record<string, TimedeltaMedianDataset>

export default function MetricsMedians() {
  const defaultDataset: MetricTimedeltaMedianDataset = {}
  for (const metric of metrics) {
    defaultDataset[metric] = {}
    for (const timedelta of Object.keys(timedeltas)) {
      defaultDataset[metric][timedelta] = []
    }
  }
  const [datasets, setDatasets] = useState<MetricTimedeltaMedianDataset>(defaultDataset)

  useEffect(() => {
    const promises: Promise<ParseResult<Median>>[] = []
    const metricTimedeltas: { metric: string; timedelta: string }[] = []
    for (const metric of metrics) {
      for (const timedelta of Object.keys(timedeltas)) {
        const csvUrl = `./data/metrics-medians/${metric}-${timedelta}.csv`
        promises.push(FetchCsv<Median>(csvUrl))
        metricTimedeltas.push({ metric, timedelta })
      }
    }

    Promise.all(promises)
      .then((results) => {
        const queriedDatasets: MetricTimedeltaMedianDataset = {}
        for (const [i, result] of results.entries()) {
          const { metric, timedelta } = metricTimedeltas[i]
          if (!queriedDatasets[metric]) {
            queriedDatasets[metric] = {}
          }
          queriedDatasets[metric][timedelta] = result.data
        }
        setDatasets(queriedDatasets)
      })
      .catch(console.error)
  }, [])

  return (
    <Section title="Metrics Medians" level={2}>
      <p>
        Here are the median counts of each metric. We can see the medians grow in time as NUSWhispers became popular. I
        decided to use medians instead of averages as medians are not affected by the outliers, hence giving more
        accurate expected likes/comments/shares a post would receive at the time.
      </p>
      {metrics.map((metric) => (
        <MetricMedians
          key={metric}
          metric={metric}
          timedeltaMedians={datasets[metric]}
          // timedeltas={timedeltas}
        />
      ))}
    </Section>
  )
}
