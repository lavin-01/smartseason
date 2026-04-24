const CONNECTION_ERROR_CODES = new Set(['P1000', 'P1001', 'P1002', 'P1010']);

function getDatabaseErrorMessage(error) {
  const message = error?.message || '';

  if (error?.code === 'P1000' || /password authentication failed/i.test(message)) {
    return 'Database authentication failed. Update backend/.env DATABASE_URL with the correct PostgreSQL username, password, host, and port.';
  }

  if (error?.code === 'P1001' || /can\'t reach database server/i.test(message)) {
    return 'Database server is unavailable. Check backend/.env DATABASE_URL and make sure PostgreSQL is running.';
  }

  if (
    CONNECTION_ERROR_CODES.has(error?.code)
    || error?.name === 'PrismaClientInitializationError'
  ) {
    return 'Database connection failed. Check backend/.env DATABASE_URL and your PostgreSQL setup.';
  }

  return null;
}

function isDatabaseConnectionError(error) {
  return Boolean(getDatabaseErrorMessage(error));
}

function respondWithDatabaseError(res, error, fallbackMessage) {
  const databaseMessage = getDatabaseErrorMessage(error);
  console.error(error);

  if (databaseMessage) {
    return res.status(503).json({ error: databaseMessage });
  }

  return res.status(500).json({ error: fallbackMessage });
}

module.exports = {
  getDatabaseErrorMessage,
  isDatabaseConnectionError,
  respondWithDatabaseError,
};
