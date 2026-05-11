import bcrypt from 'bcrypt';

const run = async () => {
  const hash = await bcrypt.hash('1234567', 10);
};

run();
