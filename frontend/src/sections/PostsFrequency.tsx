import { ParseResult } from 'papaparse'
import { useEffect, useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'
import FetchCsv from '../CsvFetcher'
import { Frequency } from '../models'

const timedeltas: Record<string, string> = {
  year: 'Year',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  hourofday: 'Hour of Day',
}

type TimedeltaFrequencyDataset = Record<string, Frequency[]>

export default function PostsFrequency() {
  const [datasets, setDatasets] = useState<TimedeltaFrequencyDataset>({})
  const [selectedTimedelta, setSelectedTimedelta] = useState<string>('year')
  useEffect(() => {
    const promises: Promise<ParseResult<Frequency>>[] = []
    const timedeltaIds: string[] = Object.keys(timedeltas)
    for (const timedelta of Object.keys(timedeltas)) {
      const csvUrl = `./data/posts-freq/${timedelta}.csv`
      promises.push(FetchCsv<Frequency>(csvUrl))
    }

    Promise.all(promises).then((results) => {
      const queriedDatasets: TimedeltaFrequencyDataset = {}
      for (const [i, result] of results.entries()) {
        const timedelta = timedeltaIds[i]
        queriedDatasets[timedelta] = result.data
      }
      setDatasets(queriedDatasets)
    })
  }, [])

  const frequencies = datasets[selectedTimedelta] || []
  const isDateType = !['year', 'hourofday', 'minuteofday'].includes(selectedTimedelta)
  const xySeries: [number[], number[]] = [
    frequencies.map((f) => (isDateType ? Date.parse(f.post_time) / 1000 : parseInt(f.post_time))),
    frequencies.map((f) => f.count),
  ]

  return (
    <Section title="Posts Frequency" level={1}>
      <p>
        This graph shows the number of posts published on NUSWhispers facebook page over time. Interestingly there has
        been lesser posts over the past 2 years which might be why posts over the past 2 years receive higher medians
        since traffic is divided among less posts.
      </p>
      <p>
        The highest posts per day is from the early days of the platform, seemingly from content seeding, which is
        normal for any social media platform. The most number of organic posts per month is around the start of the
        first circuit breaker in response to covid.
      </p>
      <ButtonGroup
        options={Object.entries(timedeltas).map(([id, name]) => ({ name: `Per ${name}`, value: id }))}
        onChange={(value: string) => setSelectedTimedelta(value)}
      />
      <TimelineChart
        data={xySeries}
        isXAxisDateType={isDateType}
        isCategorical={!isDateType}
        xAxisLabel={timedeltas[selectedTimedelta]}
        yAxisLabel="No. of posts"
      />
    </Section>
  )
}
