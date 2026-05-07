FROM php:8.2-fpm-alpine

RUN docker-php-ext-install pdo_mysql mysqli

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/kongling-server

COPY . .

RUN chown -R www-data:www-data /var/www/kongling-server

EXPOSE 9000

CMD ["php-fpm"]
