
export interface Project {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
  sheet_count: number;
}

export interface UseProjectsDataReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  retryCount: number;
  retry: () => void;
  refetch: () => void;
  deleteProject: (projectId: string) => Promise<void>;
  deletingProjects: Set<string>;
}
