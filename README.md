# Resource Watch Metadata Microservice

[![Build Status](https://travis-ci.org/resource-watch/rw_metadata.svg?branch=master)](https://travis-ci.org/resource-watch/rw_metadata)
[![Test Coverage](https://api.codeclimate.com/v1/badges/93b1d3c022b33c438ce1/test_coverage)](https://codeclimate.com/github/resource-watch/rw_metadata/test_coverage)

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
