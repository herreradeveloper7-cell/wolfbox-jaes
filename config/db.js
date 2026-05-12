import sql from "mssql";

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

export let poolPromise =
  process.env.NODE_ENV === "test"
    ? Promise.resolve(null)
    : new sql.ConnectionPool(config)
        .connect()
        .then((pool) => {
          console.log("Conectado a Azure SQL");
          return pool;
        })
        .catch((err) => {
          console.error("Error de conexion a Azure SQL:", err);
          throw err;
        });

export const __setPoolPromiseForTests = (nextPoolPromise) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("__setPoolPromiseForTests solo puede usarse en NODE_ENV=test");
  }

  poolPromise = nextPoolPromise;
};

export { sql };
