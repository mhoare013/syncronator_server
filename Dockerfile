#From Node 9
FROM node:9

#Server Dir
WORKDIR /Syncronator_Server

#Install NPM packages
COPY package.json /Syncronator_Server
RUN npm install /Syncronator_Server --only=production
