import { ParseResult } from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'
import FetchCsv from '../CsvFetcher'
import { Frequency } from '../models'

const datasetConfigs = [
  {
    id: 'year',
    name: 'Per Year',
    url: './data/posts-freq/year.csv',
  },
  {
    id: 'month',
    name: 'Per Month',
    url: './data/posts-freq/month.csv',
  },
  {
    id: 'week',
    name: 'Per Week',
    url: './data/posts-freq/week.csv',
  },
  {
    id: 'day',
    name: 'Per Day',
    url: './data/posts-freq/day.csv',
  },
  {
    id: 'hourofday',
    name: 'Per Hour of Day',
    url: './data/posts-freq/hourofday.csv',
  },
]

type TimedeltaFrequencyDataset = Record<string, Frequency[]>

export default function PostsFrequency() {
  const [datasets, setDatasets] = useState<TimedeltaFrequencyDataset>({})
  const [selectedTimedelta, setSelectedTimedelta] = useState<string>('year')
  useEffect(() => {
    const promises: Promise<ParseResult<Frequency>>[] = datasetConfigs.map((conf) => FetchCsv<Frequency>(conf.url))

    Promise.all(promises).then((results) => {
      const queriedDatasets: TimedeltaFrequencyDataset = {}
      for (const [i, result] of results.entries()) {
        const timedelta = datasetConfigs[i].id
        queriedDatasets[timedelta] = result.data
      }
      setDatasets(queriedDatasets)
    })
  }, [])

  const frequencies = datasets[selectedTimedelta] || []
  const xySeries: [number[], number[]] = [
    frequencies.map((f) => Date.parse(f.post_time) / 1000 || parseInt(f.post_time)),
    frequencies.map((f) => f.count),
  ]

  return (
    <Section title="Posts Frequency" level={2}>
      <ButtonGroup
        options={datasetConfigs.map((config) => ({ name: config.name, value: config.id }))}
        onChange={(value: string) => setSelectedTimedelta(value)}
      />
      <TimelineChart data={xySeries} isXAxisDateType={!['hourofday', 'minuteofday'].includes(selectedTimedelta)} />
    </Section>
  )
}
