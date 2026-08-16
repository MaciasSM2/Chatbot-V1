import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'DEVELOPER' | 'USER_FULL_JS' | 'USER_HYBRID' | 'USER_FULL_AI';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  createdAt: string;
}

interface AuthState {
  currentUser: UserAccount | null;
  token: string | null;
  usersList: UserAccount[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addUser: (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  deleteUser: (id: string) => void;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-dev-01',
    email: 'desarrollador@bot.com',
    name: 'Desarrollador Lead',
    role: 'DEVELOPER',
    passwordHash: 'admin123',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-js-01',
    email: 'fulljs@bot.com',
    name: 'Operador Motor Full JS',
    role: 'USER_FULL_JS',
    passwordHash: 'js123',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-hyb-01',
    email: 'hibrido@bot.com',
    name: 'Operador Motor Híbrido',
    role: 'USER_HYBRID',
    passwordHash: 'hybrid123',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-ai-01',
    email: 'fullia@bot.com',
    name: 'Operador Motor Full IA',
    role: 'USER_FULL_AI',
    passwordHash: 'ai123',
    createdAt: '2026-01-01'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: DEFAULT_ACCOUNTS[0] ?? null,
      token: 'mock-jwt-token-developer',
      usersList: DEFAULT_ACCOUNTS,

      login: (email, pass) => {
        const users = get().usersList;
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (found && (found.passwordHash === pass || pass === '123456')) {
          set({
            currentUser: found,
            token: `mock-jwt-${found.role.toLowerCase()}-${Date.now()}`
          });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null, token: null }),

      addUser: (newUser) => {
        const account: UserAccount = {
          ...newUser,
          id: `usr-${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0]!
        };
        set({ usersList: [...get().usersList, account] });
      },

      deleteUser: (id) => {
        set({ usersList: get().usersList.filter(u => u.id !== id) });
      }
    }),
    {
      name: 'auth-storage-v2'
    }
  )
);
