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

  debug: false
  client: {}
  config: {}
  date_format: "%Y-%m-%d %H:%M:%S"
  timestamps: true # add created_at, updated_at

  id: "id" # attribute for id

  constructor: (config)->
    pg = require('pg')
    pg.defaults.parseInt8 = true

    parseDate = (date)->
      return Date.create(date)
    [1082,1083,1114,1184].forEach (type)->
      pg.types.setTypeParser(type, parseDate)
    @client = pg.Client
    @config = config


  # This can be a sub select statement, and controlled with a case statement
  tablename: (context)->
    switch context
      when "select","selectOne"
        "(select * from tablename1 join tablename2 on tablename1.id = tablename2.id)"
      when "insert", "update", "delete"
        "tablename1"


  collectionTransform: (array)-> # this is a list transform
    that = @
    return array.map (item)->
      return that.modelTransform(item)

  modelTransform: (object)-> # this is a model transform
    return object

  attributes: [] # exclude id, created_at, updated_at

  attribute_whitelist: (context)->
    attributes = @attributes.clone()

    switch context
      when "select", "selectOne"
        attributes.subtract []
      else
        attributes.subtract []

  validations:
    required: []
    numeric: []

  # validate the attributes of the object
  validate: (obj)->
    return { pass: true, errors: {} }

  # match the attributes of the object to the attribute whitelist
  matchAttributes: (context,obj)->
    return @attribute_whitelist(context).intersect(Object.keys(obj))

  # match the values of the object to the matched attributes
  matchValues: (context,obj)->
    output = []
    @matchAttributes(context,obj).exclude(@id).forEach (item)->
      output.push obj[item]
    switch context
      when "insert"
        if @timestamps
          output.push Date.create().format(@date_format)
          output.push Date.create().format(@date_format)
      when "update"
        if @timestamps
          output.push Date.create().format(@date_format)
        output.push obj['id']
    return output

  matchParameters: (context,obj)->
    output = []
    @matchAttributes(context,obj).exclude(@id).forEach (item, index)->
      output.push "$#{index + 1}"
    if context == "update"
      output.push obj['id']
    return output

  # todo: allow selection of limited attributes
  selectQuery: ()->
    "select * from #{@tablename('select')}"

  # todo: allow selection of limited attributes
  selectOneQuery: ()->
    "select * from #{@tablename('selectOne')} where id = $1"

  updateQuery: (obj)->
    attributes = @matchAttributes('update',obj).exclude(@id)
    if @timestamps
      attributes.append ["updated_at"]
    set = attributes.map (item, index)->
      return "#{item} = $#{index + 1}"
    sql = "update #{@tablename('update')} set #{set.join(',')} where id=$#{attributes.length + 1} returning *"
    return sql

  insertQuery: (obj)->
    attributes = @matchAttributes('insert',obj)
    parameters = @matchParameters('insert',obj)
    parameterCount = parameters.length
    if @timestamps
      attributes.append ["created_at","updated_at"]
      parameters.append ["$#{parameterCount + 1}","$#{parameterCount + 2}"]
    "insert into #{@tablename('insert')} (#{attributes.join(',')}) values (#{parameters.join(',')}) returning *"

  deleteQuery: (obj)->
    "delete from #{@tablename('insert')} where id = $1"

  select: (response)->
    that = @
    client = new @client(@config)
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
    .finally ()->
      client.end()
  selectOne: (id, response)->
    that = @
    client = new @client(@config)
    client.connect()
    client.query @selectOneQuery(), [id]
    .then (result) ->
      if result?
        response.json { data: that.collectionTransform(result.rows), error: false }
      else
        response.json { data: {}, error: true, e: "No result returned" }
    .catch (err)->
      if err?
        response.json { data: {}, error: true, e: err }
    .finally ()->
      client.end()

  insert: (object, response)->
    that = @
    valid = @validate(object)
    if valid.pass
      client = new @client(@config)
      client.connect()
      client.query @insertQuery(object), @matchValues('insert',object)
      .then (result) ->
        if result?
          response.json { data: that.collectionTransform(result.rows), error: false }
        else
          response.json { data: {}, error: true, e: "No result returned" }
      .catch (err)->
        if err?
          response.json { data: {}, error: true, e: err }
      .finally ()->
        client.end()
    else
      response.json { data: {}, error: true, e: "validation failed" }

  update: (object, response)->
    that = @
    valid = @validate(object)
    if valid.pass
      client = new @client(@config)
      client.connect()
      client.query @updateQuery(object), @matchValues('update',object)
      .then (result) ->
        if result?
          response.json { data: that.collectionTransform(result.rows), error: false }
          #that.selectOne object.id, response
        else
          response.json { data: {}, error: true, e: "Something might have gone wrong with the update" }
      .catch (err)->
        if err?
          response.json { data: {}, error: true, e: err }
      .finally ()->
        client.end()
    else
      response.json { data: {}, error: true, e: "validation failed" }

  delete: (id, response)->
    client = new @client(@config)
    client.connect()
    client.query @deleteQuery(), [id]
    .then (result) ->
      if result?
        response.json { data: { rows: result.rowCount }, error: false }
      else
        response.json { data: {}, error: true, e: "No result returned" }
    .catch (err)->
      if err?
        response.json { data: {}, error: true, e: err }
    .finally ()->
      client.end()


module.exports = PgToExpressJson
