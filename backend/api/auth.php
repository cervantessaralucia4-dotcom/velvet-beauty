<?php
// ============================================================
//  VELVET BEAUTY — API: /api/auth
//  POST /api/auth/login   → login admin
//  POST /api/auth/logout  → logout (cliente invalida token)
//  GET  /api/auth/me      → info del admin logueado
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$pdo   = Database::connect();
$path  = $_SERVER['PATH_INFO'] ?? '';
$parts = array_values(array_filter(explode('/', $path)));
$action = $parts[1] ?? '';

// POST /api/auth/login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $b = getBody();
    if (empty($b['email']) || empty($b['password'])) {
        jsonError('Email y contraseña requeridos');
    }

    $stmt = $pdo->prepare('SELECT * FROM administradores WHERE email = ? AND activo = 1');
    $stmt->execute([sanitize($b['email'])]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($b['password'], $admin['password'])) {
        jsonError('Credenciales incorrectas', 401);
    }

    // Actualizar último login
    $pdo->prepare('UPDATE administradores SET ultimo_login = NOW() WHERE id = ?')
        ->execute([$admin['id']]);

    $token = generateJWT([
        'sub'  => $admin['id'],
        'name' => $admin['nombre'],
        'rol'  => $admin['rol'],
    ]);

    jsonSuccess([
        'token' => $token,
        'admin' => [
            'id'     => $admin['id'],
            'nombre' => $admin['nombre'],
            'email'  => $admin['email'],
            'rol'    => $admin['rol'],
        ],
    ], 'Login exitoso');
}

// GET /api/auth/me
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'me') {
    $payload = requireAdmin();
    $stmt = $pdo->prepare('SELECT id, nombre, email, rol, ultimo_login FROM administradores WHERE id = ?');
    $stmt->execute([$payload['sub']]);
    $admin = $stmt->fetch();
    if (!$admin) jsonError('Admin no encontrado', 404);
    jsonResponse($admin);
}

// POST /api/auth/logout
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    // JWT es stateless — el cliente simplemente elimina el token
    jsonSuccess(null, 'Sesión cerrada');
}

jsonError('Endpoint no encontrado', 404);
