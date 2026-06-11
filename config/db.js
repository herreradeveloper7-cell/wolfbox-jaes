import sql from "mssql";

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 1433,
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT) || 60000,
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 10,
    min: Number(process.env.DB_POOL_MIN) || 1,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 300000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let pool;
let connectingPromise;
let testPoolPromise = null;
let keepAliveStarted = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const closePool = async () => {
  if (!pool) return;

  try {
    await pool.close();
  } catch (error) {
    console.error("Error cerrando pool SQL:", error);
  } finally {
    pool = null;
  }
};

const connectWithRetry = async (attempt = 1) => {
  try {
    const nextPool = new sql.ConnectionPool(config);

    nextPool.on("error", (error) => {
      console.error("Error en pool Azure SQL:", error);
      pool = null;
      connectingPromise = null;
    });

    pool = await nextPool.connect();
    console.log("Conectado a Azure SQL");
    return pool;
  } catch (error) {
    await closePool();

    if (attempt < 3) {
      const delay = attempt * 1500;
      console.warn(`Reintentando conexion Azure SQL (${attempt}/3) en ${delay}ms`, error.message);
      await sleep(delay);
      return connectWithRetry(attempt + 1);
    }

    console.error("Error de conexion a Azure SQL:", error);
    throw error;
  }
};

const getPool = async () => {
  if (process.env.NODE_ENV === "test" && testPoolPromise) {
    return testPoolPromise;
  }

  if (pool?.connected) {
    return pool;
  }

  if (!connectingPromise) {
    connectingPromise = connectWithRetry().finally(() => {
      connectingPromise = null;
    });
  }

  return connectingPromise;
};

export const warmUpDatabase = async () => {
  const startedAt = Date.now();
  const nextPool = await getPool();
  await nextPool.request().query("SELECT 1 AS ok");
  const elapsed = Date.now() - startedAt;
  console.log(`Azure SQL warm-up OK en ${elapsed}ms`);
};

export const iniciarDbKeepAlive = ({
  intervaloMs = Number(process.env.DB_KEEPALIVE_INTERVAL_MS) || 240000,
} = {}) => {
  if (
    keepAliveStarted ||
    process.env.NODE_ENV === "test" ||
    process.env.DB_KEEPALIVE_DISABLED === "true"
  ) return;

  keepAliveStarted = true;

  warmUpDatabase().catch((error) => {
    console.error("Warm-up inicial Azure SQL fallo:", error.message);
  });

  setInterval(() => {
    warmUpDatabase().catch((error) => {
      console.error("Keep-alive Azure SQL fallo:", error.message);
    });
  }, intervaloMs).unref?.();
};

export const poolPromise = {
  then: (resolve, reject) => getPool().then(resolve, reject),
  catch: (reject) => getPool().catch(reject),
  finally: (callback) => getPool().finally(callback),
};

export const __setPoolPromiseForTests = (nextPoolPromise) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("__setPoolPromiseForTests solo puede usarse en NODE_ENV=test");
  }

  testPoolPromise = nextPoolPromise;
};

export { sql };
