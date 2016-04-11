FROM node:argon

USER root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libicu-dev

RUN npm install -g teleirc

RUN useradd -ms /bin/bash teleirc
USER teleirc

RUN mkdir -p /home/teleirc/.teleirc
VOLUME ["/home/teleirc/.teleirc"]

EXPOSE 9090

CMD ["teleirc"]

