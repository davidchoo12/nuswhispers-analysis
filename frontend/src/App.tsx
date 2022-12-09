import './App.css'
import ThemeProvider from './ThemeContext'
import Navbar from './components/Navbar'
import TableOfContent from './components/TableOfContent'
import Overview from './sections/Overview'
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
        <div className="xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto px-4 flex gap-4">
          <main className="inline-block w-full overflow-hidden lg:flex-auto">
            <Overview />
            <TopPosts />
            <MetricsDistribution />
            <MetricsMedians />
            <PostsFrequency />
            <TopTerms />
            <TopNetworks />
            <About />
            <div className="my-16 text-center font-bold">
              Made with ❤️ by <a href="https://github.com/davidchoo12">David Choo</a> • © 2022
            </div>
          </main>
          <TableOfContent />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
