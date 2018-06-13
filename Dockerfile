FROM fholzer/nginx-brotli
MAINTAINER Jose Sousa <jose.sousa@xpand-it.com>

COPY ./dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE $PORT