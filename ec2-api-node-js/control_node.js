var API = require('./api_default')
module.exports.off = turnOff
module.exports.on = turnOn

var _EC2

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
  
  _EC2 = API.getEC2(region)

  instanceParams.InstanceIds = [nodeId]
  waitParams.Filters[0].Values = [nodeId]

}

async function _startInstance() {
  var data = await _EC2.startInstances(instanceParams).promise()
  console.log("Starting...")
  console.log("current:" + data.StartingInstances[0].CurrentState.Name + ", " + "previous:" +  data.StartingInstances[0].PreviousState.Name)
  var data = await _EC2.waitFor('instanceRunning',waitParams).promise()
  console.log("Running.")
}

async function _stopInstance() {

  var data = await _EC2.stopInstances(instanceParams).promise()
  console.log("Stopping...")
  console.log("current:" + data.StoppingInstances[0].CurrentState.Name + ", " + "previous:" +  data.StoppingInstances[0].PreviousState.Name)
  var data = await _EC2.waitFor('instanceStopped',waitParams).promise()
  console.log("Stopped.")
}