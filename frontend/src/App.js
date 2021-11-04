import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  useEffect(() => {
    Papa.parse('/sample.csv', {
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
    <div className="App">
      {/*<header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>*/}
      <nav>sidebar here</nav>
      <h1 class="text-3xl text-center my-8">
        Top 10 most liked posts of all time
      </h1>
      <table class="border border-separate border-spacing-10">
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
                <a href={d.url}>{d.id}</a>
              </td>
              <td class="line-clamp-2">{d.text}</td>
              <td>{d.likes}</td>
              <td>{d.comments}</td>
              <td>{d.shares}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
