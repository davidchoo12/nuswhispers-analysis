import { useEffect, useState } from 'react'
import Pagination from '../components/Pagination'
import Section from '../components/Section'
import Wordcloud from '../components/Wordcloud'
import { Terms } from '../models'

export default function TopTerms() {
  const [wordcloudData, setWordcloudData] = useState<Terms>({})
  const [currPage, setCurrPage] = useState(1) // 1 indexed for pagination
  const pageSize = 20
  const entries = Object.entries(wordcloudData)
  const sliceStart = pageSize * (currPage - 1)
  const sliceEnd = pageSize * currPage
  const entriesToShow = entries.reverse().slice(sliceStart, sliceEnd)

  useEffect(() => {
    fetch('./data/top-terms/terms.json')
      .then((res) => res.json())
      .then((data) => setWordcloudData(data))
  }, [])

  return (
    <Section title="Most mentioned words per week" level={2}>
      <Pagination
        currentPage={currPage}
        onPageChange={(newPage) => {
          setCurrPage(newPage)
        }}
        pageSize={pageSize}
        totalCount={entries.length}
      />
      {entriesToShow.map(([date, wordWeights]) => (
        <div key={date} className="inline-block">
          <p>{date}</p>
          <Wordcloud wordWeights={Object.entries(wordWeights)} />
        </div>
      ))}
    </Section>
  )
}
