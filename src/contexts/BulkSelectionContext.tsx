'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface BulkSelectionContextType {
    hasActiveSelection: boolean;
    setHasActiveSelection: (active: boolean) => void;
    registerCancelHandler: (handler: () => void) => void;
    triggerCancel: () => void;
}

const BulkSelectionContext = createContext<BulkSelectionContextType | undefined>(undefined);

export function BulkSelectionProvider({ children }: { children: ReactNode }) {
    const [hasActiveSelection, setHasActiveSelection] = useState(false);
    const cancelHandlerRef = useRef<(() => void) | null>(null);

    const registerCancelHandler = (handler: () => void) => {
        cancelHandlerRef.current = handler;
    };

    const triggerCancel = () => {
        if (cancelHandlerRef.current) {
            console.log('BulkSelectionContext: Triggering cancel handler');
            cancelHandlerRef.current();
        } else {
            console.warn('BulkSelectionContext: No cancel handler registered');
            // Fallback: just reset state if no handler
            setHasActiveSelection(false);
        }
    };

    return (
        <BulkSelectionContext.Provider value={{
            hasActiveSelection,
            setHasActiveSelection,
            registerCancelHandler,
            triggerCancel
        }}>
            {children}
        </BulkSelectionContext.Provider>
    );
}

export function useBulkSelection() {
    const context = useContext(BulkSelectionContext);
    if (!context) {
        throw new Error('useBulkSelection must be used within a BulkSelectionProvider');
    }
    return context;
}
