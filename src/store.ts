import { create } from 'zustand';
import { io } from 'socket.io-client';

interface Activity {
  id: number;
  agent_name: string;
  action: string;
  timestamp: string;
  details: string;
}

interface FPAStore {
  activities: Activity[];
  portfolioData: any[];
  currentCompany: any | null;
  addActivity: (activity: Activity) => void;
  setPortfolioData: (data: any[]) => void;
  setCurrentCompany: (company: any) => void;
  fetchPortfolio: () => Promise<void>;
  fetchCompany: (id: string) => Promise<void>;
  fetchActivities: () => Promise<void>;
}

export const useFPAStore = create<FPAStore>((set, get) => ({
  activities: [],
  portfolioData: [],
  currentCompany: null,
  addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities].slice(0, 50) })),
  setPortfolioData: (data) => set({ portfolioData: data }),
  setCurrentCompany: (company) => set({ currentCompany: company }),
  fetchPortfolio: async () => {
    const res = await fetch('/api/portfolio');
    const data = await res.json();
    set({ portfolioData: data });
  },
  fetchCompany: async (id) => {
    const res = await fetch(`/api/company/${id}`);
    const data = await res.json();
    set({ currentCompany: data });
  },
  fetchActivities: async () => {
    const res = await fetch('/api/activity');
    const data = await res.json();
    set({ activities: data });
  },
}));

// Initialize Socket.io
const socket = io();
socket.on('agent_activity', (activity) => {
  useFPAStore.getState().addActivity(activity);
});
