#!/bin/bash
source /home/ec2-user/.bash_profile

cd /var/app

pm2 stop monochord
pm2 delete monochord

NODE_PORT=80 pm2 --name monochord start npm -- start
