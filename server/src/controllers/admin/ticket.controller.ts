import { Request, Response } from 'express';
import { resolveTicket, getTickets, getTicketById, createMessage, assignTicket, createTicket, getAssignableStaff } from '../../services/admin/ticket.service.js';
import { createRedisClient } from '../../config/redis.js';
import { parseOptionalString, parseNumber } from '../../utils/queryParser.js';
import { sendSuccess, sendError } from "../../contracts/api.contracts.js";
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

// Optional chaining if redis isn't fully configured locally
const redisClient = process.env.REDIS_URL ? createRedisClient(process.env.REDIS_URL) : null;

export const resolveTicketHandler = async (req: Request, res: Response) => {
  console.log("=== HIT RESOLVE TICKET HANDLER ===");
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  try {
    const ticketId = parseNumber(req.params.id, NaN);
    const adminId = (req as any).user?.id || 1;
    
    const result = await resolveTicket(ticketId, adminId, req.body);

    if (redisClient) {
      await redisClient.del(`api:dashboard:admin:${adminId}`);
      await redisClient.del(`api:admin:escalations:${adminId}`);
    }

    sendSuccess(res, result, undefined, undefined, 200);
  } catch (error: any) {
    console.error("RESOLVE TICKET ERROR:", error);
    sendSuccess(res, { error: error.message }, undefined, undefined, 500);
  }
};

// Durable Server-Sent Events via Redis Streams
export const streamTickets = async (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  let lastEventId = req.headers['last-event-id'] || '$';

  if (!redisClient) {
    res.write(`data: {"error": "Redis not configured"}\n\n`);
    return;
  }

  try {
    // Continuously read from the Redis Stream
    while (!res.closed) {
      const results = await redisClient.xread('BLOCK', 5000, 'STREAMS', 'ticket_events', lastEventId);
      if (!results) {
        // Send a keep-alive ping to prevent the browser/proxy from closing the connection
        res.write(': keep-alive\n\n');
        continue;
      }
      
      for (const [stream, messages] of results) {
        for (const [messageId, fieldsArray] of messages) {
          
          let payload = '{}';
          for (let i = 0; i < fieldsArray.length; i += 2) {
            if (fieldsArray[i] === 'payload') {
              payload = fieldsArray[i + 1];
            }
          }
          
          let eventType = 'message';
          try {
             const parsed = JSON.parse(payload);
             eventType = parsed.type || 'message'; 
          } catch(e) {}
          
          res.write(`id: ${messageId}\n`);
          res.write(`event: TicketResolvedEvent\n`); 
          res.write(`data: ${payload}\n\n`);
          
          lastEventId = messageId;
        }
      }
    }
  } catch (error) {
    console.error('Redis Stream Error:', error);
    res.end();
  }
};

export const getTicketsHandler = async (req: Request, res: Response) => {
  try {
    const parsedQuery = {
      status: parseOptionalString(req.query.status),
      priority: parseOptionalString(req.query.priority),
      page: req.query.page ? parseNumber(req.query.page, 1) : undefined,
      limit: req.query.limit ? parseNumber(req.query.limit, 10) : undefined,
    };
    const result = await getTickets(parsedQuery);
    sendSuccess(res, result, undefined, undefined, 200);
  } catch (error: any) {
    sendError(res, 'Internal error', [], 500);
  }
};

export const getTicketByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = parseNumber(req.params.id, NaN);
    const ticket = await getTicketById(id);
    sendSuccess(res, ticket, undefined, undefined, 200);
  } catch (error: any) {
    sendError(res, 'Internal error', [], 404);
  }
};

export const assignTicketHandler = async (req: Request, res: Response) => {
  try {
    const id = parseNumber(req.params.id, NaN);
    const adminId = (req as any).user?.id || 1;
    const { version } = req.body;
    const result = await assignTicket(id, adminId, version);

    if (redisClient) {
      await redisClient.del(`api:dashboard:admin:${adminId}`);
      await redisClient.del(`api:admin:escalations:${adminId}`);
    }

    sendSuccess(res, result, undefined, undefined, 200);
  } catch (error: any) {
    sendError(res, 'Internal error', [], 500);
  }
};

export const createMessageHandler = async (req: Request, res: Response) => {
  try {
    const id = parseNumber(req.params.id, NaN);
    // adminId should normally come from req.user
    const adminId = (req as any).user?.id || 1; 
    const result = await createMessage(id, adminId, req.body);
    sendSuccess(res, result, undefined, undefined, 200);
  } catch (error: any) {
    sendError(res, 'Internal error', [], 500);
  }
};

export const createTicketHandler = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id || 1;
    const result = await createTicket(adminId, req.body);
    sendSuccess(res, result, undefined, undefined, 201);
  } catch (error: any) {
    console.error("CREATE TICKET ERROR:", error);
    sendError(res, 'Internal error', [], 500);
  }
};

export const getAssignableStaffHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAssignableStaff();
    sendSuccess(res, result, undefined, undefined, 200);
  } catch (error: any) {
    console.error("GET ASSIGNABLE STAFF ERROR:", error);
    sendError(res, 'Internal error', [], 500);
  }
};
