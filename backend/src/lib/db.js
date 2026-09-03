import mongoose from "mongoose";

// How often to ping the server to keep the connection pool warm.
// Kept comfortably under the ~5-10 min idle-socket timeouts used by
// most managed MongoDB providers (Atlas included) and by NATs/proxies
// on mobile networks, so the pool never goes fully cold between chat
// opens — that cold-start reconnect was the pause users felt on the
// very first message load after a few minutes away.
const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000;
let keepAliveTimer = null;

function startKeepAlive() {
  if (keepAliveTimer) return; // already running
  keepAliveTimer = setInterval(async () => {
    try {
      // cheapest possible round trip — just confirms the socket is
      // alive and resets any idle timers on the server/proxy side
      await mongoose.connection.db.admin().ping();
    } catch (err) {
      console.warn("MongoDB keep-alive ping failed (non-fatal):", err.message);
    }
  }, KEEPALIVE_INTERVAL_MS);
  // don't let this timer keep the Node process alive on its own
  keepAliveTimer.unref?.();
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // reuse connections across requests instead of reconnecting
      minPoolSize: 1, // always keep at least one live connection open instead of opening one lazily on the first request after idling
      serverSelectionTimeoutMS: 8000, // fail fast & loud instead of hanging silently
      socketTimeoutMS: 20000,
      heartbeatFrequencyMS: 10000, // check server status every 10s so a dropped connection is noticed (and reconnected) quickly, instead of the ~30s driver default
      family: 4, // avoid occasional IPv6 resolution hiccups on mobile networks
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    startKeepAlive();
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }

  // Network blips (mobile data/wifi switching, etc.) cause the driver
  // to emit 'error'/'disconnected' events on the connection. Without a
  // listener here, an error event on an EventEmitter with no handler
  // crashes the whole Node process (that's what happened with the
  // ECONNRESET/PoolClearedError crash). Log and let Mongoose's built-in
  // reconnection logic handle it instead of dying.
  mongoose.connection.on("error", (err) => {
    console.warn("MongoDB connection error (non-fatal):", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected — will attempt to reconnect automatically");
    stopKeepAlive();
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
    startKeepAlive();
  });
};
