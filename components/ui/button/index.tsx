import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import styles from './button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    iconOnly?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            iconOnly = false,
            leftIcon,
            rightIcon,
            children,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const classNames = [
            styles.button,
            styles[variant],
            styles[size],
            fullWidth && styles.fullWidth,
            loading && styles.loading,
            iconOnly && styles.iconOnly,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <button
                ref={ref}
                className={classNames}
                disabled={disabled || loading}
                {...props}
            >
                {leftIcon && !loading && <span className={styles.icon}>{leftIcon}</span>}
                {children}
                {rightIcon && !loading && <span className={styles.icon}>{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
