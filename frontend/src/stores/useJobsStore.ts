import { create } from 'zustand';
import type { Job } from '../types';

interface JobsStore {
  jobs: Job[];
  selectedJob: Job | null;
  loading: boolean;
  error: string | null;

  // Actions
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  selectJob: (job: Job | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useJobsStore = create<JobsStore>((set) => ({
  // Initial state
  jobs: [],
  selectedJob: null,
  loading: false,
  error: null,

  // Actions
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...updates } : job)),
      selectedJob:
        state.selectedJob?.id === id
          ? { ...state.selectedJob, ...updates }
          : state.selectedJob,
    })),
  deleteJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
      selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
    })),
  selectJob: (job) => set({ selectedJob: job }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
