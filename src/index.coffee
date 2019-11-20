###

# DB Response

Currently for PG only.

Not quite an ORM, but used for CRUD operations against a PG database.

Will create appropriate queries to a subject area and return an object to a response.json method.

## Dependencies

* pg
* sugar (mainly for array and object ops)



###

Sugar = require('sugar')
Sugar.extend()



class PgToExpressJson

  client: {}
  config: {}

  id: "id" # attribute for id

  # This can be a sub select statement, and controlled with a case statement
  tablename: (context)->
    switch context
      when "select","selectOne"
        "(select * from tablename1 join tablename2 on tablename1.id = tablename2.id)"
      when "insert", "update", "delete"
        "tablename1"


  constructor: (config)->
    @client = require('pg').Client
    @config = config


  collectionTransform: (array)-> # this is a list transform
    that = @
    return array.map (item)->
      return that.modelTransform(item)

  modelTransform: (object)-> # this is a model transform
    return object


  # todo: make this an object and by operation (selectOne, select, insert, update)
  attribute_whitelist: []

  validations:
    required: []
    numeric: []

  # validate the attributes of the object
  validate: (obj)->
    return { pass: true, errors: {} }

  # match the attributes of the object to the attribute whitelist
  matchAttributes: (obj)->
    return @attribute_whitelist.intersect(Object.keys(obj))

  # match the values of the object to the matched attributes
  matchValues: (obj)->
    output = []
    @matchAttributes(obj).exclude(@id).forEach (item)->
      output.push obj[item]
    output.push obj['id']
    return output

  # todo: allow selection of limited attributes
  selectQuery: ()->
    "select * from #{@tablename('select')}"

  # todo: allow selection of limited attributes
  selectOneQuery: ()->
    "select * from #{@tablename('selectOne')} where id = $1"

  updateQuery: (obj)->
    updateAttributes = @matchAttributes(obj).exclude(@id)
    set = updateAttributes.map (item, index)->
      return "#{item} = $#{index + 1}"
    sql = "update #{@tablename('update')} set #{set.join(',')} where id=$#{updateAttributes.length + 1}"
    return sql

  insertQuery: (obj)->
    "insert into #{@tablename('insert')} (#{matchAttributes(obj).join(',')}) values (#{matchValues(obj).join(',')})"

  deleteQuery: (obj)->
    "delete from #{@tablename('insert')} where id = $1"

  select: (response)->
    that = @
    client = new @client(@config.database)
    client.connect()
    client.query @selectQuery()
    .then (result) ->
      if result?
        response.json { data: that.collectionTransform(result.rows), error: false }
      else
        response.json { data: [], error: true, e: "No result returned" }
    .catch (err)->
      if err?
        response.json { data: [], error: true, e: err }

  selectOne: (id, response)->
    that = @
    client = new @client(@config.database)
    client.connect()
    client.query @selectOneQuery(), [id]
    .then (result) ->
      if result?
        response.json { data: that.modelTransform(result.rows[0]), error: false }
      else
        response.json { data: {}, error: true, e: "No result returned" }
    .catch (err)->
      if err?
        response.json { data: {}, error: true, e: err }


  insert: (request, response)->
    that = @
    valid = @validate(object)
    if valid.pass
      client = new @client(@config.database)
      client.connect()
      client.query "insert #{@tablename} where id = $1", [id]
      .then (result) ->
        if result?
          response.json { data: result.rows[0], error: false }
        else
          response.json { data: {}, error: true, e: "No result returned" }
      .catch (err)->
        if err?
          response.json { data: {}, error: true, e: err }
    else
      response.json { data: {}, error: true, e: "validation failed" }

  update: (object, response)->
    that = @
    valid = @validate(object)
    if valid.pass
      client = new @client(@config.database)
      client.connect()
      client.query @updateQuery(object), @matchValues(object)
      .then (result) ->
        if result?
          that.selectOne object.id, response
        else
          response.json { data: {}, error: true, e: "Something might have gone wrong with the update" }
      .catch (err)->
        if err?
          response.json { data: {}, error: true, e: err }
    else
      response.json { data: {}, error: true, e: "validation failed" }

  delete: (id, response)->
    client = new @client(@config.database)
    client.connect()
    client.query @deleteQuery(), [id]
    .then (result) ->
      if result?
        response.json { data: result.rows[0], error: false }
      else
        response.json { data: {}, error: true, e: "No result returned" }
    .catch (err)->
      if err?
        response.json { data: {}, error: true, e: err }


module.exports = PgToExpressJson
