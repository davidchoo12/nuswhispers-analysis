import { ParseResult } from 'papaparse'
import { ReactNode, useEffect, useState } from 'react'
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
  children: ReactNode
}

function MetricMedians({ metric, timedeltaMedians, children }: MetricMediansProps) {
  const [selectedTimedelta, setSelectedTimedelta] = useState<string>(Object.keys(timedeltas)[0])
  const isDateType = !['year', 'hourofday', 'minuteofday'].includes(selectedTimedelta)
  // transpose [{X: 1, Y: 10}, {X: 2, Y: 20}] => [[1,2], [10,20]]
  const medians = timedeltaMedians[selectedTimedelta]
  const xySeries: [number[], number[]] = [
    medians.map((m) => (isDateType ? Date.parse(m.post_time) / 1000 : parseInt(m.post_time))),
    medians.map((m) => m.median),
  ]

  return (
    <Section title={titles[metric]} level={3}>
      {children}
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
      <p>
        All metrics show growth since 2019 which means NUSWhispers posts have been receiving more user activity/traffic
        over time.
      </p>
      <MetricMedians metric={'likes'} timedeltaMedians={datasets['likes']}>
        <p>
          Likes are the easiest interaction for a post. I would expect likes to have the highest median out of the 3
          metrics.
        </p>
      </MetricMedians>
      <MetricMedians metric={'comments'} timedeltaMedians={datasets['comments']}>
        <p>
          Surprisingly, comments get around the same median with likes. This means users are equally as likely to
          comment on a post as compared to like a post, which also means posts tend to be quite controversial, prompting
          everyone's opinions.
        </p>
      </MetricMedians>
      <MetricMedians metric={'shares'} timedeltaMedians={datasets['shares']}>
        As expected, shares get the least medians. Since the median per hour of day is mostly 0, it means at least half
        of all posts have 0 shares. This will change though as the median has been increasing over time.
      </MetricMedians>
    </Section>
  )
}
