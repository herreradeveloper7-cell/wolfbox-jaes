import sql from "mssql";

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 1433,

  connectionTimeout:
    Number(process.env.DB_CONNECTION_TIMEOUT) || 10000,

  requestTimeout:
    Number(process.env.DB_REQUEST_TIMEOUT) || 15000,

  pool: {
    max: Number(process.env.DB_POOL_MAX) || 30,
    min: Number(process.env.DB_POOL_MIN) || 5,
    idleTimeoutMillis:
      Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    acquireTimeoutMillis:
      Number(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 10000,
    createTimeoutMillis:
      Number(process.env.DB_POOL_CREATE_TIMEOUT) || 10000,
    destroyTimeoutMillis:
      Number(process.env.DB_POOL_DESTROY_TIMEOUT) || 5000,
    reapIntervalMillis:
      Number(process.env.DB_POOL_REAP_INTERVAL) || 1000,
    createRetryIntervalMillis:
      Number(process.env.DB_POOL_CREATE_RETRY_INTERVAL) || 200,
  },

  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

let pool = null;
let connectingPromise = null;
let testPoolPromise = null;
let keepAliveStarted = false;

const createPool = async () => {
  const newPool = new sql.ConnectionPool(config);

  newPool.on("error", (error) => {
    console.error("Error en pool SQL Server:", error);
  });

  await newPool.connect();

  console.log(
    `Conectado SQL Server ${config.server}:${config.port}/${config.database}`
  );

  return newPool;
};

const getPool = async () => {
  if (process.env.NODE_ENV === "test" && testPoolPromise) {
    return testPoolPromise;
  }

  if (pool?.connected) {
    return pool;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = createPool()
    .then((connectedPool) => {
      pool = connectedPool;
      return pool;
    })
    .finally(() => {
      connectingPromise = null;
    });

  return connectingPromise;
};

export const warmUpDatabase = async () => {
  const startedAt = Date.now();

  const currentPool = await getPool();

  await currentPool
    .request()
    .query("SELECT 1 AS ok");

  console.log(
    `SQL Server warm-up OK en ${Date.now() - startedAt}ms`
  );
};

export const iniciarDbKeepAlive = ({
  intervaloMs =
    Number(process.env.DB_KEEPALIVE_INTERVAL_MS) || 240000,
} = {}) => {
  if (
    keepAliveStarted ||
    process.env.NODE_ENV === "test" ||
    process.env.DB_KEEPALIVE_DISABLED === "true"
  ) {
    return;
  }

  keepAliveStarted = true;

  warmUpDatabase().catch((error) => {
    console.error(
      "Warm-up inicial SQL Server falló:",
      error.message
    );
  });

  setInterval(() => {
    warmUpDatabase().catch((error) => {
      console.error(
        "Keep-alive SQL Server falló:",
        error.message
      );
    });
  }, intervaloMs).unref?.();
};

export const poolPromise = {
  then: (resolve, reject) =>
    getPool().then(resolve, reject),

  catch: (reject) =>
    getPool().catch(reject),

  finally: (callback) =>
    getPool().finally(callback),
};

export const __setPoolPromiseForTests = (nextPoolPromise) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "__setPoolPromiseForTests solo puede usarse en NODE_ENV=test"
    );
  }

  testPoolPromise = nextPoolPromise;
};

export { sql };