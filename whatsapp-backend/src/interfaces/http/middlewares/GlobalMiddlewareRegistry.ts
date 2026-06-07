/**
 * @file GlobalMiddlewareRegistry.ts
 * @description Centralizador de middlewares globales (CORS, body-parser con rawBody, etc.) para Express.
 */
import express, { Express } from "express";
import cors from "cors";

const allowedOrigins = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL || ""
].filter(Boolean);

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Permitir curl, postman, etc.
  if (allowedOrigins.indexOf(origin) !== -1) return true;
  // Permitir loopback, localhost, y IPs de red local privada (192.168.*, 10.*, 172.*)
  if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
};

export const registerGlobalMiddlewares = (app: Express): void => {
  // 1. JSON body-parser con inyección de rawBody y límite de 10kb para mitigar DoS
  app.use(express.json({
    limit: '10kb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // 2. Configuración de CORS
  const corsOptions = {
    origin: (origin: any, callback: any) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
};
