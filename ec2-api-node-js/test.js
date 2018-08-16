var builder = require('./create_node')
var reader = require('./list_node')
var controller = require('./control_node')

var microtime = require('microtime')

async function test() {

    var now
    var elapsed

    now = microtime.now()/1000
    var id = await builder.create(1, "sa-east-1", "jplippi")
    elapsed = microtime.now()/1000 - now

    console.log("Time to create: " + elapsed + "ms.")

    now = microtime.now()/1000
    var list = await reader.list(1)
    elapsed = microtime.now()/1000 - now

    console.log("Time to list: " + elapsed + "ms.")

    for (let i = 0; i < list.length; i++) {
        console.log(list[i])
    }

    now = microtime.now()/1000
    await controller.off(id,"sa-east-1")
    elapsed = microtime.now()/1000 - now

    console.log("Time to turn off: " + elapsed + "ms.")

    now = microtime.now()/1000
    await controller.on(id,"sa-east-1")
    elapsed = microtime.now()/1000 - now

    console.log("Time to turn on: " + elapsed + "ms.")

}

test()