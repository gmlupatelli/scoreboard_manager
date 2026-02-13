import { ButtonHTMLAttributes, ReactNode, forwardRef, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import Icon from './AppIcon';

type BaseButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconClassName?: string;
  children?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
};

type ButtonAsButton = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
    href?: never;
  };

type ButtonAsLink = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconPosition = 'left',
      iconSize,
      iconClassName,
      children,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-smooth duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]';

    const variantClasses = {
      primary:
        'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary elevation-1 hover-lift',
      secondary:
        'bg-secondary text-secondary-foreground hover:opacity-90 focus:ring-secondary elevation-1 hover-lift',
      ghost: 'bg-transparent text-text-primary hover:bg-muted focus:ring-muted',
      danger:
        'bg-destructive text-destructive-foreground hover:opacity-90 focus:ring-destructive elevation-1 hover-lift',
      outline:
        'bg-surface border-2 border-border text-text-primary hover:bg-muted focus:ring-border',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const iconSizeMap = {
      sm: 16,
      md: 20,
      lg: 24,
    };

    const defaultIconSize = iconSize || iconSizeMap[size];

    const widthClass = fullWidth ? 'w-full' : '';

    const combinedClasses =
      `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`.trim();

    const renderIcon = (position: 'left' | 'right') => {
      if (!icon || iconPosition !== position) return null;

      const positionClass = position === 'left' ? 'mr-2' : 'ml-2';
      const combinedIconClass = iconClassName ? `${positionClass} ${iconClassName}` : positionClass;

      return <Icon name={icon} size={defaultIconSize} className={combinedIconClass} />;
    };

    const renderContent = () => {
      if (isLoading) {
        return (
          <>
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        );
      }

      return (
        <>
          {renderIcon('left')}
          {children && <span>{children}</span>}
          {renderIcon('right')}
        </>
      );
    };

    // Render as Link if href is provided
    if ('href' in props && props.href) {
      const { href, ...linkProps } = props as ButtonAsLink;
      return (
        <Link
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={combinedClasses}
          {...linkProps}
        >
          {renderContent()}
        </Link>
      );
    }

    // Render as button
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={combinedClasses}
        disabled={disabled || isLoading}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
