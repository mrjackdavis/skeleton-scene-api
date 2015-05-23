# Skeleton Scene API [![Code Climate](https://codeclimate.com/github/mrjackdavis/skeleton-scene-api/badges/gpa.svg)](https://codeclimate.com/github/mrjackdavis/skeleton-scene-api)

HTTP API for skeleton scene

## Developing

### Dependencies

 - NodeJS & NPM
 - gulp

### Getting started

First things first, once you've cloned the repository do

    npm install

Then you'll need to setup your secrets, duplicate `./secrets_example.json` to `./secrets.json` and add your keys and secrets as required.

Then check out what gulp tasks are available to you

    gulp --tasks

### Using Docker

Build image with this command

    docker build -t mrjackdavis/skeleton-scene-api .

And run like so

    docker run --name skl-api -p 8080:8080 -d mrjackdavis/skeleton-scene-api

You'll need to include

    -e AWS_ACCESSKEYID="key" -e AWS_SECRETACCESSKEY="secret"

## Deployment

Firstly, you need to push the docker repository

    docker push mrjackdavis/skeleton-scene-api

Right now, we're using AWS Elastic Container Service, it should automagically pull the update. If not, you can go in manually and `docker pull mrjackdavis/skeleton-scene-api`.