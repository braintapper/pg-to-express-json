response =
  json: (output)->
    console.log output

testDb =
  "host": "192.168.1.10"
  "database": "test_db"
  "user": "test_user"
  "password": "test_pw"
  "port": 5432

###

# Test table info

id - bigserial
name - varchar 1024
description - text
created_at timestamp w/tz
updated_at timestamp w/tz

###

DbResponse = require "../index.js"


class TestTable extends DbResponse
  tablename: (context)->
    switch context
      when "select", "selectOne"
        """
        (
          select
            t.*,
            t.name
          from test_table t
        ) test_table
        """
      else
        "test_table"

testModel = new TestTable



console.log testModel
