#!/bin/bash
# Script de despliegue para VPS Ubuntu 24.04
# Dominio: Uniondeprofesionales.com
# IP: 213.199.57.202
# Email: jsalazart3@miumg.edu.gt

set -e

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker y Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Instalar Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Instalar Certbot para Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Configurar firewall (opcional)
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Clonar el repositorio (ajusta la URL si es privada)
# git clone https://github.com/tuusuario/tu-repo.git /var/www/reporteria
# cd /var/www/reporteria

# Copiar archivos de configuración Nginx
sudo cp web/nginx.conf /etc/nginx/sites-available/reporteria.conf
sudo ln -sf /etc/nginx/sites-available/reporteria.conf /etc/nginx/sites-enabled/

# Probar configuración Nginx
sudo nginx -t
sudo systemctl reload nginx

# Solicitar certificado SSL
sudo certbot --nginx -d Uniondeprofesionales.com -d www.Uniondeprofesionales.com --email jsalazart3@miumg.edu.gt --agree-tos --redirect --non-interactive

# Levantar servicios con Docker Compose
sudo docker-compose up -d

echo "Despliegue completado. Accede a https://Uniondeprofesionales.com"
