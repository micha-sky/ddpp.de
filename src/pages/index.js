import * as React from "react"
import { Helmet } from "react-helmet"
import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "../components/index.module.css"

const IndexPage = () => (
  <Layout>
    <Helmet>
      <html lang="en" />
      <title>Die deutsche post punk</title>
      <meta name="keywords" content="Die Deutsche Post punk, DPP, music, band, post-punk" />
      <style>
        {`
          .video-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          video {
            object-fit: cover;
            width: 100%;
            height: 100%;
            position: absolute;
          }

          .header {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            background-color: #fc0;
            text-align: center;
          }

          .header-text {
            color: black;
            font-size: 24px;
            padding: 20px;
            font-family: "Delivery Regular", "Helvetica", sans-serif;
          }

          .icon-links {
            position: absolute;
            bottom: 20px;
            left: 20px;
          }

          .icon {
            margin-right: 10px;
          }
        `}
      </style>
    </Helmet>
    <div className="video-container">
      <video autoPlay muted loop>
        <source src="https://s3.amazonaws.com/diedeutschepostpunk.de/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
    <div className="header">
      <div className="header-text">Die Deutsche Post Punk</div>
    </div>
    <div className="icon-links">
      <a className="icon" href="mailto:contact@diedeutschepostpunk.de">
        <img src="email.png" alt="Email" />
      </a>
      <a className="icon" href="https://www.spotify.com">
        <img src="spotify.png" alt="Spotify" />
      </a>
      <a className="icon" href="https://soundcloud.com">
        <img src="soundcloud.png" alt="SoundCloud" />
      </a>
    </div>
  </Layout>
)

export const Head = () => <Seo title="Die deutsche post punk" />

export default IndexPage