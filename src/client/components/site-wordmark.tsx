import { Link } from "react-router-dom";

export function SiteWordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="87K Windows home, Singapore">
      87K WINDOWS
      <span className="wordmark-flag" aria-hidden="true">
        🇸🇬
      </span>
    </Link>
  );
}
