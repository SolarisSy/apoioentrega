FROM php:7.4-apache

# Configurar o DocumentRoot
ENV APACHE_DOCUMENT_ROOT /var/www/html

# Atualizar configuração do Apache
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Habilitar módulos necessários
RUN a2enmod rewrite headers

# Configurar permissões para todos os arquivos e diretórios
RUN mkdir -p /var/www/html/server/data && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Criar configuração personalizada do Apache
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/custom-permissions.conf

# Habilitar a configuração personalizada
RUN a2enconf custom-permissions

# Instalar e habilitar extensões do PHP
RUN docker-php-ext-install opcache

# Configurar timezone
RUN echo "date.timezone = America/Sao_Paulo" > /usr/local/etc/php/conf.d/timezone.ini

# Expor porta 80
EXPOSE 80 