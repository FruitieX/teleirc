FROM node:argon

USER root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libicu-dev && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install -g teleirc && npm cache clear

RUN useradd -ms /bin/bash teleirc
USER teleirc

RUN mkdir -p /home/teleirc/.teleirc
VOLUME ["/home/teleirc/.teleirc"]

EXPOSE 9090

CMD ["teleirc"]

