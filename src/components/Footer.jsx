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
      <p className="footer__text">
        © {year} {APP_META.name}. All rights reserved.
      </p>
      <p className="footer__powered">
        Powered by Google Cloud &amp; Gemini AI
      </p>
      <p className="footer__text">
        v{APP_META.version}
      </p>
    </footer>
  );
};

export default Footer;
