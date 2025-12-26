
import { create } from 'zustand';
import { User } from '@/lib/auth';

interface UserState {
    user: User | null;
    setUser: (user: User | null) => void;
    updateCredits: (credits: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    updateCredits: (credits) => set((state) => ({
        user: state.user ? { ...state.user, credits } : null
    }))
}));
