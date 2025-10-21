import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'central_ops_bgta',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar la conexión
pool.getConnection()
  .then(connection => {
    console.log('Conexión a la base de datos establecida correctamente');
    connection.release();
  })
  .catch(err => {
    console.error('Error al conectar con la base de datos:', err);
  });

export default pool;
