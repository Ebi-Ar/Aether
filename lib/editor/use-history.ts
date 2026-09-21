
import { useState, useCallback } from 'react';

interface UseHistoryResult<T> {
    state: T;
    setState: (newState: T | ((prev: T) => T)) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    history: T[];
    future: T[];
}

export function useHistory<T>(initialState: T): UseHistoryResult<T> {
    const [state, _setState] = useState<T>(initialState);
    const [history, setHistory] = useState<T[]>([]);
    const [future, setFuture] = useState<T[]>([]);

    const setState = useCallback((newState: T | ((prev: T) => T)) => {
        _setState((currentState) => {
            const resolvedState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(currentState)
                : newState;

            // Deep equality check could optimize, but for now just push to history
            if (resolvedState !== currentState) {
                setHistory((prev) => [...prev, currentState]);
                setFuture([]); // Clear future on new change
            }
            return resolvedState;
        });
    }, []);

    const undo = useCallback(() => {
        setHistory((prev) => {
            if (prev.length === 0) return prev;
            const newHistory = [...prev];
            const previousState = newHistory.pop();

            setFuture((f) => [state, ...f]);
            _setState(previousState as T);

            return newHistory;
        });
    }, [state]);

    const redo = useCallback(() => {
        setFuture((prev) => {
            if (prev.length === 0) return prev;
            const newFuture = [...prev];
            const nextState = newFuture.shift();

            setHistory((h) => [...h, state]);
            _setState(nextState as T);

            return newFuture;
        });
    }, [state]);

    return {
        state,
        setState,
        undo,
        redo,
        canUndo: history.length > 0,
        canRedo: future.length > 0,
        history,
        future
    };
}
