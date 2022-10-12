import Papa from 'papaparse'
import { useEffect, useState, useRef } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Section from '../components/Section'
import TimelineChart from '../components/TimelineChart'

export default function PostsFrequency() {
  const [datasets, setDatasets] = useState({})
  const [selectedTimedelta, setSelectedTimedelta] = useState('year')
  const datasetConfigs = [
    {
      id: 'year',
      name: 'Per Year',
      url: '/data/posts-freq/year.csv',
    },
    {
      id: 'month',
      name: 'Per Month',
      url: '/data/posts-freq/month.csv',
    },
    {
      id: 'week',
      name: 'Per Week',
      url: '/data/posts-freq/week.csv',
    },
    {
      id: 'day',
      name: 'Per Day',
      url: '/data/posts-freq/day.csv',
    },
    {
      id: 'hourofday',
      name: 'Per Hour of Day',
      url: '/data/posts-freq/hourofday.csv',
    },
  ]
  useEffect(() => {
    for (const datasetConfig of datasetConfigs) {
      Papa.parse(datasetConfig.url, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: result => {
          if (result.errors.length > 0) {
            console.error('parse data failed', result.errors)
            return
          }
          let transposed = result.meta.fields.map(field => result.data.map(row => row[field]))
          transposed[0] = transposed[0].map(timestamp => Date.parse(timestamp)/1000 || parseInt(timestamp))
          datasets[datasetConfig.id] = transposed
          setDatasets({...datasets})
        }
      })
    }
  }, [])
  return (
    <Section title="Posts Frequency" level={2}>
      <ButtonGroup options={datasetConfigs.map(config => ({name: config.name, value: config.id}))} onChange={(value) => setSelectedTimedelta(value)}/>
      <TimelineChart data={datasets[selectedTimedelta]} isXAxisDateType={!['hourofday', 'minuteofday'].includes(selectedTimedelta)} />
    </Section>
  )
}