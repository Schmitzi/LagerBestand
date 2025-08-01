import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = process.env.DB_PATH || './data/inventory.db';
    
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
    
    await run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        location TEXT NOT NULL,
        category TEXT NOT NULL,
        sku TEXT UNIQUE,
        price REAL,
        supplier TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
      CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location);
      CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
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