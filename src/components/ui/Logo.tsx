interface LogoProps {
  size?: number;
  className?: string;
}

const Logo = ({ size = 40, className = '' }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="var(--color-primary)" opacity="0.1" />

      {/* Main geometric angular design - left triangle */}
      <path d="M25 35 L40 50 L25 65 Z" fill="var(--color-primary)" opacity="0.9" />

      {/* Center angular shape */}
      <path d="M40 30 L60 30 L70 50 L60 70 L40 70 L30 50 Z" fill="var(--color-secondary)" />

      {/* Right triangle */}
      <path d="M75 35 L75 65 L60 50 Z" fill="var(--color-accent)" opacity="0.9" />

      {/* Inner accent - small diamond */}
      <path d="M50 40 L55 50 L50 60 L45 50 Z" fill="white" />

      {/* Top accent line */}
      <path d="M45 25 L55 25 L50 35 Z" fill="var(--color-primary)" />

      {/* Bottom accent line */}
      <path d="M45 75 L55 75 L50 65 Z" fill="var(--color-primary)" />
    </svg>
  );
};

export default Logo;
