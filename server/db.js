
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'contract_user',
  password: 'contract123',
  database: 'contract_intelligence',
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
