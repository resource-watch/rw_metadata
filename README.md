# Resource Watch Metadata Microservice

This repository implements the metadata services that are available in the Resource Watch API.

If you are looking for the API Doc (Info and Usage) please go to the next link:
[View the documentation for this
API](http://gfw-api.github.io/swagger-ui/?url=https://raw.githubusercontent.com/resource-watch/rw_metadata/master/app/microservice/swagger.yml#/)

## Quick Overview

### Metadata Entity

```
dataset: <String>, required
app: <String>, required, [gfw, gfw-climate, prep, rw, forest-atlas]
resource: {
    id: <String>, required
    type: <String>, required, [dataset, widget, layer]
},
lang: <String>, required
name: <String>
description: <String>
source: <String>
citation: <String>
license: <String>
info: <Object>
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

### GetByIds Metadata

```
GET: /dataset/metadata/get-by-ids,
GET: /dataset/:dataset/widget/metadata/get-by-ids,
GET: /dataset/:dataset/layer/metadata/get-by-ids,
```

### POST, PATCH, DELETE

"app" and "lang" attributes are required and it is mandatory to include them in the payload.

### GET Queryparam Filters:

```
app: gfw, gfw-climate, prep, rw, forest-atlas (select one or some of them)
lang: select between available languages (select one or some of them)
limit: desired number
```

### CRUD Examples

#### Getting

```
GET: /dataset/111123/metadata
GET: /dataset/111123/widget/134599/metadata
GET: /dataset/111123/layer/134599/metadata
GET: /dataset/111123/metadata?app=rw&lang=es,en&limit=20
GET: /dataset/111123/widget/134599/metadata?app=rw,gfw&lang=en
GET: /dataset/111123/layer/134599/metadata?lang=en
```

#### Creating

```
POST: /dataset/111123/metadata, payload: {"app": "rw", "lang": "es"}
POST: /dataset/111123/widget/134599/metadata, payload: {"app": "rw", "lang": "es"}
POST: /dataset/111123/layer/134599/metadata, payload: {"app": "rw", "lang": "es"}
POST: /dataset/111123/layer/134599/metadata, payload: {"app": "rw", "lang": "es", "name": "M1", "info": {"a": "a", "b": "b"}}
```

#### Updating (partial)

```
PATCH: /dataset/111123/metadata, payload: {"app": "rw", "lang": "es"}
PATCH: /dataset/111123/widget/134599/metadata, payload: {"app": "rw", "lang": "es"}
PATCH: /dataset/111123/layer/134599/metadata, payload: {"app": "rw", "lang": "es"}
PATCH: /dataset/111123/layer/134599/metadata, payload: {"app": "rw", "lang": "es", "name": "M2", "info": {"a": "A", "b": "B"}}
```

#### Deleting

```
DELETE: /dataset/111123/metadata, payload: {"app": "rw", "lang": "es"}
DELETE: /dataset/111123/widget/134599/metadata, payload: {"app": "rw", "lang": "es"}
DELETE: /dataset/111123/layer/134599/metadata, payload: {"app": "rw", "lang": "es"}
DELETE: /dataset/111123/layer/134599/metadata, payload: {"app": "rw", "lang": "es", "name": "M2", "info": {"a": "A", "b": "B"}}
```

#### Getting All

```
GET: /metadata
GET: /metadata?app=rw&lang=es,en&limit=20
GET: /metadata?app=rw,gfw&lang=en
GET: /metadata?lang=en
```

#### Getting By Ids

"ids" queryparam is required, in other case the endpoint responses a 400 HTTP ERROR (Bad Request)

```
GET: /metadata/dataset/get-by-ids?ids=111123
GET: /metadata/dataset/get-by-ids?ids=111123&app=rw&lang=es,en&limit=20
GET: /metadata/dataset/widget/get-by-ids?ids=134599,134600,123301
GET: /metadata/dataset/widget/get-by-ids?ids=134599,134600,123301&app=rw,gfw&lang=es&limit=200
```

Ir order to contribute to this repo:

1. [Getting Started](#getting-started)
2. [Deployment](#deployment)

## Getting Started

### OS X

**First, make sure that you have the [API gateway running
locally](https://github.com/Vizzuality/api-gateway/tree/master#getting-started).**

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
