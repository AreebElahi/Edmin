import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                surface: 'var(--color-surface)',
                'surface-hover': 'var(--color-surface-hover)',
                border: 'var(--color-border)',
                'border-hover': 'var(--color-border-hover)',
                'text-primary': 'var(--color-text-primary)',
                'text-secondary': 'var(--color-text-secondary)',
                'text-muted': 'var(--color-text-muted)',
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                    light: 'var(--color-primary-light)'
                },
                success: {
                    text: 'var(--color-success-text)',
                    bg: 'var(--color-success-bg)'
                },
                error: {
                    text: 'var(--color-error-text)',
                    bg: 'var(--color-error-bg)',
                    hover: 'var(--color-error-hover)'
                },
                warning: {
                    text: 'var(--color-warning-text)',
                    bg: 'var(--color-warning-bg)'
                },
            },
        },
    },
    plugins: [],
};

export default config;

