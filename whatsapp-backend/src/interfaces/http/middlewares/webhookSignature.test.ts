import { verifyWebhookSignature } from "./webhookSignature";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

describe("verifyWebhookSignature Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {},
      rawBody: undefined,
    } as any;
    statusMock = jest.fn().mockReturnThis();
    sendMock = jest.fn();
    res = {
      status: statusMock,
      send: sendMock,
    };
    next = jest.fn();
    delete process.env.APP_SECRET;
  });

  afterEach(() => {
    delete process.env.APP_SECRET;
  });

  it("should bypass verification if APP_SECRET is not configured", () => {
    verifyWebhookSignature(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should return 401 if signature header is missing when APP_SECRET is configured", () => {
    process.env.APP_SECRET = "my_secret";
    verifyWebhookSignature(req as Request, res as Response, next);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith("Signature missing");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if signature format is invalid", () => {
    process.env.APP_SECRET = "my_secret";
    req.headers = { "x-hub-signature-256": "invalidformat" };
    verifyWebhookSignature(req as Request, res as Response, next);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith("Invalid signature format");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if signature does not match computed HMAC", () => {
    process.env.APP_SECRET = "my_secret";
    req.headers = { "x-hub-signature-256": "sha256=wrongsignature" };
    (req as any).rawBody = Buffer.from(JSON.stringify({ text: "hello" }));
    verifyWebhookSignature(req as Request, res as Response, next);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith("Signature mismatch");
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if signature is valid and matches computed HMAC", () => {
    const secret = "my_secret";
    process.env.APP_SECRET = secret;
    const bodyStr = JSON.stringify({ text: "hello" });
    (req as any).rawBody = Buffer.from(bodyStr);

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(Buffer.from(bodyStr));
    const validSignature = hmac.digest("hex");

    req.headers = { "x-hub-signature-256": `sha256=${validSignature}` };
    verifyWebhookSignature(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should bypass verification if request is from the simulator (not Meta format)", () => {
    process.env.APP_SECRET = "my_secret";
    req.body = { userId: "12345", messageBody: "Hello" };
    verifyWebhookSignature(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
