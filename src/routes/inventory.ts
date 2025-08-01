import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { InventoryItem, CreateInventoryItem, UpdateInventoryItem } from '../types/inventory';

export async function inventoryRoutes(fastify: FastifyInstance) {
  // Get all inventory items
  fastify.get('/inventory', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const items = await database.all(`
        SELECT * FROM inventory 
        ORDER BY updated_at DESC
      `);
      return reply.send({ success: true, data: items });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ success: false, error: 'Failed to fetch inventory' });
    }
  });

  // Get inventory item by ID
  fastify.get('/inventory/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const item = await database.get('SELECT * FROM inventory WHERE id = ?', [id]);
      
      if (!item) {
        return reply.status(404).send({ success: false, error: 'Item not found' });
      }
      
      return reply.send({ success: true, data: item });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ success: false, error: 'Failed to fetch item' });
    }
  });

  // Create new inventory item
  fastify.post('/inventory', async (request: FastifyRequest<{ Body: CreateInventoryItem }>, reply: FastifyReply) => {
    try {
      const item = request.body;
      const id = uuidv4();
      const now = new Date().toISOString();

      await database.run(`
        INSERT INTO inventory (id, name, description, quantity, location, category, sku, price, supplier, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, item.name, item.description, item.quantity, item.location, item.category, item.sku, item.price, item.supplier, now, now]);

      const newItem = await database.get('SELECT * FROM inventory WHERE id = ?', [id]);
      return reply.status(201).send({ success: true, data: newItem });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.status(400).send({ success: false, error: 'SKU already exists' });
      }
      return reply.status(500).send({ success: false, error: 'Failed to create item' });
    }
  });

  // Update inventory item
  fastify.put('/inventory/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateInventoryItem }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      const now = new Date().toISOString();

      // Build dynamic update query with proper typing
      const validFields: (keyof UpdateInventoryItem)[] = ['name', 'description', 'quantity', 'location', 'category', 'sku', 'price', 'supplier'];
      const fieldsToUpdate = validFields.filter(field => updates[field] !== undefined);
      
      if (fieldsToUpdate.length === 0) {
        return reply.status(400).send({ success: false, error: 'No fields to update' });
      }

      const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
      const values = fieldsToUpdate.map(field => updates[field]);
      values.push(now, id);

      await database.run(`
        UPDATE inventory 
        SET ${setClause}, updated_at = ?
        WHERE id = ?
      `, values);

      const updatedItem = await database.get('SELECT * FROM inventory WHERE id = ?', [id]);
      if (!updatedItem) {
        return reply.status(404).send({ success: false, error: 'Item not found' });
      }

      return reply.send({ success: true, data: updatedItem });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ success: false, error: 'Failed to update item' });
    }
  });

  // Delete inventory item
  fastify.delete('/inventory/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const result = await database.run('DELETE FROM inventory WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        return reply.status(404).send({ success: false, error: 'Item not found' });
      }
      
      return reply.send({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ success: false, error: 'Failed to delete item' });
    }
  });

  // Search inventory
  fastify.get('/inventory/search/:query', async (request: FastifyRequest<{ Params: { query: string } }>, reply: FastifyReply) => {
    try {
      const { query } = request.params;
      const items = await database.all(`
        SELECT * FROM inventory 
        WHERE name LIKE ? OR description LIKE ? OR category LIKE ? OR location LIKE ?
        ORDER BY updated_at DESC
      `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
      
      return reply.send({ success: true, data: items });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ success: false, error: 'Search failed' });
    }
  });
}