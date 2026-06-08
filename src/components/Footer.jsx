/**
 * @fileoverview Footer component for CarbonWise.
 * Displays copyright, attribution, and version information.
 * @module components/Footer
 */

import { APP_META } from '../constants.js';

/**
 * Application footer with copyright and attribution.
 *
 * @returns {JSX.Element}
 */
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__badges">
        <span className="footer__tech-badge">⚛️ React</span>
        <span className="footer__tech-badge">✨ Gemini AI</span>
        <span className="footer__tech-badge">🔥 Firebase</span>
        <span className="footer__tech-badge">☁️ Cloud Run</span>
      </div>

      <p className="footer__text">
        © {year} {APP_META.name}. All rights reserved.
      </p>
      <p className="footer__powered">
        Powered by Google Cloud &amp; Gemini AI
      </p>

      <div className="footer__links">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="footer__link"
        >
          GitHub
        </a>
        <span className="footer__link-divider" aria-hidden="true">•</span>
        <a
          href="https://cloud.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="footer__link"
        >
          Google Cloud
        </a>
      </div>

      <div className="footer__promptwars-badge">
        🏆 Made for Google PromptWars
      </div>

      <p className="footer__text">
        v{APP_META.version}
      </p>
    </footer>
  );
};

export default Footer;
