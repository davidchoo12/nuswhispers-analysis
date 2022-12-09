import { Metric, ReportHandler, getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

const reportWebVitals = () => {
  const sendToAnalytics: ReportHandler = ({ id, name, value }: Metric) => {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_value: Math.round(name === 'CLS' ? value * 1000 : value), // values must be integers
      event_label: id, // id unique to current page load
      non_interaction: true, // avoids affecting bounce rate
    })
  }
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}

export default reportWebVitals
