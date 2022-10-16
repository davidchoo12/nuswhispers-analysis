import { ParseResult } from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'
import FetchCsv from '../CsvFetcher'
import { Median } from '../models'

const metrics = ['likes', 'comments', 'shares']
const timedeltas = {
  year: 'Per Year',
  month: 'Per Month',
  week: 'Per Week',
  day: 'Per Day',
  hourofday: 'Per Hour of Day',
}
const titles = ['Median Likes', 'Median Comments', 'Median Shares']

interface MetricMediansProps {
  title: string
  timedeltaMedians: Record<string, Median[]>
}

function MetricMedians({ title, timedeltaMedians }: MetricMediansProps) {
  const [selectedTimedelta, setSelectedTimedelta] = useState<string>(Object.keys(timedeltas)[0])
  // console.log('MetricMedians metricDataset[selectedTimedelta]', metricDataset[selectedTimedelta])
  // transpose [{X: 1, Y: 10}, {X: 2, Y: 20}] => [[1,2], [10,20]]
  const medians = timedeltaMedians[selectedTimedelta]
  const xySeries: [number[], number[]] = [
    medians.map((m) => Date.parse(m.post_time) / 1000 || parseInt(m.post_time)),
    medians.map((m) => m.median),
  ]

  return (
    <Section title={title} level={3}>
      <ButtonGroup
        options={Object.entries(timedeltas).map(([value, name]) => ({ name, value }))}
        onChange={(value: string) => setSelectedTimedelta(value)}
      />
      <TimelineChart data={xySeries} isXAxisDateType={!['hourofday', 'minuteofday'].includes(selectedTimedelta)} />
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
        const csvUrl = `/data/metrics-medians/${metric}-${timedelta}.csv`
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
      {metrics.map((metric, i) => (
        <MetricMedians
          key={metric}
          title={titles[i]}
          timedeltaMedians={datasets[metric]}
          // timedeltas={timedeltas}
        />
      ))}
    </Section>
  )
}
