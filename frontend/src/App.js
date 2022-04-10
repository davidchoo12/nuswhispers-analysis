import React from 'react';
import './App.css';
import PostsTable from './components/PostsTable';
import TimelineChart from './components/TimelineChart';

function App() {
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
      <PostsTable csvUrl="/sample.csv" />
      <TimelineChart dateStart="2020-01-01" dateEnd="2020-12-31" />
    </div>
  );
}

export default App;
