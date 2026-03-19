import { useEffect, useState } from 'react';

/**
 * Hook para debouncing de valores - útil para evitar renders excesivos
 * en sliders y otros controles que cambian rápidamente
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
