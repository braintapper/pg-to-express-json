# pg-to-express-json

Runs CRUD queries and returns a canned json response (res.json) for Express.

Not ready for use.

## Response format:
```
{
  data: [collection] / {item}
  error: true
  e: error object
}
```

## Usage

Examples are in Coffeescript

Express route:

```
express = require('express')
router = express.Router()

Resource = require('../../lib/resource.js')
config = require('../../config/env.json') # config for PG connection

router.get '/', (req, res) ->
  collection = new Resource(config)
  collection.select res

router.get '/:id', (req, res) ->
  item = new Resource(config)
  item.selectOne req.params.id, res

router.put '/:id', (req, res) ->
  item = new Resource(config)
  item.update req.body, res

router.post '/', (req, res) ->
  item = new Resource(config)
  item.insert req.body, res

router.delete '/', (req, res) ->
  item = new Resource(config)
  item.delete req.body, res

module.exports = router
```

resource.js

```
DbResponse = require "pg-to-express-json"

class Comment extends DbResponse

  tablename: (context)->
    switch context
      when "select", "selectOne"
        """
        (
          select
            c.*,
            u.first_name,
            u.last_name,
            u.email,
            u.organization,
            u.avatar
          from comments c
          left join users u on c.user_id = u.id
        ) comments
        """
      else
        "comments"

  attribute_whitelist: [
    "id"
    "tenant_id"
    "user_id"
    "project_id"
    "work_unit_id"
    "parent_id"
    "description"
    "depth"
    "ancestry"
    "name_ancestry"
  ]

module.exports = Comment

```



env.json
```
{
  "database": {
    "user": "user",
    "host": "database_server_host",
    "database": "database",
    "password": "password",
    "port": 5432
  }
}
```



## Overwiteable functions

Everything is overwritable, but these are the ones of particular interest:

tablename

validate

selectQuery

selectOneQuery

updateQuery

insertQuery

deleteQuery

## Options


## API

### select(response)

Returns an array of rows

### selectOne(id, response)

Returns an individual object

### insert (object, response)

Inserts an object

### update (object, response)

Updates an object

### delete(id, response)

Deletes an object
