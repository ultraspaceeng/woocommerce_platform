import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';
import styles from './input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    inputSize?: 'sm' | 'md' | 'lg';
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            inputSize = 'md',
            required,
            className = '',
            ...props
        },
        ref
    ) => {
        const containerClasses = [
            styles.inputContainer,
            leftIcon && styles.hasLeftIcon,
            rightIcon && styles.hasRightIcon,
        ]
            .filter(Boolean)
            .join(' ');

        const inputClasses = [
            styles.input,
            error && styles.error,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={`${styles.inputWrapper} ${styles[inputSize]}`}>
                {label && (
                    <label className={`${styles.label} ${required ? styles.required : ''}`}>
                        {label}
                    </label>
                )}
                <div className={containerClasses}>
                    {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                    <input
                        ref={ref}
                        className={inputClasses}
                        required={required}
                        {...props}
                    />
                    {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
                </div>
                {error && <span className={styles.errorMessage}>{error}</span>}
                {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, helperText, required, className = '', ...props }, ref) => {
        const textareaClasses = [
            styles.input,
            styles.textarea,
            error && styles.error,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={styles.inputWrapper}>
                {label && (
                    <label className={`${styles.label} ${required ? styles.required : ''}`}>
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={textareaClasses}
                    required={required}
                    {...props}
                />
                {error && <span className={styles.errorMessage}>{error}</span>}
                {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
