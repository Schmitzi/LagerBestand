import { FastifyInstance } from 'fastify';

interface QRScanParams {
  qrCode: string;
}

export async function qrRoutes(fastify: FastifyInstance) {
  
  // QR lookup - just redirect to existing equipment endpoint
  fastify.get<{ Params: QRScanParams }>('/qr/scan/:qrCode', async (request, reply) => {
    try {
      const { qrCode } = request.params;
      
      console.log('QR scan for equipment:', qrCode);
      
      // Make internal request to existing equipment endpoint
      const equipmentResponse = await fastify.inject({
        method: 'GET',
        url: `/api/equipment/${qrCode}`
      });
      
      // Parse the response
      const equipmentData = JSON.parse(equipmentResponse.body);
      
      if (equipmentResponse.statusCode === 200 && equipmentData.success) {
        return reply.send({
          success: true,
          data: equipmentData.data,
          qr_code: qrCode,
          message: 'Equipment found via QR scan'
        });
      } else {
        return reply.status(404).send({
          success: false,
          message: 'Equipment not found',
          qr_code: qrCode
        });
      }
      
    } catch (error) {
      console.error('QR scan error:', error);
      return reply.status(500).send({
        success: false,
        message: 'QR scan failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Simple health check
  fastify.get('/qr/health', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'QR service is running'
    });
  });
}