const fs = require('fs')

const overviewRaw = fs.readFileSync('public/data/overview.json')
const overview = JSON.parse(overviewRaw)
const date = new Date(overview.last_scraped_at).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dotEnv = `PUBLIC_URL=.
REACT_APP_DATE=${date}
REACT_APP_POSTS_COUNT=${overview.posts_count.toLocaleString()}
REACT_APP_LATEST_CONFESSION=${overview.latest_confession}
REACT_APP_TOTAL_LIKES=${overview.total_likes.toLocaleString()}
REACT_APP_TOTAL_COMMENTS=${overview.total_comments.toLocaleString()}
REACT_APP_TOTAL_SHARES=${overview.total_shares.toLocaleString()}
`
fs.writeFileSync('.env', dotEnv)
