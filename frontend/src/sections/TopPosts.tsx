import { ParseResult } from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import PostsTable from '../components/PostsTable'
import Section from '../components/Section'
import FetchCsv from '../CsvFetcher'
import { Post } from '../models'

interface TopPostsByMetricProps {
  title: string
  metricDataset: Record<string, Post[]>
  timedeltas: Record<string, string>
}

function TopPostsByMetric({ title, metricDataset, timedeltas }: TopPostsByMetricProps) {
  const [selectedTimedelta, setSelectedTimedelta] = useState(Object.keys(timedeltas)[0])
  return (
    <Section title={title} level={3}>
      <ButtonGroup
        options={Object.entries(timedeltas).map(([value, name]) => ({ name, value }))}
        onChange={(value: string) => setSelectedTimedelta(value)}
      />
      <PostsTable csvData={metricDataset[selectedTimedelta].slice(0, 10)} />
    </Section>
  )
}

const metrics = ['likes', 'comments', 'shares']
const timedeltas = { all: 'All Time', year: 'This Year', month: 'This Month', week: 'This Week' }
const titles = ['Top 10 most liked posts', 'Top 10 most commented posts', 'Top 10 most shared posts']

type TimedeltaPostDataset = Record<string, Post[]>
type MetricTimedeltaPostDataset = Record<string, TimedeltaPostDataset>

export default function TopPosts() {
  const defaultDataset: MetricTimedeltaPostDataset = {}
  for (const metric of metrics) {
    defaultDataset[metric] = {}
    for (const timedelta of Object.keys(timedeltas)) {
      defaultDataset[metric][timedelta] = []
    }
  }
  const [datasets, setDatasets] = useState<MetricTimedeltaPostDataset>(defaultDataset)

  useEffect(() => {
    const promises: Promise<ParseResult<Post>>[] = []
    const metricTimedeltas: { metric: string; timedelta: string }[] = []
    for (const metric of metrics) {
      for (const timedelta of Object.keys(timedeltas)) {
        const csvUrl = `/data/top-posts/${metric}-${timedelta}.csv`
        promises.push(FetchCsv<Post>(csvUrl))
        metricTimedeltas.push({ metric, timedelta })
      }
    }

    Promise.all(promises).then((results) => {
      const queriedDatasets: MetricTimedeltaPostDataset = {}
      for (const [i, result] of results.entries()) {
        const { metric, timedelta } = metricTimedeltas[i]
        if (!queriedDatasets[metric]) {
          queriedDatasets[metric] = {}
        }
        queriedDatasets[metric][timedelta] = result.data
      }
      setDatasets(queriedDatasets)
    })
  }, [])

  return (
    <Section title="Top Posts" level={2}>
      {metrics.map((metric, i) => (
        <TopPostsByMetric key={metric} title={titles[i]} metricDataset={datasets[metric]} timedeltas={timedeltas} />
      ))}
    </Section>
  )
}
