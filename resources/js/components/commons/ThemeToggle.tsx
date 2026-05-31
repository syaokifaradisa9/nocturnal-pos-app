import { useAppearance } from '../../hooks/use-appearance';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <button
            onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
            className="absolute right-4 top-4 rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
            type="button"
        >
            {appearance === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
}
