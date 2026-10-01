<?php
// ============================================================
//  VELVET BEAUTY — API: /api/upload
//  POST /api/upload/comprobante  → subir comprobante de pago
//  POST /api/upload/producto     → subir imagen de producto [admin]
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Método no permitido', 405);

$pdo    = Database::connect();
$path   = $_SERVER['PATH_INFO'] ?? '';
$parts  = array_values(array_filter(explode('/', $path)));
$action = $parts[1] ?? '';

// ── Comprobante de pago (público, requiere pedido_id) ─────────
if ($action === 'comprobante') {
    $pedidoId = (int)($_POST['pedido_id'] ?? 0);
    if ($pedidoId <= 0) jsonError('pedido_id requerido');

    // Verificar que el pedido existe
    $stmt = $pdo->prepare('SELECT id FROM pedidos WHERE id = ?');
    $stmt->execute([$pedidoId]);
    if (!$stmt->fetch()) jsonError('Pedido no encontrado', 404);

    if (empty($_FILES['comprobante'])) jsonError('Archivo requerido');
    $file = $_FILES['comprobante'];

    validateAndSaveFile($file, 'comprobantes', function(string $filename, string $ext) use ($pdo, $pedidoId) {
        // Upsert comprobante
        $pdo->prepare('
            INSERT INTO comprobantes (pedido_id, archivo, tipo_archivo)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE archivo = VALUES(archivo), tipo_archivo = VALUES(tipo_archivo), verificado = 0
        ')->execute([$pedidoId, $filename, $ext]);

        jsonSuccess(['archivo' => $filename], 'Comprobante subido correctamente');
    });
}

// ── Imagen de producto [admin] ────────────────────────────────
if ($action === 'producto') {
    requireAdmin();
    if (empty($_FILES['imagen'])) jsonError('Archivo requerido');

    validateAndSaveFile($_FILES['imagen'], 'productos', function(string $filename) {
        jsonSuccess(['url' => '/uploads/productos/' . $filename], 'Imagen subida');
    });
}

jsonError('Endpoint no encontrado', 404);

// ── Función de validación y guardado ─────────────────────────
function validateAndSaveFile(array $file, string $folder, callable $onSuccess): never
{
    $maxSize  = 5 * 1024 * 1024; // 5 MB
    $allowed  = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    $extMap   = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'application/pdf' => 'pdf'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonError('Error al subir el archivo (código: ' . $file['error'] . ')');
    }
    if ($file['size'] > $maxSize) {
        jsonError('El archivo supera el límite de 5 MB');
    }

    // Verificar MIME real con finfo
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);
    if (!in_array($mime, $allowed, true)) {
        jsonError('Tipo de archivo no permitido. Use JPG, PNG, WEBP o PDF');
    }

    $ext      = $extMap[$mime];
    $filename = uniqid('vb_', true) . '.' . $ext;
    $dir      = __DIR__ . '/../../uploads/' . $folder . '/';

    if (!is_dir($dir)) mkdir($dir, 0755, true);

    if (!move_uploaded_file($file['tmp_name'], $dir . $filename)) {
        jsonError('No se pudo guardar el archivo', 500);
    }

    $onSuccess($filename, $ext);
}
