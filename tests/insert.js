
/*

 * Test table info

id - bigserial
name - varchar 1024
description - text
created_at timestamp w/tz
updated_at timestamp w/tz

 */
var Model, fs, res, response, testConfig, testModel;

fs = require("fs-extra");

response = {
  json: function(output) {
    return console.log(output);
  }
};

testConfig = fs.readJsonSync("./tests/config.json");

Model = require("./model.js");

testModel = new Model(testConfig);

testModel.debug = true;

res = {
  json: function(output) {
    console.log("output");
    return console.log(output);
  }
};

testModel.insert({
  name: "test_name",
  description: "test_description"
}, res);
