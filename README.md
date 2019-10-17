# Resource Watch Metadata Microservice

[![Build Status](https://travis-ci.org/resource-watch/rw_metadata.svg?branch=master)](https://travis-ci.org/resource-watch/rw_metadata)
[![Test Coverage](https://api.codeclimate.com/v1/badges/93b1d3c022b33c438ce1/test_coverage)](https://codeclimate.com/github/resource-watch/rw_metadata/test_coverage)


## Dependencies

You will need [Control Tower](https://github.com/control-tower/control-tower) up and running - either natively or with Docker. Refer to the project's README for information on how to set it up.

The Metadata microservice is built using [Node.js](https://nodejs.org/en/), and can be executed either natively or using Docker, each of which has its own set of requirements.

Native execution requires:
- [Node.js](https://nodejs.org/en/)
- [MongoDB](https://www.mongodb.com/)

Execution using Docker requires:
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Getting started

Start by cloning the repository from github to your execution environment

```
git clone https://github.com/resource-watch/rw_metadata.git && cd rw_metadata
```

After that, follow one of the instructions below:

### Using native execution

1 - Set up your environment variables. See `dev.env.sample` for a list of variables you should set, which are described in detail in [this section](#configuration-environment-variables) of the documentation. Native execution will NOT load the `dev.env` file content, so you need to use another way to define those values

2 - Install node dependencies using NPM:
```
npm install
```

3 - Start the application server:
```
npm start
```

The endpoints provided by this microservice should now be available through Control Tower's URL.

### Using Docker

1 - Create and complete your `dev.env` file with your configuration. The meaning of the variables is available in this [section](#configuration-environment-variables). You can find an example `dev.env.sample` file in the project root.

2 - Execute the following command to run Control tower:

```
./metadata.sh develop
```

The endpoints provided by this microservice should now be available through Control Tower's URL.

## Testing

There are two ways to run the included tests:

### Using native execution

Follow the instruction above for setting up the runtime environment for native execution, then run:
```
npm test
```

### Using Docker

Follow the instruction above for setting up the runtime environment for Docker execution, then run:
```
./metadata.sh test
```

## Configuration

### Environment variables

- PORT => TCP port in which the service will run
- NODE_PATH => relative path to the source code. Should be `app/src`
- CT_REGISTER_MODE => if `auto` the microservice automatically registers on Control Tower on start
- CT_TOKEN => 
- API_VERSION => API version identifier that prefixes the URL. Should be `v1`
- S3_ACCESS_KEY_ID => AWS S3 key id
- S3_SECRET_ACCESS_KEY => AWS S3 access key
- STAMPERY_TOKEN => Stampery token
- MONGO_PORT_27017_TCP_ADDR => IP/Address of the MongoDB server

This repository implements the metadata services that are available in the Resource Watch API.

If you are looking for the API Doc (Info and Usage) please go to the next link:
[View the documentation for this
API](http://gfw-api.github.io/swagger-ui/?url=https://raw.githubusercontent.com/resource-watch/rw_metadata/master/application/microservice/swagger.yml#/) (not yet)

## Quick Overview

### Metadata Entity

```
dataset: <String>, required
application: <String>, required
resource: {
    id: <String>, required
    type: <String>, required, [dataset, widget, layer]
},
language: <String>, required
name: <String>
description: <String>
source: <String>
citation: <String>
license: <String>
units: <Object>
info: <Object>
fields: <Object>
createdAt: <Date>
updatedAt: <Date>
status: <String>, [published, unpublished]
```

### Dataset Metadata

```
GET: /dataset/:dataset/metadata
POST: /dataset/:dataset/metadata
PATCH: /dataset/:dataset/metadata
DELETE: /dataset/:dataset/metadata
```

### Widget Metadata

```
GET: /dataset/:dataset/widget/:widget/metadata
POST: /dataset/:dataset/widget/:widget/metadata
PATCH: /dataset/:dataset/widget/:widget/metadata
DELETE: /dataset/:dataset/widget/:widget/metadata
```

### Layer Metadata

```
GET: /dataset/:dataset/layer/:layer/metadata
POST: /dataset/:dataset/layer/:layer/metadata
PATCH: /dataset/:dataset/layer/:layer/metadata
DELETE: /dataset/:dataset/layer/:layer/metadata
```

### GetAll Metadata

```
GET: /metadata
```

### FindByIds Metadata

```
POST: /dataset/metadata/find-by-ids
POST: /dataset/:dataset/widget/metadata/find-by-ids
POST: /dataset/:dataset/layer/metadata/find-by-ids
```

### POST, PATCH, DELETE

"application" and "language" attributes are required and it is mandatory to include them in the payload (when doing CRUD requests).
**This doesn't apply to the FindByIds Endpoints**

### GET Queryparam Filters:

```
application: gfw, gfw-climate, prep, rw, forest-atlas (select one or some of them)
language: select between available languages (select one or some of them)
limit: desired number
```

Custom param for /metadata endpoint
```
type: [dataset, widget, layer]
```

### CRUD Examples

#### Getting

```
GET: /dataset/111123/metadata
GET: /dataset/111123/widget/134599/metadata
GET: /dataset/111123/layer/134599/metadata
GET: /dataset/111123/metadata?application=rw&language=es,en&limit=20
GET: /dataset/111123/widget/134599/metadata?application=rw,gfw&language=en
GET: /dataset/111123/layer/134599/metadata?language=en
```

#### Creating

```
POST: /dataset/111123/metadata -> payload: {"application": "rw", "language": "es"}
POST: /dataset/111123/widget/134599/metadata -> payload: {"application": "rw", "language": "es"}
POST: /dataset/111123/layer/134599/metadata -> payload: {"application": "rw", "language": "es"}
POST: /dataset/111123/layer/134599/metadata -> payload: {"application": "rw", "language": "es", "name": "M1", "info": {"a": "a", "b": "b"}}
```

#### Updating (partial)

```
PATCH: /dataset/111123/metadata -> payload: {"application": "rw", "language": "es", "name": "M0", "info": {"a": "A", "b": "B"}}
PATCH: /dataset/111123/widget/134599/metadata -> payload: {"application": "rw", "language": "es", "name": "M1", "info": {"c": "C", "d": "D"}}
PATCH: /dataset/111123/layer/134599/metadata -> payload: {"application": "rw", "language": "es", "name": "M2", "info": {"e": "E", "f": "F"}}
PATCH: /dataset/111123/layer/134599/metadata -> payload: {"application": "rw", "language": "es", "name": "M3", "info": {"g": "G", "h": "H"}}
```

#### Deleting

```
DELETE: /dataset/111123/metadata?application=rw&language=en
DELETE: /dataset/111123/widget/134599/metadata?application=rw&language=es
DELETE: /dataset/111123/layer/134599/metadata?application=gfw&language=en
```

#### Getting All

```
GET: /metadata
GET: /metadata?type=dataset
GET: /metadata?type=widget
GET: /metadata?application=rw&language=es,en&limit=20
GET: /metadata?application=rw,gfw&language=en&type=dataset
GET: /metadata?language=en
```

#### Finding By Ids

"ids" property is required in the payload, in other case the endpoint responds a 400 HTTP ERROR (Bad Request)
This property can be an Array or a String (comma-separated)
payload -> {"ids": ["112313", "111123"]}
payload -> {"ids": "112313, 111123"}

```
POST: /dataset/metadata/find-by-ids -> payload: {"ids": ["112313", "111123"]}
POST: /dataset/metadata/find-by-ids?application=rw&language=es,en&limit=20 -> payload: {"ids": "112313, 111123"}
POST: /dataset/111123/widget/metadata/find-by-ids, -> payload: {"ids": "112313, 111123"}
POST: /dataset/111123/widget/metadata/find-by-ids?application=rw,gfw&language=es&limit=200 -> payload: {"ids": ["112313", "111123"]}
```

Ir order to contribute to this repo:

1. [Getting Started](#getting-started)
2. [Deployment](#deployment)

## Getting Started

### OS X

**First, make sure that you have the [API gateway running
locally](https://github.com/control-tower/control-tower).**

We're using Docker which, luckily for you, means that getting the
application running locally should be fairly painless. First, make sure
that you have [Docker Compose](https://docs.docker.com/compose/install/)
installed on your machine.

If you've not used Docker before, you may need to set up some defaults:

```
docker-machine create --driver virtualbox default
docker-machine start default
eval $(docker-machine env default)
```

You also need to configure an alias for your local machine:

Get your local IP:

```
ifconfig
```

Modify the /etc/hosts config file adding a new rule:
<your ip> mymachine
```
vim /etc/hosts
```

Now we're ready to actually get the application running:

```
git clone https://github.com/resource-watch/rw_metadata
cd rw_metadata
./metadata.sh develop
```

You can now access the microservice through the API gateway.

## Deployment

In progress...
