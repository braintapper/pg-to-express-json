/*

 * DB Response

Currently for PG only.

Not quite an ORM, but used for CRUD operations against a PG database.

Will create appropriate queries to a subject area and return an object to a response.json method.

## Dependencies

* pg
* sugar (mainly for array and object ops)

 */
var PgToExpressJson, Sugar;

Sugar = require('sugar');

Sugar.extend();

PgToExpressJson = (function() {
  class PgToExpressJson {
    
    // This can be a sub select statement, and controlled with a case statement
    tablename(context) {
      switch (context) {
        case "select":
        case "selectOne":
          return "(select * from tablename1 join tablename2 on tablename1.id = tablename2.id)";
        case "insert":
        case "update":
        case "delete":
          return "tablename1";
      }
    }

    constructor(config) {
      this.client = require('pg').Client;
      this.config = config;
    }

    collectionTransform(array) { // this is a list transform
      var that;
      that = this;
      return array.map(function(item) {
        return that.modelTransform(item);
      });
    }

    modelTransform(object) { // this is a model transform
      return object;
    }

    // validate the attributes of the object
    validate(obj) {
      return {
        pass: true,
        errors: {}
      };
    }

    // match the attributes of the object to the attribute whitelist
    matchAttributes(obj) {
      return this.attribute_whitelist.intersect(Object.keys(obj));
    }

    // match the values of the object to the matched attributes
    matchValues(obj) {
      var output;
      output = [];
      this.matchAttributes(obj).exclude(this.id).forEach(function(item) {
        return output.push(obj[item]);
      });
      output.push(obj['id']);
      return output;
    }

    // todo: allow selection of limited attributes
    selectQuery() {
      return `select * from ${this.tablename('select')}`;
    }

    // todo: allow selection of limited attributes
    selectOneQuery() {
      return `select * from ${this.tablename('selectOne')} where id = $1`;
    }

    updateQuery(obj) {
      var set, sql, updateAttributes;
      updateAttributes = this.matchAttributes(obj).exclude(this.id);
      set = updateAttributes.map(function(item, index) {
        return `${item} = $${index + 1}`;
      });
      sql = `update ${this.tablename('update')} set ${set.join(',')} where id=$${updateAttributes.length + 1}`;
      return sql;
    }

    insertQuery(obj) {
      return `insert into ${this.tablename('insert')} (${matchAttributes(obj).join(',')}) values (${matchValues(obj).join(',')})`;
    }

    deleteQuery(obj) {
      return `delete from ${this.tablename('insert')} where id = $1`;
    }

    select(response) {
      var client, that;
      that = this;
      client = new this.client(this.config.database);
      client.connect();
      return client.query(this.selectQuery()).then(function(result) {
        if (result != null) {
          return response.json({
            data: that.collectionTransform(result.rows),
            error: false
          });
        } else {
          return response.json({
            data: [],
            error: true,
            e: "No result returned"
          });
        }
      }).catch(function(err) {
        if (err != null) {
          return response.json({
            data: [],
            error: true,
            e: err
          });
        }
      });
    }

    selectOne(id, response) {
      var client, that;
      that = this;
      client = new this.client(this.config.database);
      client.connect();
      return client.query(this.selectOneQuery(), [id]).then(function(result) {
        if (result != null) {
          return response.json({
            data: that.modelTransform(result.rows[0]),
            error: false
          });
        } else {
          return response.json({
            data: {},
            error: true,
            e: "No result returned"
          });
        }
      }).catch(function(err) {
        if (err != null) {
          return response.json({
            data: {},
            error: true,
            e: err
          });
        }
      });
    }

    insert(object, response) {
      var client, that, valid;
      that = this;
      valid = this.validate(object);
      if (valid.pass) {
        client = new this.client(this.config.database);
        client.connect();
        return client.query(insertQuery(object), [id]).then(function(result) {
          if (result != null) {
            return response.json({
              data: result.rows[0],
              error: false
            });
          } else {
            return response.json({
              data: {},
              error: true,
              e: "No result returned"
            });
          }
        }).catch(function(err) {
          if (err != null) {
            return response.json({
              data: {},
              error: true,
              e: err
            });
          }
        });
      } else {
        return response.json({
          data: {},
          error: true,
          e: "validation failed"
        });
      }
    }

    update(object, response) {
      var client, that, valid;
      that = this;
      valid = this.validate(object);
      if (valid.pass) {
        client = new this.client(this.config.database);
        client.connect();
        return client.query(this.updateQuery(object), this.matchValues(object)).then(function(result) {
          if (result != null) {
            return that.selectOne(object.id, response);
          } else {
            return response.json({
              data: {},
              error: true,
              e: "Something might have gone wrong with the update"
            });
          }
        }).catch(function(err) {
          if (err != null) {
            return response.json({
              data: {},
              error: true,
              e: err
            });
          }
        });
      } else {
        return response.json({
          data: {},
          error: true,
          e: "validation failed"
        });
      }
    }

    delete(id, response) {
      var client;
      client = new this.client(this.config.database);
      client.connect();
      return client.query(this.deleteQuery(), [id]).then(function(result) {
        if (result != null) {
          return response.json({
            data: result.rows[0],
            error: false
          });
        } else {
          return response.json({
            data: {},
            error: true,
            e: "No result returned"
          });
        }
      }).catch(function(err) {
        if (err != null) {
          return response.json({
            data: {},
            error: true,
            e: err
          });
        }
      });
    }

  };

  PgToExpressJson.prototype.debug = false;

  PgToExpressJson.prototype.client = {};

  PgToExpressJson.prototype.config = {};

  PgToExpressJson.prototype.id = "id"; // attribute for id

  // todo: make this an object and by operation (selectOne, select, insert, update)
  PgToExpressJson.prototype.attribute_whitelist = [];

  PgToExpressJson.prototype.validations = {
    required: [],
    numeric: []
  };

  return PgToExpressJson;

}).call(this);

module.exports = PgToExpressJson;
