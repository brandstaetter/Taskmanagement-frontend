#!/bin/bash

# Configuration
SERVER_USER="your-username"
SERVER_IP="your-server-ip"
DEPLOY_PATH="/var/www/taskmanagement"

# Build the application
echo "Building application..."
npm run build:prod

# Deploy to server
echo "Deploying to server..."
rsync -avz --delete dist/frontend/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH

# Set permissions
echo "Setting permissions..."
ssh $SERVER_USER@$SERVER_IP "sudo chown -R www-data:www-data $DEPLOY_PATH && sudo chmod -R 755 $DEPLOY_PATH"

# Reload Nginx
echo "Reloading Nginx..."
ssh $SERVER_USER@$SERVER_IP "sudo nginx -t && sudo systemctl reload nginx"

echo "Deployment complete!"
