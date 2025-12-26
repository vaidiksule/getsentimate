
"use client";

import { create } from 'zustand';

interface AnalysisState {
    url: string;
    loading: boolean;
    result: any | null;
    error: string;
    setUrl: (url: string) => void;
    setLoading: (loading: boolean) => void;
    setResult: (result: any) => void;
    setError: (error: string) => void;
    clearResult: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
    url: '',
    loading: false,
    result: null,
    error: '',
    setUrl: (url) => set({ url }),
    setLoading: (loading) => set({ loading }),
    setResult: (result) => set({ result }),
    setError: (error) => set({ error }),
    clearResult: () => set({ result: null, url: '', error: '' }),
}));
