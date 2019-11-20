# pg-to-express-json

Runs CRUD queries and returns a canned json response (res.json) for Express.


## Response format:

{
  data: [] / {}
  error: true
  e: error object
}


## Usage




## Overwiteable functions

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
