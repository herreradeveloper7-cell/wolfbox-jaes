export const createSequentialPool = (responses) => {
  const calls = [];

  const pool = {
    calls,
    request() {
      const request = {
        inputs: {},
        input(name, type, value) {
          this.inputs[name] = { type, value };
          return this;
        },
        async query(queryText) {
          calls.push({ queryText, inputs: this.inputs });
          const next = responses.shift();

          if (typeof next === "function") {
            return next({ queryText, inputs: this.inputs });
          }

          return next || { recordset: [] };
        },
      };

      return request;
    },
  };

  return pool;
};

export const createMockSql = (responses) => {
  const calls = [];
  const transactions = [];

  class Transaction {
    constructor(pool) {
      this.pool = pool;
      this.begun = false;
      this.committed = false;
      this.rolledBack = false;
      transactions.push(this);
    }

    async begin() {
      this.begun = true;
    }

    async commit() {
      this.committed = true;
    }

    async rollback() {
      this.rolledBack = true;
    }
  }

  class Request {
    constructor(transaction) {
      this.transaction = transaction;
      this.inputs = {};
    }

    input(name, type, value) {
      this.inputs[name] = { type, value };
      return this;
    }

    async query(queryText) {
      calls.push({ queryText, inputs: this.inputs });
      const next = responses.shift();

      if (typeof next === "function") {
        return next({ queryText, inputs: this.inputs });
      }

      return next || { recordset: [] };
    }
  }

  return {
    calls,
    transactions,
    sql: {
      NVarChar: "NVarChar",
      VarChar: "VarChar",
      Int: "Int",
      Date: "Date",
      Decimal: (precision, scale) => `Decimal(${precision},${scale})`,
      Transaction,
      Request,
    },
  };
};
