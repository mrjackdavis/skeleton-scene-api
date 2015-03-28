# Skeleton Scene API

HTTP API for skeleton scene

## Developing

### Dependencies

 - NodeJS & NPM
 - gulp

### Getting started

First things first, once you've cloned the repository do

    npm install

Then check out what gulp tasks are available to you

    gulp --tasks

### Using Docker

Build image with this command

    docker build -t mrjackdavis/skeleton-scene-api .

And run like so

    docker run --name skl-api -p 8080:8080 -d mrjackdavis/skeleton-scene-api