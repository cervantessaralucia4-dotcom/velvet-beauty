<?php
// ============================================================
//  VELVET BEAUTY — Middleware de autenticación (Admin)
//  Usa JWT simple sin librería externa (HS256)
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../config/helpers.php';

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    $rem = strlen($data) % 4;
    if ($rem) $data .= str_repeat('=', 4 - $rem);
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateJWT(array $payload): string
{
    $secret  = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?? 'velvet_secret_key_change_me';
    $header  = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + 3600 * 8;  // 8 horas
    $body    = base64UrlEncode(json_encode($payload));
    $sig     = base64UrlEncode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));
    return "{$header}.{$body}.{$sig}";
}

function verifyJWT(string $token): ?array
{
    $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?? 'velvet_secret_key_change_me';
    $parts  = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $body, $sig] = $parts;
    $expected = base64UrlEncode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));
    if (!hash_equals($expected, $sig)) return null;

    $payload = json_decode(base64UrlDecode($body), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return null;

    return $payload;
}

function requireAdmin(): array
{
    $auth  = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_starts_with($auth, 'Bearer ') ? substr($auth, 7) : '';

    if ($token === '') {
        jsonError('No autorizado — token requerido', 401);
    }

    $payload = verifyJWT($token);
    if ($payload === null) {
        jsonError('Token inválido o expirado', 401);
    }

    return $payload;
}
