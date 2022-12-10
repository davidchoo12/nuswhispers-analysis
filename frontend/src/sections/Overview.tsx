import { useEffect, useState } from 'react'
import Section from '../components/Section'

interface OverviewData {
  lastScrapedAt: string
  latestConfession: number
  postsCount: number
  totalLikes: number
  totalComments: number
  totalShares: number
}

interface BoxProps {
  content: string | number
  caption: string
}

function Box({ content, caption }: BoxProps) {
  return (
    <div className="border-2 border-emerald-400 dark:border-emerald-900 relative p-5 flex justify-center">
      <span className="text-2xl">{content}</span>
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-bright dark:bg-primary-dark px-4 whitespace-nowrap">
        {caption}
      </span>
    </div>
  )
}

export default function Overview() {
  const [overviewData, setOverviewData] = useState<OverviewData>()
  useEffect(() => {
    fetch('./data/overview.json')
      .then((res) => res.json())
      .then((data) => {
        setOverviewData({
          lastScrapedAt: data['last_scraped_at'],
          latestConfession: data['latest_confession'],
          postsCount: data['posts_count'],
          totalLikes: data['total_likes'],
          totalComments: data['total_comments'],
          totalShares: data['total_shares'],
        })
      })
  }, [])
  return (
    <Section title="Overview" level={1}>
      <div className="mt-8 text-xl">
        {`As of ${
          overviewData
            ? new Date(overviewData.lastScrapedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '...'
        }, NUSWhispers has accumulated:`}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-x-4 gap-y-8 mt-6">
        <Box caption="Total Posts Count" content={overviewData?.postsCount?.toLocaleString() || '...'} />
        <Box caption="Latest Confession" content={`#${overviewData?.latestConfession || '...'}`} />
        <Box caption="Total Likes" content={overviewData?.totalLikes?.toLocaleString() || '...'} />
        <Box caption="Total Comments" content={overviewData?.totalComments.toLocaleString() || '...'} />
        <Box caption="Total Shares" content={overviewData?.totalShares.toLocaleString() || '...'} />
      </div>
      <p>Data updates daily!</p>
    </Section>
  )
}
