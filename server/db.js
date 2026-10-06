
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'contract_user',
  password: process.env.DB_PASSWORD || 'contract123',
  database: process.env.DB_NAME || 'contract_intelligence',
  waitForConnections: true,
  connectionLimit: 10
});

export async function testDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query('SELECT 1');

    console.log('MySQL connected successfully');
  } finally {
    connection.release();
  }
}

export default pool;
