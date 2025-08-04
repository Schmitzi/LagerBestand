export interface Event {
    id: string;
    name: string;
    description?: string; // Notiz
    event_id: string;
    location: string; // Einsatzort
    managed_by: string;
    begin_date: string;
    end_date: string;
    status: 'borrowed' | 'returned' | 'overdue';
    created_at: string;
    updated_at: string;
  }
  
  export interface CreateEvent {
    name: string;
    description?: string;
    location: string;
    managed_by: string;
    begin_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface UpdateEvent {
    name: string;
    description?: string;
    event_id: string;
    location: string;
    managed_by: string;
    begin_date: string;
    end_date: string;
    status: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface DeleteEvent {
    name: string
    event_id: string;
  }