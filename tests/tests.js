
/*

 * Test table info

id - bigserial
name - varchar 1024
description - text
created_at timestamp w/tz
updated_at timestamp w/tz

 */
var DbResponse, TestTable, response, testConfig, testModel;

response = {
  json: function(output) {
    return console.log(output);
  }
};

testConfig = {
  "host": "192.168.1.10",
  "database": "test_db",
  "user": "test_user",
  "password": "test_pw",
  "port": 5432
};

DbResponse = require("../index.js");

TestTable = class TestTable extends DbResponse {
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

testModel = new TestTable(testConfig);

testModel.debug = true;

console.log(testModel);
