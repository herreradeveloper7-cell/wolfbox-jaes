export const createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    cookie(name, value, options) {
      this.cookies ||= {};
      this.cookies[name] = { value, options };
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies ||= {};
      this.clearedCookies[name] = options;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
};

export const createNext = () => {
  const next = () => {
    next.called = true;
  };

  next.called = false;
  return next;
};
