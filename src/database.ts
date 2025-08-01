import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = process.env.DB_PATH || './data/equipment.db';
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private async init() {
    const run = promisify(this.db.run.bind(this.db));
    
    // Equipment master table
    await run(`
      CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        total_count INTEGER NOT NULL DEFAULT 1,
        available_count INTEGER NOT NULL DEFAULT 1,
        storage_area TEXT NOT NULL,
        rubric TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Borrowings table
    await run(`
      CREATE TABLE IF NOT EXISTS borrowings (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        borrowing_date DATE NOT NULL,
        expected_return_date DATE NOT NULL,
        actual_return_date DATE,
        borrower_name TEXT NOT NULL,
        returner_name TEXT,
        event_name TEXT NOT NULL,
        event_location TEXT NOT NULL,
        status TEXT DEFAULT 'borrowed' CHECK(status IN ('borrowed', 'returned', 'overdue')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment (id)
      )
    `);

    // Create indexes
    await run(`
      CREATE INDEX IF NOT EXISTS idx_equipment_rubric ON equipment(rubric);
      CREATE INDEX IF NOT EXISTS idx_equipment_storage ON equipment(storage_area);
      CREATE INDEX IF NOT EXISTS idx_borrowings_equipment ON borrowings(equipment_id);
      CREATE INDEX IF NOT EXISTS idx_borrowings_status ON borrowings(status);
      CREATE INDEX IF NOT EXISTS idx_borrowings_dates ON borrowings(borrowing_date, expected_return_date);
    `);

    // Create a trigger to update available_count when borrowings change
    await run(`
      CREATE TRIGGER IF NOT EXISTS update_available_count_on_borrow
      AFTER INSERT ON borrowings
      WHEN NEW.status = 'borrowed'
      BEGIN
        UPDATE equipment 
        SET available_count = available_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.equipment_id AND available_count > 0;
      END;
    `);

    await run(`
      CREATE TRIGGER IF NOT EXISTS update_available_count_on_return
      AFTER UPDATE ON borrowings
      WHEN OLD.status = 'borrowed' AND NEW.status = 'returned'
      BEGIN
        UPDATE equipment 
        SET available_count = available_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.equipment_id;
      END;
    `);
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export const database = new Database();