import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Event, CreateEvent, UpdateEvent, DeleteEvent } from '../types/events';

export async function eventRoutes(fastify: FastifyInstance) {
  
  // EVENT CRUD OPERATIONS
  
  // Get all events
  fastify.get('/events', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Fixed table name from "event" to "events"
      const events = await database.all(`
        SELECT * FROM events 
        ORDER BY begin_date, name
      `);
      return reply.send({ success: true, data: events });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to fetch events' });
    }
  });

  // Get event by ID
  fastify.get('/events/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Fixed table name from "event" to "events"
      const event = await database.get('SELECT * FROM events WHERE id = ?', [id]);
      if (!event) {
        return reply.status(404).send({ success: false, error: 'Event not found' });
      }

      return reply.send({ success: true, data: event });
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

      // Fixed parameter order and added missing managed_by
      await database.run(`
        INSERT INTO events (id, name, description, event_id, location, managed_by, begin_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, event.name, event.description || '', event.event_id, event.location, event.managed_by || 'System', event.begin_date, event.end_date, now, now]);

      const newEvent = await database.get('SELECT * FROM events WHERE id = ?', [id]);
      return reply.status(201).send({ success: true, data: newEvent });
    } catch (error) {
      console.error('Create event error:', error);
      return reply.status(500).send({ success: false, error: 'Failed to create event' });
    }
  });

  // Update event
  fastify.put('/events/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateEvent }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      const now = new Date().toISOString();

      const validFields: (keyof UpdateEvent)[] = ['name', 'description', 'event_id', 'location', 'managed_by', 'begin_date', 'end_date', 'status'];
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
      return reply.status(500).send({ success: false, error: 'Failed to update event' });
    }
  });

  // Delete event
  fastify.delete('/events/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const result = await database.run('DELETE FROM events WHERE id = ?', [id]);
      if (result.changes === 0) {
        return reply.status(404).send({ success: false, error: 'Event not found' });
      }

      return reply.send({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Failed to delete event' });
    }
  });
}