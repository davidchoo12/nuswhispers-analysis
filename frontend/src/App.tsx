import './App.css'
import ThemeProvider from './ThemeContext'
import Navbar from './components/Navbar'
import TableOfContent from './components/TableOfContent'
import TopPosts from './sections/TopPosts'
import MetricsDistribution from './sections/MetricsDistribution'
import MetricsMedians from './sections/MetricsMedians'
import PostsFrequency from './sections/PostsFrequency'
import TopTerms from './sections/TopTerms'
import TopNetworks from './sections/TopNetworks'
import About from './sections/About'

function App() {
  return (
    <ThemeProvider>
      <div className="bg-primary-bright dark:bg-primary-dark text-primary-dark dark:text-primary-bright">
        <Navbar />
        <TableOfContent />
        <main className="px-16 w-full lg:w-[calc(100vw-400px)]">
          <TopPosts />
          <MetricsDistribution />
          <MetricsMedians />
          <PostsFrequency />
          <TopTerms />
          <TopNetworks />
          <About />
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
