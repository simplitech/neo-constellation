var builder = require('./create_node')
var reader = require('./list_node')
var controller = require('./control_node')

async function test() {
    var id = await builder.create(1, "us-east-1")
    var list = await reader.list(1)

    for (let i = 0; i < list.length; i++) {
        console.log(i, list[i])
    }

    await controller.off(id,"us-east-1")
    await controller.on(id,"us-east-1")
}

test()