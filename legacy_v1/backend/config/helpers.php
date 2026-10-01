<?php
// ============================================================
//  VELVET BEAUTY — Helpers de respuesta y CORS
// ============================================================

declare(strict_types=1);

function setCorsHeaders(): void
{
    $allowed = $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?? '*';
    header("Access-Control-Allow-Origin: {$allowed}");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
}

function jsonResponse(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonError(string $message, int $status = 400): never
{
    jsonResponse(['success' => false, 'error' => $message], $status);
}

function jsonSuccess(mixed $data = null, string $message = 'OK'): never
{
    jsonResponse(['success' => true, 'message' => $message, 'data' => $data]);
}

function getBody(): array
{
    $raw = file_get_contents('php://input');
    $body = json_decode($raw ?: '{}', true);
    return is_array($body) ? $body : [];
}

function sanitize(string $value): string
{
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

function slugify(string $text): string
{
    $text = mb_strtolower($text, 'UTF-8');
    $text = str_replace(['á','é','í','ó','ú','ñ','ü'], ['a','e','i','o','u','n','u'], $text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/[\s-]+/', '-', trim($text));
    return $text;
}

function paginate(array &$params): array
{
    $page  = max(1, (int)($params['page'] ?? 1));
    $limit = min(100, max(1, (int)($params['limit'] ?? 12)));
    return ['limit' => $limit, 'offset' => ($page - 1) * $limit, 'page' => $page];
}
