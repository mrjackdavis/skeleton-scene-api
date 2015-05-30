# Skeleton Scene API [![Code Climate](https://codeclimate.com/github/mrjackdavis/skeleton-scene-api/badges/gpa.svg)](https://codeclimate.com/github/mrjackdavis/skeleton-scene-api)

HTTP API for skeleton scene

## Developing

### Dependencies

 - NodeJS & NPM
 - gulp

### Getting started

First things first, once you've cloned the repository do

    npm install

Then you need to set your environment variables

    export AWS_ACCESSKEYID="secret"
    export AWS_SECRETACCESSKEY="secret"
    export MYSQL_CONNECTION_URL="mysql://username:password@host:port/database"

Then check out what gulp tasks are available to you

    gulp --tasks

### Using Docker

Build image with this command

    docker build -t mrjackdavis/skeleton-scene-api .

And run like so, please note both container linking to a `mysql` docker container and the AWS credentials.

    docker run --name skl-api -p 8080:8080 --link amysqldb:mysql -e AWS_ACCESSKEYID="key" -e AWS_SECRETACCESSKEY="secret" -e MYSQL_DB_NAME="test_db" -d mrjackdavis/skeleton-scene-api

If you don't feel like linking a `mysql` container, you can set the environment variable `MYSQL_CONNECTION_URL`, to a url with the format `mysql://username:password@host:port/database`, eg `mysql://root:apass@localhost:49153/test_db`

## Deployment

Firstly, you need to push the docker repository

    docker push mrjackdavis/skeleton-scene-api

Right now, we're using AWS Elastic Container Service, it should automagically pull the update. If not, you can go in manually and `docker pull mrjackdavis/skeleton-scene-api`.