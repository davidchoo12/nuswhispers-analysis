import Section from '../components/Section'

export default function About() {
  return (
    <Section title="About" level={1}>
      <p>
        <a href="https://www.nuswhispers.com/">NUSWhispers</a> is a website where anonymous users can submit confessions
        that will appear on its <a href="https://www.facebook.com/nuswhispers/">facebook page</a> when approved by
        moderators. This website visualizes the analysis on all the posts on that page while staying up to date with the
        latest posts. Here is the <a href="https://github.com/davidchoo12/nuswhispers-analysis/">source code</a>.
      </p>
      <p>
        Each post will be scraped several times until the likes/comments/shares are stabilized in order to maintain the
        accuracy of the data. Feel free to use the{' '}
        <a href="https://github.com/davidchoo12/nuswhispers-analysis/tree/master/scraper/data">scraped posts</a> for
        your own analysis. I could also scrape directly from NUSWhispers API but I think scraping from the actual posts
        is more reliable and I would not want to add cost on their server.
      </p>
      <p>
        This project is inspired by this{' '}
        <a href="https://www.reddit.com/r/singapore/comments/e4u3l8/an_analysis_of_nuswhisper_confessions/">
          reddit post
        </a>{' '}
        and its <a href="https://github.com/quissuiven/nuswhispers-project">repo</a> from 2019. I started this project
        because I wanted to see the analysis for the latest posts. I created my first version of this website during a{' '}
        <a href="https://devpost.com/software/analysis-on-nuswhispers-confessions">hackathon</a> in 2021. Since then, I
        have wanted to see this side project to completion and worked on it on and off for almost 2 years. Much of the
        time was spent working on the UI since I am learning it as I worked on this. The UI takes inspiration mostly
        from the <a href="https://survey.stackoverflow.co/2022/">StackOverflow survey</a>.
      </p>
      <p>Some possible improvements that I could have worked on:</p>
      <ul>
        <li>
          - Filtered posts frequency graph, like the one from my first version, but I would need to host an API for this
          which I think is not worth the effort just for 1 section.
        </li>
        <li>
          - Sentiment analysis, like the graph in the reddit post. They used VADER for the analysis which I tried but
          the results look inaccurate.
        </li>
        <li>
          - Comments analysis. It is much more difficult to mine for comments due to comments' tree like structure,
          pagination and facebook's strict rate limiting. I also don't feel right analyzing user data that is not
          anonymized without permission.
        </li>
      </ul>
      <p>Thank you for checking out my little project.</p>
    </Section>
  )
}
