
/*

 * Test table info

id - bigserial
name - varchar 1024
description - text
created_at timestamp w/tz
updated_at timestamp w/tz

 */
var DbResponse, Model;

DbResponse = require("../index.js");

Model = (function() {
  class Model extends DbResponse {
    tablename(context) {
      switch (context) {
        case "select":
        case "selectOne":
          return "(\n  select\n    t.*,\n    t.name\n  from test_table t\n) test_table";
        default:
          return "test_table";
      }
    }

  };

  Model.prototype.attributes = ["name", "description"];

  return Model;

}).call(this);

module.exports = Model;
