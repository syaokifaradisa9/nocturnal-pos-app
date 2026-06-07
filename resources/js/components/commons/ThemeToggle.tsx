import { useAppearance } from '../../hooks/use-appearance';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
    className?: string;
}

export default function ThemeToggle({
    className = 'absolute right-4 top-4',
}: ThemeToggleProps) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <button
            onClick={() =>
                updateAppearance(appearance === 'dark' ? 'light' : 'dark')
            }
            className={`${className} rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800`}
            aria-label="Toggle theme"
            type="button"
        >
            {appearance === 'dark' ? (
                <Sun className="h-4.5 w-4.5" />
            ) : (
                <Moon className="h-4.5 w-4.5" />
            )}
        </button>
    );
}
