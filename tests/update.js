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

testModel.update({
  id: 2,
  name: "test_name 1",
  description: "test_description 1"
}, res);
