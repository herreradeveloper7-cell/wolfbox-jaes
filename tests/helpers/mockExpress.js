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
