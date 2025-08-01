export interface Equipment {
  id: string;
  name: string;
  description?: string;
  total_count: number;
  available_count: number;
  storage_area: string;
  rubric: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipment {
  name: string;
  description?: string;
  total_count: number;
  storage_area: string;
  rubric: string;
}

export interface UpdateEquipment {
  name?: string;
  description?: string;
  total_count?: number;
  storage_area?: string;
  rubric?: string;
}

export interface Borrowing {
  id: string;
  equipment_id: string;
  borrowing_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  borrower_name: string;
  returner_name?: string;
  event_name: string;
  event_location: string;
  status: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBorrowing {
  equipment_id: string;
  borrowing_date: string;
  expected_return_date: string;
  borrower_name: string;
  event_name: string;
  event_location: string;
  notes?: string;
}

export interface ReturnEquipment {
  borrowing_id: string;
  returner_name: string;
  actual_return_date: string;
  notes?: string;
}

export interface EquipmentWithBorrowings extends Equipment {
  current_borrowings?: Borrowing[];
  borrowing_history?: Borrowing[];
}