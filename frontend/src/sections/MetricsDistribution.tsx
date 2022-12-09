import { ParseResult } from 'papaparse'
import { useState, useEffect } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'
import FetchCsv from '../CsvFetcher'
import { Distribution } from '../models'

const metrics = { likes: 'Likes', comments: 'Comments', shares: 'Shares' }

type MetricDistributionDataset = Record<string, Distribution[]>

export default function MetricsDistribution() {
  const [datasets, setDatasets] = useState<MetricDistributionDataset>({})
  const [selectedMetric, setSelectedMetric] = useState<string>('likes')
  useEffect(() => {
    const promises: Promise<ParseResult<Distribution>>[] = []
    for (const metric of Object.keys(metrics)) {
      const csvUrl = `./data/metrics-distribution/${metric}.csv`
      promises.push(FetchCsv<Distribution>(csvUrl))
    }

    Promise.all(promises).then((results) => {
      const queriedDatasets: MetricDistributionDataset = {}
      for (const [i, result] of results.entries()) {
        const metric = Object.keys(metrics)[i]
        queriedDatasets[metric] = result.data
      }
      setDatasets(queriedDatasets)
    })
  }, [])

  const distributions = datasets[selectedMetric] || []
  const xySeries: [string[], number[]] = [
    distributions.map((d) => d.range.toString()),
    distributions.map((d) => d.count),
  ]
  return (
    <Section title="Metrics Distribution" level={1}>
      <p>
        This graph shows how skewed each of the metrics are. Note the X axis is using logarithmic ranges. A linear axis
        scale would have shown extremely right skewed graphs due to the big outliers stretching all the way to the right
        edge.
      </p>
      <ButtonGroup
        options={Object.entries(metrics).map(([k, v]) => ({ name: v, value: k }))}
        onChange={(value: string) => setSelectedMetric(value)}
      />
      <TimelineChart
        data={xySeries}
        isXAxisDateType={false}
        isCategorical={true}
        xAxisLabel={`No. of ${selectedMetric}`}
        yAxisLabel="No. of posts"
      />
    </Section>
  )
}
