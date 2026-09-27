import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gargee_medicose_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export default pool;

// mysql2 surfaces connection failures as an AggregateError with an empty
// message, so every `err.message` in the API layers resolves to ''.
export const dbErrorMessage = (err) =>
  err?.message || (err?.code ? `Database error (${err.code})` : 'Database unavailable');
