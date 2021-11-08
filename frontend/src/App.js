import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import './App.css';
import PostsTable from './components/PostsTable';

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
    </div>
  );
}

export default App;
