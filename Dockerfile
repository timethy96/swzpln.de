FROM php:apache

# Enable mod_headers
RUN a2enmod headers
RUN a2enmod rewrite

# Copy custom Apache configuration file
COPY apache2.conf /etc/apache2/apache2.conf

# Copy your website files
COPY html/ /var/www/html/