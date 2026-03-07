const AMBER = '#c38839';
const OFF_WHITE = '#e8e6e1';

export const Footer = () => (
  <footer
    className="px-6 py-12 text-center"
    style={{ borderTop: `1px solid ${AMBER}33` }}
  >
    <div
      className="font-mono text-sm tracking-[0.1em] mb-3"
      style={{ color: AMBER }}
    >
      speech.fm
    </div>
    <p
      className="font-sans text-xs max-w-md mx-auto"
      style={{ color: `${OFF_WHITE}50` }}
    >
      Built by humans who got tired of AI that pretends to be smart.
    </p>
  </footer>
);
