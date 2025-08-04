// export interface Event {
//   id: string;
//   name: string;
//   description?: string;
//   event_id: string;
//   location: string;
//   managed_by: string;
//   begin_date: string;
//   end_date: string;
//   status: 'upcoming' | 'in progress' | 'ended';
//   created_at: string;
//   updated_at: string;
// }

// export interface CreateEvent {
//   name: string;
//   description?: string;
//   event_id: string;
//   location: string;
//   managed_by?: string; // Optional, will default to 'System'
//   begin_date?: string; // Optional, will default to today
//   end_date?: string;   // Optional, will default to begin_date
// }

// export interface UpdateEvent {
//   name?: string;
//   description?: string;
//   event_id?: string;
//   location?: string;
//   managed_by?: string;
//   begin_date?: string;
//   end_date?: string;
//   status?: 'upcoming' | 'in progress' | 'ended';
// }

export interface Event {
  id: string;
  name: string;
  description?: string;
  event_id: string;
  location: string;
  managed_by?: string;
  begin_date: string;
  end_date: string;
  status: 'upcoming' | 'in progress' | 'ended';
  created_at: string;
  updated_at: string;
}

export interface CreateEvent {
  name: string;
  description?: string;
  event_id: string;
  location: string;
  managed_by?: string;
  begin_date: string;
  end_date: string;
}

export interface UpdateEvent {
  name?: string;
  description?: string;
  event_id?: string;
  location?: string;
  managed_by?: string;
  begin_date?: string;
  end_date?: string;
  status?: 'upcoming' | 'in progress' | 'ended';
}

export interface DeleteEvent {
  name?: string;
  event_id?: string;
}