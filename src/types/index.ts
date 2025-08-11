export interface Department {
  name: string;
  url: string;
}

export interface Professor {
  name: string;
  email: string;
}

export interface HistoryEntry extends Professor {
  departmentName: string;
  fetchedAt: string;
}
