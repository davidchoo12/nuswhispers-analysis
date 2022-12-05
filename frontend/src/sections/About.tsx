import Section from '../components/Section'

export default function About() {
  return (
    <Section title="About" level={2}>
      <p>
        <a href="https://www.nuswhispers.com/">NUSWhispers</a> is a website where anonymous users can submit posts that
        will appear on its <a href="https://www.facebook.com/nuswhispers/">facebook page</a> when approved by
        moderators. This website aims to analyze the facebook posts while keeping it up to date with the latest posts.
        Check out the source code <a href="https://github.com/davidchoo12/nuswhispers-analysis/">here</a>.
      </p>
      <p>
        Data is at least one month old so that there is enough time for the likes, comments, shares numbers stabilize.
        Every post is scraped from the facebook page once. Data is updated with new posts every month. Feel free to use
        the <a href="https://github.com/davidchoo12/nuswhispers-analysis/tree/master/scraper/data">scraped posts</a> for
        your own analysis.
      </p>
      <p>
        This project is inspired by this{' '}
        <a href="https://www.reddit.com/r/singapore/comments/e4u3l8/an_analysis_of_nuswhisper_confessions/">
          reddit post
        </a>{' '}
        and its <a href="https://github.com/quissuiven/nuswhispers-project">repo</a> from 2019. I created my first
        version of this website during a{' '}
        <a href="https://devpost.com/software/analysis-on-nuswhispers-confessions">hackathon</a> in 2020. Since then, I
        have wanted to see this side project to completion and worked on it on and off for almost 2 years. Much of the
        time was spent working on the UI since I'm not the best with React. The UI takes inspiration mostly from the{' '}
        <a href="https://survey.stackoverflow.co/2022/">StackOverflow survey</a>.
      </p>
      <p>Some possible improvements that I could have worked on:</p>
      <ul>
        <li>
          - Searched posts frequency graph, like the one from my first version. I would need to host an API for this.
        </li>
        <li>- Sentiment analysis, like the graph in the reddit post. Likely can just use VADER.</li>
        <li>
          - Comments analysis. It is much more difficult to mine for comments due to comments' tree like structure,
          pagination and facebook's strict rate limiting.
        </li>
      </ul>
    </Section>
  )
}
