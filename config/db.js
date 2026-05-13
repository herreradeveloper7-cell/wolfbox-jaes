import sql from "mssql";

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 1433,
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT) || 60000,
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 10,
    min: Number(process.env.DB_POOL_MIN) || 0,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let pool;
let connectingPromise;
let testPoolPromise = null;

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
