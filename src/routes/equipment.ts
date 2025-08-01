import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Equipment, CreateEquipment, UpdateEquipment, Borrowing, CreateBorrowing, ReturnEquipment } from '../types/equipment';

export async function equipmentRoutes(fastify: FastifyInstance) {
  
  // EQUIPMENT CRUD OPERATIONS
  
  // Get all equipment
  fastify.get('/equipment', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const equipment = await database.all(`
        SELECT * FROM equipment 
        ORDER BY rubric, name
      `);
      return reply.send({ success: true, data: equipment });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch equipment' });
    }
  });

  // Get equipment with current borrowings
  fastify.get('/equipment/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const equipment = await database.get('SELECT * FROM equipment WHERE id = ?', [id]);
      if (!equipment) {
        return reply.status(404).send({ success: false, error: 'Equipment not found' });
      }

      const borrowings = await database.all(`
        SELECT * FROM borrowings 
        WHERE equipment_id = ? 
        ORDER BY borrowing_date DESC
      `, [id]);

      const result = {
        ...equipment,
        current_borrowings: borrowings.filter(b => b.status === 'borrowed'),
        borrowing_history: borrowings
      };

      return reply.send({ success: true, data: result });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch equipment details' });
    }
  });

  // Create new equipment
  fastify.post('/equipment', async (request: FastifyRequest<{ Body: CreateEquipment }>, reply: FastifyReply) => {
    try {
      const equipment = request.body;
      const id = uuidv4();
      const now = new Date().toISOString();

      await database.run(`
        INSERT INTO equipment (id, name, description, total_count, available_count, storage_area, rubric, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, equipment.name, equipment.description, equipment.total_count, equipment.total_count, equipment.storage_area, equipment.rubric, now, now]);

      const newEquipment = await database.get('SELECT * FROM equipment WHERE id = ?', [id]);
      return reply.status(201).send({ success: true, data: newEquipment });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to create equipment' });
    }
  });

  // Update equipment
  fastify.put('/equipment/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateEquipment }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      const now = new Date().toISOString();

      // If total_count is being updated, adjust available_count proportionally
      let newAvailableCount: number | undefined;
      if (updates.total_count !== undefined) {
        const currentEquipment = await database.get('SELECT * FROM equipment WHERE id = ?', [id]);
        if (currentEquipment) {
          const borrowedCount = currentEquipment.total_count - currentEquipment.available_count;
          newAvailableCount = Math.max(0, updates.total_count - borrowedCount);
        }
      }

      const validFields: (keyof UpdateEquipment)[] = ['name', 'description', 'total_count', 'storage_area', 'rubric'];
      const fieldsToUpdate = validFields.filter(field => updates[field] !== undefined);
      
      if (fieldsToUpdate.length === 0) {
        return reply.status(400).send({ success: false, error: 'No fields to update' });
      }

      // Build the SQL query
      let setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
      let values = fieldsToUpdate.map(field => updates[field]);
      
      // Add available_count update if needed
      if (newAvailableCount !== undefined) {
        setClause += ', available_count = ?';
        values.push(newAvailableCount);
      }
      
      values.push(now, id);

      await database.run(`
        UPDATE equipment 
        SET ${setClause}, updated_at = ?
        WHERE id = ?
      `, values);

      const updatedEquipment = await database.get('SELECT * FROM equipment WHERE id = ?', [id]);
      return reply.send({ success: true, data: updatedEquipment });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to update equipment' });
    }
  });

  // Delete equipment
  fastify.delete('/equipment/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if equipment has active borrowings
      const activeBorrowings = await database.all('SELECT * FROM borrowings WHERE equipment_id = ? AND status = ?', [id, 'borrowed']);
      if (activeBorrowings.length > 0) {
        return reply.status(400).send({ success: false, error: 'Cannot delete equipment with active borrowings' });
      }

      const result = await database.run('DELETE FROM equipment WHERE id = ?', [id]);
      if (result.changes === 0) {
        return reply.status(404).send({ success: false, error: 'Equipment not found' });
      }

      return reply.send({ success: true, message: 'Equipment deleted successfully' });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to delete equipment' });
    }
  });

  // BORROWING OPERATIONS

  // Get all borrowings
  fastify.get('/borrowings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const borrowings = await database.all(`
        SELECT b.*, e.name as equipment_name, e.rubric as equipment_rubric
        FROM borrowings b
        JOIN equipment e ON b.equipment_id = e.id
        ORDER BY b.borrowing_date DESC
      `);
      return reply.send({ success: true, data: borrowings });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch borrowings' });
    }
  });

  // Borrow equipment
  fastify.post('/borrowings', async (request: FastifyRequest<{ Body: CreateBorrowing }>, reply: FastifyReply) => {
    try {
      const borrowing = request.body;
      
      // Check if equipment is available
      const equipment = await database.get('SELECT * FROM equipment WHERE id = ?', [borrowing.equipment_id]);
      if (!equipment) {
        return reply.status(404).send({ success: false, error: 'Equipment not found' });
      }
      
      if (equipment.available_count <= 0) {
        return reply.status(400).send({ success: false, error: 'Equipment not available' });
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      await database.run(`
        INSERT INTO borrowings (id, equipment_id, borrowing_date, expected_return_date, borrower_name, event_name, event_location, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, borrowing.equipment_id, borrowing.borrowing_date, borrowing.expected_return_date, borrowing.borrower_name, borrowing.event_name, borrowing.event_location, borrowing.notes, now, now]);

      const newBorrowing = await database.get(`
        SELECT b.*, e.name as equipment_name 
        FROM borrowings b 
        JOIN equipment e ON b.equipment_id = e.id 
        WHERE b.id = ?
      `, [id]);
      
      return reply.status(201).send({ success: true, data: newBorrowing });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to create borrowing' });
    }
  });

  // Return equipment
  fastify.put('/borrowings/:id/return', async (request: FastifyRequest<{ Params: { id: string }, Body: ReturnEquipment }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { returner_name, actual_return_date, notes } = request.body;
      const now = new Date().toISOString();

      const borrowing = await database.get('SELECT * FROM borrowings WHERE id = ? AND status = ?', [id, 'borrowed']);
      if (!borrowing) {
        return reply.status(404).send({ success: false, error: 'Active borrowing not found' });
      }

      await database.run(`
        UPDATE borrowings 
        SET status = 'returned', 
            actual_return_date = ?, 
            returner_name = ?,
            notes = COALESCE(?, notes),
            updated_at = ?
        WHERE id = ?
      `, [actual_return_date, returner_name, notes, now, id]);

      const updatedBorrowing = await database.get(`
        SELECT b.*, e.name as equipment_name 
        FROM borrowings b 
        JOIN equipment e ON b.equipment_id = e.id 
        WHERE b.id = ?
      `, [id]);

      return reply.send({ success: true, data: updatedBorrowing });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to return equipment' });
    }
  });

  // Get dashboard stats
  fastify.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const totalEquipment = await database.get('SELECT COUNT(*) as count FROM equipment');
      const totalItems = await database.get('SELECT SUM(total_count) as count FROM equipment');
      const availableItems = await database.get('SELECT SUM(available_count) as count FROM equipment');
      const activeBorrowings = await database.get('SELECT COUNT(*) as count FROM borrowings WHERE status = ?', ['borrowed']);
      const overdueBorrowings = await database.get(`
        SELECT COUNT(*) as count FROM borrowings 
        WHERE status = 'borrowed' AND expected_return_date < date('now')
      `);

      const stats = {
        total_equipment_types: totalEquipment.count,
        total_items: totalItems.count || 0,
        available_items: availableItems.count || 0,
        borrowed_items: (totalItems.count || 0) - (availableItems.count || 0),
        active_borrowings: activeBorrowings.count,
        overdue_borrowings: overdueBorrowings.count
      };

      return reply.send({ success: true, data: stats });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch dashboard stats' });
    }
  });

  // Search equipment
  fastify.get('/equipment/search/:query', async (request: FastifyRequest<{ Params: { query: string } }>, reply: FastifyReply) => {
    try {
      const { query } = request.params;
      const equipment = await database.all(`
        SELECT * FROM equipment 
        WHERE name LIKE ? OR description LIKE ? OR rubric LIKE ? OR storage_area LIKE ?
        ORDER BY name
      `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
      
      return reply.send({ success: true, data: equipment });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Equipment search failed' });
    }
  });

  // Get current borrowings (what's out right now)
  fastify.get('/borrowings/current', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const borrowings = await database.all(`
        SELECT b.*, e.name as equipment_name, e.rubric as equipment_rubric
        FROM borrowings b
        JOIN equipment e ON b.equipment_id = e.id
        WHERE b.status = 'borrowed'
        ORDER BY b.expected_return_date ASC
      `);
      return reply.send({ success: true, data: borrowings });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch current borrowings' });
    }
  });

  // Get overdue items
  fastify.get('/borrowings/overdue', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const borrowings = await database.all(`
        SELECT b.*, e.name as equipment_name, e.rubric as equipment_rubric
        FROM borrowings b
        JOIN equipment e ON b.equipment_id = e.id
        WHERE b.status = 'borrowed' AND b.expected_return_date < date('now')
        ORDER BY b.expected_return_date ASC
      `);
      return reply.send({ success: true, data: borrowings });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch overdue items' });
    }
  });
}