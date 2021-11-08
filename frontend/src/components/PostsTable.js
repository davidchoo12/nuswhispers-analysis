import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import './PostsTable.css';

export default function PostsTable({ csvUrl }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: result => {
        if (result.errors.length > 0) {
          console.error('parse data failed', result.errors);
          return;
        }
        setData(result.data);
      }
    });
  }, []);
  return (
    <table class="border border-collapse">
      <thead>
        <tr>
          <th>No</th>
          <th>ID</th>
          <th>Post</th>
          <th>Likes</th>
          <th>Comments</th>
          <th>Shares</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr>
            <td>{i}</td>
            <td>
              <a
                href={'https://www.facebook.com/nuswhispers/posts/' + d.pid}
                target="_blank"
                class="underline"
              >
                {d.pid}
              </a>
            </td>
            <td>
              <span class="line-clamp-2">{d.text}</span>
            </td>
            <td>{d.likes}</td>
            <td>{d.comments}</td>
            <td>{d.shares}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
