const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User.model");
const { resolveCorsConfig, createCorsOptions } = require("../config/cors");

let socketServer;

const userRoom = (userId) => `user:${userId}`;
const ADMIN_ROOM = "role:admin";

const socketAuthError = (message, code = "FORBIDDEN_ROLE") => {
  const error = new Error(message);
  error.data = { code };
  return error;
};

const authenticateSocketToken = async (token, {
  secret = process.env.JWT_SECRET,
  findUser = (id) => User.findById(id).select("role isActive moverApprovalStatus"),
} = {}) => {
  if (typeof token !== "string" || !token) throw socketAuthError("Authentication required", "TOKEN_INVALID");

  let decoded;
  try {
    decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    throw socketAuthError("Authentication token is invalid or expired", "TOKEN_INVALID");
  }
  if (!decoded?.id || !Number.isSafeInteger(decoded.exp)) throw socketAuthError("Authentication token is invalid", "TOKEN_INVALID");

  let user;
  try {
    user = await findUser(decoded.id);
  } catch {
    throw socketAuthError("Could not verify account authorization", "AUTH_UNAVAILABLE");
  }
  if (!user || user.isActive === false) throw socketAuthError("Account is unavailable", "ACCOUNT_UNAVAILABLE");
  if (!["user", "admin", "mover"].includes(user.role)) throw socketAuthError("Account role is not authorized");
  if (user.role === "mover" && user.moverApprovalStatus !== "approved") {
    throw socketAuthError("Mover account is not approved", "MOVER_NOT_APPROVED");
  }

  return {
    id: String(user._id || decoded.id),
    role: user.role,
    expiresAt: decoded.exp * 1000,
  };
};

const initializeSocketServer = (httpServer, corsConfig = resolveCorsConfig(process.env)) => {
  if (socketServer) throw new Error("Socket.IO has already been initialized");

  socketServer = new Server(httpServer, {
    cors: createCorsOptions(corsConfig),
    allowRequest(request, callback) {
      const origin = request.headers.origin;
      callback(null, !origin || corsConfig.origins.includes(origin));
    },
    maxHttpBufferSize: 100 * 1024,
  });

  socketServer.use(async (socket, next) => {
    try {
      socket.data.authenticatedUser = await authenticateSocketToken(socket.handshake.auth?.token);
      next();
    } catch (error) {
      next(error);
    }
  });

  socketServer.on("connection", (socket) => {
    const user = socket.data.authenticatedUser;
    socket.join(userRoom(user.id));
    if (user.role === "admin") socket.join(ADMIN_ROOM);

    const remainingLifetime = Math.max(0, user.expiresAt - Date.now());
    const expiryTimer = setTimeout(() => socket.disconnect(true), remainingLifetime);
    expiryTimer.unref?.();
    socket.once("disconnect", () => clearTimeout(expiryTimer));
  });

  return socketServer;
};

const getSocketServer = () => socketServer;
const emitToUser = (userId, event, payload) => socketServer?.to(userRoom(userId)).emit(event, payload);
const emitToAdmins = (event, payload) => socketServer?.to(ADMIN_ROOM).emit(event, payload);

module.exports = {
  ADMIN_ROOM,
  authenticateSocketToken,
  emitToAdmins,
  emitToUser,
  getSocketServer,
  initializeSocketServer,
  userRoom,
};
