import sql, { type Request } from 'mssql';

// ============================================================
// Конфигурация подключения к MS SQL
// ============================================================
// Параметры читаются из .env — так нельзя хардкодить учётные данные
// в коде. Это стандартная практика (12-factor app).
const config: sql.config = {

    server: process.env.SQL_SERVER ?? 'localhost',

    authentication: {
        type: 'default',  // SQL Server authentication
        options: {
            userName: process.env.SQL_USER ?? '',
            password: process.env.SQL_PASSWORD ?? '',
        },
    },

    // Дополнительные опции подключения
    options: {
        database: process.env.SQL_DATABASE ?? 'master',

        // Encrypt: true для продакшена (TLS/SSL шифрование канала)
        encrypt: process.env.SQL_ENCRYPT === 'true',

        // Доверять серверному сертификату (нужно при self-signed cert)
        trustServerCertificate: true,

        // Таймаут подключения (мс) — если БД долго отвечает при старте
        connectTimeout: 5000,
        // Таймаут выполнения запроса (мс) — для долгих процедур
        requestTimeout: 30000,
    },
};

// ============================================================
// Connection Pool — пул соединений
// ============================================================

// Singleton pattern: один пул на всё приложение, а не новый пул
// на каждый запрос. Иначе получим утечку соединений и БД упадёт.
let pool: sql.ConnectionPool | null = null;

// getPool() — ленивая инициализация (lazy initialization)
// Пул создаётся при первом запросе, а не при старте сервера.
// Это позволяет подхватить изменения .env если они загружаются асинхронно.
export async function getPool(): Promise<sql.ConnectionPool> {
    if (!pool) {
        // new sql.ConnectionPool(config) — создаёт пул с параметрами из config
        pool = await new sql.ConnectionPool(config).connect();
    }
    return pool;
}

// closePool() — закрывает все соединения в пуле
// Вызывается при остановке сервера (process.on('SIGTERM'))
// Без этого процесс Node.js может зависнуть — пул держит TCP-соединения
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.close();
        pool = null;
    }
}

// request() — создаёт запрос, привязанный к пулу

// Ключевой момент: new sql.Request(p) — передаём пул в конструктор.
// Если пул пуст — mssql автоматически создаст новое соединение
// (в пределах max pool size).
export async function request(): Promise<Request> {
    const p = await getPool();
    return new sql.Request(p);
}

// ============================================================
// Экспорт для использования в сервисах
// ============================================================

// sql — нужен для типов параметров: sql.NVarChar, sql.UniqueIdentifier
export { sql, type Request };
