function CinepolisMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id="cinepolis-mark-cutout">
          <rect width="120" height="120" fill="black" />
          <circle cx="60" cy="60" r="48" fill="white" />
          <circle cx="60" cy="60" r="25" fill="black" />
          <path d="M64 48L111 18V102L64 72Z" fill="black" />
          <rect x="0" y="54" width="55" height="12" fill="black" />
        </mask>
      </defs>

      <rect width="120" height="120" fill="currentColor" mask="url(#cinepolis-mark-cutout)" />
    </svg>
  );
}

export default CinepolisMark;
