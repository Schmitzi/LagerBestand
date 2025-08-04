import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Event, CreateEvent, UpdateEvent, DeleteEvent } from '../types/events';

export async function eventRoutes(fastify: FastifyInstance) {
  
  // EVENT CRUD OPERATIONS
  
  // Get all events
  fastify.get('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const event = await database.all(`
        SELECT * FROM event 
        ORDER BY date, name
      `);
      return reply.send({ success: true, data: event });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch events' });
    }
  });

  // Get event by ID
  fastify.get('/events/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const event = await database.get('SELECT * FROM event WHERE id = ?', [id]);
      if (!event) {
        return reply.status(404).send({ success: false, error: 'Event not found' });
      }

      const result = {
        ...event,
      };

      return reply.send({ success: true, data: result });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch event details' });
    }
  });

  // Create new event
  fastify.post('/events', async (request: FastifyRequest<{ Body: CreateEvent }>, reply: FastifyReply) => {
    try {
      const event = request.body;
      const id = uuidv4();
      const now = new Date().toISOString();

      await database.run(`
        INSERT INTO events (id, name, description, event_id, location, begin_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, event.name, event.description, event.location, event.begin_date, event.end_date, now, now]);

      const newEquipment = await database.get('SELECT * FROM equipment WHERE id = ?', [id]);
      return reply.status(201).send({ success: true, data: newEquipment });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to create equipment' });
    }
  });

  // Update equipment
  fastify.put('/events/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateEvent }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      const now = new Date().toISOString();

      const validFields: (keyof UpdateEvent)[] = ['name', 'description', 'event_id', 'location', 'begin_date', 'end_date']; // TODO: created_at, now(updated_at)
      const fieldsToUpdate = validFields.filter(field => updates[field] !== undefined);
      
      if (fieldsToUpdate.length === 0) {
        return reply.status(400).send({ success: false, error: 'No fields to update' });
      }

      // Build the SQL query
      let setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
      let values = fieldsToUpdate.map(field => updates[field]);
      
      values.push(now, id);

      await database.run(`
        UPDATE events
        SET ${setClause}, updated_at = ?
        WHERE id = ?
      `, values);

      const updatedEvent = await database.get('SELECT * FROM events WHERE id = ?', [id]);
      return reply.send({ success: true, data: updatedEvent });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to update equipment' });
    }
  });

  // Delete event
  fastify.delete('/events/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if event has ended // TODO:
    //   const activeBorrowings = await database.all('SELECT * FROM borrowings WHERE equipment_id = ? AND status = ?', [id, 'borrowed']);
    //   if (activeBorrowings.length > 0) {
    //     return reply.status(400).send({ success: false, error: 'Cannot delete equipment with active borrowings' });
    //   }

      const result = await database.run('DELETE FROM events WHERE id = ?', [id]);
      if (result.changes === 0) {
        return reply.status(404).send({ success: false, error: 'Event not found' });
      }

      return reply.send({ success: true, message: 'Evment deleted successfully' });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to delete event' });
    }
  });
}