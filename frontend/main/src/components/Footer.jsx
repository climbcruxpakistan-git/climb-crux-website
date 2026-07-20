import { NavLink } from 'react-router-dom'
import CliffEdge from './CliffEdge.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <CliffEdge fill="var(--charcoal)" height={40} />
      <div className="wrap footer-inner">
        <div className="footer-col footer-brand">
          <img src="/logo.png" alt="Climb Crux" className="footer-logo" />
          <p>
            Guided rock climbing and adventure sessions. For first-timers
            finding their first foothold and climbers chasing the next grade.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><NavLink to="/sessions">Public Sessions</NavLink></li>
            <li><NavLink to="/private-premium">Private &amp; Premium</NavLink></li>
            <li><NavLink to="/our-team">Our Team</NavLink></li>
            <li><NavLink to="/gallery">Gallery</NavLink></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Get in touch</h4>
          <ul>
            <li><a href="tel:+923132690377">+92 313 2690377</a></li>
            <li><a href="mailto:climbcruxpakistan@gmail.com">climbcruxpakistan@gmail.com</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Follow</h4>
          <ul className="footer-social">
            <li><a href="https://instagram.com/climbcruxpakistan" target="_blank" rel="noreferrer">Instagram</a></li>
            <li><a href="https://wa.me/923132690377" target="_blank" rel="noreferrer">WhatsApp</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-inner">
          <span>© {new Date().getFullYear()} Climb Crux. All rights reserved.</span>
          <span>Islamabad, Pakistan</span>
        </div>
      </div>
    </footer>
  )
}
