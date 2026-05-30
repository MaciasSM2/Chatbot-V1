import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // En producción podrías añadir: new winston.transports.File({ filename: 'combined.log' })
  ],
});

export default logger;
