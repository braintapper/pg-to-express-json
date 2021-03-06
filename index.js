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
    constructor(config) {
      var parseDate, pg;
      pg = require('pg');
      pg.defaults.parseInt8 = true;
      parseDate = function(date) {
        return Date.create(date);
      };
      [1082, 1083, 1114, 1184].forEach(function(type) {
        return pg.types.setTypeParser(type, parseDate);
      });
      this.client = pg.Client;
      this.config = config;
    }

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

    attribute_whitelist(context) {
      var attributes;
      attributes = this.attributes.clone();
      switch (context) {
        case "select":
        case "selectOne":
          return attributes.subtract([]);
        default:
          return attributes.subtract([]);
      }
    }

    // validate the attributes of the object
    validate(obj) {
      return {
        pass: true,
        errors: {}
      };
    }

    // match the attributes of the object to the attribute whitelist
    matchAttributes(context, obj) {
      return this.attribute_whitelist(context).intersect(Object.keys(obj));
    }

    // match the values of the object to the matched attributes
    matchValues(context, obj) {
      var output;
      output = [];
      this.matchAttributes(context, obj).exclude(this.id).forEach(function(item) {
        return output.push(obj[item]);
      });
      switch (context) {
        case "insert":
          if (this.timestamps) {
            output.push(Date.create().format(this.date_format));
            output.push(Date.create().format(this.date_format));
          }
          break;
        case "update":
          if (this.timestamps) {
            output.push(Date.create().format(this.date_format));
          }
          output.push(obj['id']);
      }
      return output;
    }

    matchParameters(context, obj) {
      var output;
      output = [];
      this.matchAttributes(context, obj).exclude(this.id).forEach(function(item, index) {
        return output.push(`$${index + 1}`);
      });
      if (context === "update") {
        output.push(obj['id']);
      }
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
      var attributes, set, sql;
      attributes = this.matchAttributes('update', obj).exclude(this.id);
      if (this.timestamps) {
        attributes.append(["updated_at"]);
      }
      set = attributes.map(function(item, index) {
        return `${item} = $${index + 1}`;
      });
      sql = `update ${this.tablename('update')} set ${set.join(',')} where id=$${attributes.length + 1} returning *`;
      return sql;
    }

    insertQuery(obj) {
      var attributes, parameterCount, parameters;
      attributes = this.matchAttributes('insert', obj);
      parameters = this.matchParameters('insert', obj);
      parameterCount = parameters.length;
      if (this.timestamps) {
        attributes.append(["created_at", "updated_at"]);
        parameters.append([`$${parameterCount + 1}`, `$${parameterCount + 2}`]);
      }
      return `insert into ${this.tablename('insert')} (${attributes.join(',')}) values (${parameters.join(',')}) returning *`;
    }

    deleteQuery(obj) {
      return `delete from ${this.tablename('insert')} where id = $1`;
    }

    select(request, response) {
      var client, that;
      that = this;
      client = new this.client(this.config);
      client.connect();
      return client.query(this.selectQuery()).then(function(result) {
        if (result != null) {
          return response.json(that.collectionTransform(result.rows));
        } else {
          return response.json([]);
        }
      }).catch(function(err) {
        if (err != null) {
          return response.json([]);
        }
      }).finally(function() {
        return client.end();
      });
    }

    selectOne(request, response) {
      var client, that;
      that = this;
      client = new this.client(this.config);
      client.connect();
      return client.query(this.selectOneQuery(), [request.params.id]).then(function(result) {
        if (result != null) {
          return response.json(that.collectionTransform(result.rows));
        } else {
          return response.json([]);
        }
      }).catch(function(err) {
        if (err != null) {
          return response.json([]);
        }
      }).finally(function() {
        return client.end();
      });
    }

    insert(request, response) {
      var client, that, valid;
      that = this;
      valid = this.validate(request.body);
      if (valid.pass) {
        client = new this.client(this.config);
        client.connect();
        return client.query(this.insertQuery(request.body), this.matchValues('insert', request.body)).then(function(result) {
          if (result != null) {
            return response.json(that.collectionTransform(result.rows));
          } else {
            return response.json([]);
          }
        }).catch(function(err) {
          if (err != null) {
            return response.json([]);
          }
        }).finally(function() {
          return client.end();
        });
      } else {
        return response.json({
          data: {},
          error: true,
          e: "validation failed"
        });
      }
    }

    update(request, response) {
      var client, that, valid;
      that = this;
      valid = this.validate(request.body);
      if (valid.pass) {
        client = new this.client(this.config);
        client.connect();
        return client.query(this.updateQuery(request.body), this.matchValues('update', object)).then(function(result) {
          if (result != null) {
            return response.json(that.collectionTransform(result.rows));
          } else {
            //that.selectOne object.id, response
            return response.json([]);
          }
        }).catch(function(err) {
          if (err != null) {
            return response.json([]);
          }
        }).finally(function() {
          return client.end();
        });
      } else {
        return response.json([]);
      }
    }

    delete(request, response) {
      var client;
      client = new this.client(this.config);
      client.connect();
      return client.query(this.deleteQuery(), [request.params.id]).then(function(result) {
        if (result != null) {
          return response.json([
            {
              rows: result.rowCount
            }
          ]);
        } else {
          return response.json([]);
        }
      }).catch(function(err) {
        if (err != null) {
          return response.json([]);
        }
      }).finally(function() {
        return client.end();
      });
    }

  };

  PgToExpressJson.prototype.debug = false;

  PgToExpressJson.prototype.client = {};

  PgToExpressJson.prototype.config = {};

  PgToExpressJson.prototype.date_format = "%Y-%m-%d %H:%M:%S";

  PgToExpressJson.prototype.timestamps = true; // add created_at, updated_at

  PgToExpressJson.prototype.id = "id"; // attribute for id

  PgToExpressJson.prototype.attributes = [];

  PgToExpressJson.prototype.validations = {
    required: [],
    numeric: []
  };

  return PgToExpressJson;

}).call(this);

module.exports = PgToExpressJson;
