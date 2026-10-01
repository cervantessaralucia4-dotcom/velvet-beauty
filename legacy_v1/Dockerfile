# ============================================================
#  VELVET BEAUTY — Dockerfile (PHP 8.3 + Apache)
# ============================================================

FROM php:8.3-apache

# Extensiones necesarias
RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg-dev libwebp-dev \
    ca-certificates \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_mysql gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Habilitar mod_rewrite para el router
RUN a2enmod rewrite

# Configuración de Apache
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Copiar código del backend
COPY backend/ /var/www/html/
COPY uploads/  /var/www/html/uploads/

# Permisos para uploads
RUN mkdir -p /var/www/html/uploads/comprobantes \
             /var/www/html/uploads/productos \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 775 /var/www/html/uploads

# PHP settings
COPY docker/php.ini /usr/local/etc/php/conf.d/velvet.ini

EXPOSE 80

CMD ["apache2-foreground"]
