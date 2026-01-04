'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dialog, DialogType } from '@/components/ui/Dialog';

interface DialogOptions {
    title: string;
    description: ReactNode;
    type?: DialogType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface DialogContextType {
    showDialog: (options: DialogOptions) => void;
    showAlert: (title: string, description: ReactNode) => void;
    showConfirm: (title: string, description: ReactNode, onConfirm: () => void) => void;
    showDanger: (title: string, description: ReactNode, onConfirm: () => void) => void;
    closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<DialogOptions | null>(null);

    const closeDialog = useCallback(() => {
        setIsOpen(false);
        if (options?.onCancel) options.onCancel();
    }, [options]);

    const showDialog = useCallback((newOptions: DialogOptions) => {
        setOptions(newOptions);
        setIsOpen(true);
    }, []);

    const showAlert = useCallback((title: string, description: ReactNode) => {
        showDialog({
            title,
            description,
            type: 'alert'
        });
    }, [showDialog]);

    const showConfirm = useCallback((title: string, description: ReactNode, onConfirm: () => void) => {
        showDialog({
            title,
            description,
            type: 'confirm',
            onConfirm
        });
    }, [showDialog]);

    const showDanger = useCallback((title: string, description: ReactNode, onConfirm: () => void) => {
        showDialog({
            title,
            description,
            type: 'danger',
            confirmText: 'Sil',
            onConfirm
        });
    }, [showDialog]);

    return (
        <DialogContext.Provider value={{ showDialog, showAlert, showConfirm, showDanger, closeDialog }}>
            {children}
            {options && (
                <Dialog
                    isOpen={isOpen}
                    onClose={closeDialog}
                    onConfirm={options.onConfirm}
                    title={options.title}
                    description={options.description}
                    type={options.type}
                    confirmText={options.confirmText}
                    cancelText={options.cancelText}
                />
            )}
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (context === undefined) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}
