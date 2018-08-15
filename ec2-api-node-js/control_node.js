module.exports.off = turnOff
module.exports.on = turnOn

// Load the SDK
var AWS = require('aws-sdk')
var EC2

var _region
var _nodeList = []

var instanceParams = {
  InstanceIds: []
}

var waitParams = {
  Filters: [
    {
      Name: "instance-id",
      Values: []
    }
  ] 
}
 
async function turnOff(nodeId, region) {
 
  _init(nodeId, region)
 
  await _stopInstance()
   
 }

async function turnOn(nodeId, region) {

  _init(nodeId, region)

  await _startInstance()

}

function _init(nodeId, region) {

  _region = region
  instanceParams.InstanceIds = [nodeId]
  waitParams.Filters[0].Values = [nodeId]

  AWS.config.update({
    region: _region
  })

  EC2 = new AWS.EC2()

}

async function _startInstance() {
  var data = await EC2.startInstances(instanceParams).promise()
  console.log("current:" + data.StartingInstances[0].CurrentState.Name + ", " + "previous:" +  data.StartingInstances[0].PreviousState.Name)
  var data = await EC2.waitFor('instanceRunning',waitParams).promise()
  console.log("Running.")
}

async function _stopInstance() {

  var data = await EC2.stopInstances(instanceParams).promise()
  console.log("current:" + data.StoppingInstances[0].CurrentState.Name + ", " + "previous:" +  data.StoppingInstances[0].PreviousState.Name)
  var data = await EC2.waitFor('instanceStopped',waitParams).promise()
  console.log("Stopped.")
}