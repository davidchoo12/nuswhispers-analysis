import logo from './logo.svg';
import './App.css';

function App() {
  const data = [];
  for (let i = 0; i < 10; i++) {
    data[i] = {
      id: i,
      text: 'aaa',
      url: 'https://www.facebook.com/posts/' + i,
      likes: i,
      comments: i,
      shares: i
    };
  }
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
      <h1>Top 10 most liked posts of all time</h1>
      <table>
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
              <td>{d.text}</td>
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
