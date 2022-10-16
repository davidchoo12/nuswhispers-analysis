import React from 'react'
import './App.css'
import TableOfContent from './components/TableOfContent'
import MetricsDistribution from './sections/MetricsDistribution'
import MetricsMedians from './sections/MetricsMedians'
import TopPosts from './sections/TopPosts'
import TopTerms from './sections/TopTerms'
import TopNetworks from './sections/TopNetworks'
import PostsFrequency from './sections/PostsFrequency'

function App() {
  return (
    <>
      <TableOfContent />
      <main>
        <TopPosts />
        <MetricsDistribution />
        <MetricsMedians />
        <PostsFrequency />
        <TopTerms />
        <TopNetworks />
      </main>
    </>
  )
}

export default App
