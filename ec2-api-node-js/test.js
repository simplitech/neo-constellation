var aws = require('./api_default')
var builder = require('./create_node')
var reader = require('./list_node')
var controller = require('./control_node')

var microtime = require('microtime')

async function test() {

    aws.login({accessKeyId:"a", secretAccessKey: "a"})

    var data = await builder.create(1, "sa-east-1", "jplippi")
    var id = data.Instances[0].InstanceId
    console.log("Data: ")
    console.log(data)
    console.log("Id:")
    console.log(id)

    var list = await reader.list(1)
    console.log("List:")
    console.log(list)

}

test()