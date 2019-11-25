DbResponse = require "../index.js"
###

# Test table info

id - bigserial
name - varchar 1024
description - text
created_at timestamp w/tz
updated_at timestamp w/tz

###
class Model extends DbResponse
  attributes: [
    "name",
    "description"
  ]
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

module.exports = Model
