import { useEffect, useMemo, useState } from 'react'
import { PaginationDropdown } from '../components/Pagination'
import Section from '../components/Section'
import Wordcloud from '../components/Wordcloud'
import { Terms } from '../models'

function AllTimeTopics() {
  const [allTimeTermsWeights, setAllTimeTermsWeights] = useState<Terms>({})
  useEffect(() => {
    fetch('./data/top-terms/all.json')
      .then((res) => res.json())
      .then((data) => setAllTimeTermsWeights(data))
  }, [])

  return (
    <Section title="All Time Topics" level={3}>
      <p>These are the top 100 words that appear out of all NUSWhispers posts based on the TF-IDF result.</p>
      <div className="w-full">
        <Wordcloud wordWeights={Object.entries(allTimeTermsWeights)} />
      </div>
    </Section>
  )
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface DateRangeTerms {
  dateStart: Date
  dateEnd: Date
  terms: Terms
}

function WeeklyTopics() {
  const [weeklyTermsWeights, setWeeklyTermsWeights] = useState<Record<string, Terms>>({})
  const [currPage, setCurrPage] = useState<number>(0) // 0 indexed pagination
  const pageSize = 8
  const allDateRangeTerms = useMemo<DateRangeTerms[]>(() => {
    const dateRangeTerms: DateRangeTerms[] = []
    const weekTermsEntries = Object.entries(weeklyTermsWeights).reverse()
    for (const [dateStr, terms] of weekTermsEntries) {
      const date = new Date(dateStr)
      const sixDaysMs = 6 * 24 * 60 * 60 * 1000
      const endOfWeek = new Date(date.getTime() + sixDaysMs)
      dateRangeTerms.push({
        dateStart: date,
        dateEnd: endOfWeek,
        terms: terms,
      })
    }
    return dateRangeTerms
  }, [weeklyTermsWeights])

  const totalPageCount = Math.ceil(allDateRangeTerms.length / pageSize)
  const pageNames = Array.from(Array(totalPageCount).keys()).map((pageNo) => {
    const pageDateEnd = allDateRangeTerms[pageNo * pageSize].dateEnd
    const pageLastIndex = Math.min(pageNo * pageSize + pageSize - 1, allDateRangeTerms.length - 1)
    const pageDateStart = allDateRangeTerms[pageLastIndex].dateStart
    return `${formatDate(pageDateStart)} - ${formatDate(pageDateEnd)}`
  })

  const sliceStart = pageSize * currPage
  const sliceEnd = pageSize * (currPage + 1)
  const dateRangeTermsToShow: DateRangeTerms[] = allDateRangeTerms
    .slice(sliceStart, sliceEnd)
    .map((e) => Object.assign([], e))

  useEffect(() => {
    fetch('./data/top-terms/week.json')
      .then((res) => res.json())
      .then((data) => setWeeklyTermsWeights(data))
  }, [])

  return (
    <Section title="Weekly Topics" level={3}>
      <p>Here we break down the commonly used words by week to visualize the weekly trends.</p>
      <PaginationDropdown
        currentPage={currPage}
        onPageChange={(newPage) => {
          setCurrPage(newPage)
        }}
        pageNames={pageNames}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-8">
        {dateRangeTermsToShow.map(({ dateStart, dateEnd, terms }) => (
          <div key={formatDate(dateStart)}>
            <div className="border-2 border-emerald-400 dark:border-emerald-900 relative p-3">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-bright dark:bg-primary-dark px-4 whitespace-nowrap">
                {formatDate(dateStart)} - {formatDate(dateEnd)}
              </span>
              <Wordcloud wordWeights={Object.entries(terms)} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default function TopTerms() {
  return (
    <Section title="Topics" level={2}>
      <p>
        Posts on NUSWhispers are most often about relationships, school, jobs. These are some of the most commonly
        occuring words from posts to show the kind of topics a NUSWhispers post may be about.
      </p>
      <p>
        Data is generated using the{' '}
        <a href="https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html">
          TF-IDF
        </a>{' '}
        model. Basically TF-IDF scores the significance of each word over all the posts. I decided to use TF-IDF because
        I wanted an unsupervised model and the result to be easily interpretable. I think the results are not bad.
      </p>
      <AllTimeTopics />
      <WeeklyTopics />
    </Section>
  )
}
