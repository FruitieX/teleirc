FROM node:8-slim

USER root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libicu-dev imagemagick webp && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install -g teleirc@0.4.8 && npm cache clear --force

USER node

RUN mkdir -p /home/node/.teleirc
VOLUME ["/home/node/.teleirc"]

EXPOSE 9090

CMD ["teleirc"]

