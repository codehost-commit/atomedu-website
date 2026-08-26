/* eslint-disable @next/next/no-img-element */
type LogoProps = {
  dark?: boolean;
  compact?: boolean;
};

export function Logo({ dark = false, compact = false }: LogoProps) {
  return (
    <span className={`atom-logo ${dark ? "atom-logo-dark" : ""} ${compact ? "atom-logo-compact" : ""}`}>
      <span className="atom-logo-crop" aria-hidden="true">
        <img
          src={dark ? "/atom-logo-black-bg.png" : "/atom-logo-white-bg.png"}
          alt=""
        />
      </span>
      {!compact && <span className="atom-logo-name">Atom Edu</span>}
    </span>
  );
}
