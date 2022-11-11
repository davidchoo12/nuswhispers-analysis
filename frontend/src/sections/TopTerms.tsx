import { useEffect, useState } from 'react'
import Pagination from '../components/Pagination'
import Section from '../components/Section'
import Wordcloud from '../components/Wordcloud'
import { Terms } from '../models'

export default function TopTerms() {
  const [wordcloudData, setWordcloudData] = useState<Terms>({})
  const [currPage, setCurrPage] = useState<number>(1) // 1 indexed for pagination
  const pageSize = 8
  const entries = Object.entries(wordcloudData)
  const sliceStart = pageSize * (currPage - 1)
  const sliceEnd = pageSize * currPage
  const entriesToShow = entries.slice(sliceStart, sliceEnd)
  for (const [i, [dateStr]] of entriesToShow.entries()) {
    const date = new Date(dateStr)
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000
    const startOfWeek = new Date(date.getTime() - sixDaysMs)
    entriesToShow[i][0] = `${startOfWeek.toLocaleDateString()} - ${date.toLocaleDateString()}`
  }

  useEffect(() => {
    fetch('./data/top-terms/terms.json')
      .then((res) => res.json())
      .then((data) => setWordcloudData(data))
  }, [])

  useEffect(() => {
    const entries = Object.entries(wordcloudData)
    const lastPage = Math.ceil(entries.length / pageSize)
    setCurrPage(lastPage) // default to last page
  }, [wordcloudData])

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-8">
        {entriesToShow.map(([dates, wordWeights]) => (
          <div key={dates}>
            <div className="border-2 border-emerald-400 dark:border-emerald-900 relative p-3">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-bright dark:bg-primary-dark px-4 whitespace-nowrap">
                {dates}
              </span>
              <Wordcloud wordWeights={Object.entries(wordWeights)} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
