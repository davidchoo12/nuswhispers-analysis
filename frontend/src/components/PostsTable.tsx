import { useState } from 'react'
import { Post } from '../models'
import './PostsTable.css'

interface PostsTableProps {
  csvData: Post[]
  hideNumberCol?: boolean
  highlightCid?: number
}

export default function PostsTable({ csvData = [], hideNumberCol = false, highlightCid }: PostsTableProps) {
  const [fulltextRows, setFulltextRows] = useState<boolean[]>(csvData.map(() => false))

  return (
    <div className="overflow-x-auto">
      <table className="border-solid border-secondary-dark border-collapse">
        <thead className="bg-primary-bright dark:bg-primary-dark">
          <tr>
            {hideNumberCol ? '' : <th className="w-[2em]">No</th>}
            <th className="w-[5em]">Post #</th>
            <th>Post</th>
            <th className="w-[4em]">Likes</th>
            <th className="w-[4em]">Comments</th>
            <th className="w-[4em]">Shares</th>
          </tr>
        </thead>
        <tbody>
          {csvData.map((d, i) => (
            <tr
              key={i}
              // bg-yellow-300 dark:bg-yellow-600
              className={d.cid === highlightCid ? `bg-[rgba(253,224,71,0.6)] dark:bg-[rgba(202,138,4,0.6)]` : ''}
            >
              {hideNumberCol ? '' : <td>{i + 1}</td>}
              <td>
                <a href={'https://www.facebook.com/nuswhispers/posts/' + d.pid} className="text-center">
                  #{d.cid}
                </a>
              </td>
              <td>
                <span className={`${fulltextRows[i] ? '' : 'line-clamp-2'} whitespace-pre-line`}>{d.text}</span>
                {fulltextRows[i] ? <br /> : ''}
                <span
                  className="text-emerald-600 dark:text-emerald-300 opacity-90 transition hover:opacity-100 underline cursor-pointer"
                  onClick={() => {
                    const copy = Array.from(fulltextRows)
                    copy[i] = !copy[i]
                    setFulltextRows(copy)
                  }}
                >
                  {fulltextRows[i] ? 'less' : 'more'}
                </span>
                {fulltextRows[i] ? (
                  <span>
                    &nbsp;|&nbsp;
                    <a href={'https://www.facebook.com/nuswhispers/posts/' + d.pid} target="_blank" rel="noreferrer">
                      fb post
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="inline w-3 h-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                  </span>
                ) : (
                  ''
                )}
              </td>
              <td className="text-center whitespace-nowrap">{d.likes.toLocaleString()} 👍</td>
              <td className="text-center whitespace-nowrap">{d.comments.toLocaleString()} 💬</td>
              <td className="text-center whitespace-nowrap">
                {d.shares.toLocaleString()}{' '}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="inline w-4 h-4"
                >
                  <title>Shares</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                  />
                </svg>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
