fs = require("fs-extra")

response =
  json: (output)->
    console.log output

testConfig = fs.readJsonSync "./tests/config.json"




Model = require "./model.js"



testModel = new Model(testConfig)
testModel.debug = true

res =
  json: (output)->
    console.log "output"
    console.log output

testModel.selectOne 1, res
