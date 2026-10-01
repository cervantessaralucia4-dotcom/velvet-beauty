<?php
// ============================================================
//  VELVET BEAUTY — Configuración de Base de Datos
//  Variables de entorno → .env  (nunca hardcodear en producción)
// ============================================================

declare(strict_types=1);

class Database
{
    private static ?PDO $instance = null;

    public static function connect(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $host    = $_ENV['DB_HOST']     ?? getenv('DB_HOST')     ?? 'localhost';
        $port    = $_ENV['DB_PORT']     ?? getenv('DB_PORT')     ?? '3306';
        $name    = $_ENV['DB_NAME']     ?? getenv('DB_NAME')     ?? 'velvet_beauty';
        $user    = $_ENV['DB_USER']     ?? getenv('DB_USER')     ?? 'root';
        $pass    = $_ENV['DB_PASS']     ?? getenv('DB_PASS')     ?? '';
        $ssl_ca  = $_ENV['DB_SSL_CA']   ?? getenv('DB_SSL_CA')   ?? '';   // Aiven CA cert

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'",
        ];

        // SSL requerido por Aiven
        if ($ssl_ca !== '') {
            $options[PDO::MYSQL_ATTR_SSL_CA]     = $ssl_ca;
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        }

        try {
            self::$instance = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            http_response_code(503);
            die(json_encode(['error' => 'No se pudo conectar a la base de datos.']));
        }

        return self::$instance;
    }
}
