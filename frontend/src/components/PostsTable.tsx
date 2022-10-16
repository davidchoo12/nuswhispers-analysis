import { useEffect, useState } from 'react';
import { Post } from '../models';
import './PostsTable.css';

interface PostsTableProps {
  csvData: Post[]
}

export default function PostsTable({ csvData }: PostsTableProps) {
  const [fulltextRows, setFulltextRows] = useState<boolean[]>([])
  useEffect(() => setFulltextRows(csvData.map(() => false)), [csvData])
  return (
    <table className="border border-collapse">
      <thead>
        <tr>
          <th>No</th>
          <th>Post #</th>
          <th>Post</th>
          <th>Likes</th>
          <th>Comments</th>
          <th>Shares</th>
        </tr>
      </thead>
      <tbody>
        {csvData.map((d, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>
              <a
                href={'https://www.facebook.com/nuswhispers/posts/' + d.pid}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                #{d.cid}
              </a>
            </td>
            <td>
              <span className={`${fulltextRows[i] ? '' : 'line-clamp-2'} whitespace-pre-line`}>{d.text}</span>
              {fulltextRows[i] ? (<br />) : ''}
              <span className='text-blue-600 underline cursor-pointer' onClick={() => {
                const copy = Array.from(fulltextRows)
                copy[i] = !copy[i]
                console.log('fulltextRows', copy)
                setFulltextRows(copy)
              }}>
                {fulltextRows[i] ? 'less' : 'more'}
              </span>
            </td>
            <td className='text-right'>{d.likes}</td>
            <td className='text-right'>{d.comments}</td>
            <td className='text-right'>{d.shares}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
