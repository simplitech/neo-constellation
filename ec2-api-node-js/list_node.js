module.exports.list = listNodes

// Load the SDK
var AWS = require('aws-sdk')
var EC2

var _region
var _networkId
var _groupName
var _nodeList = []

var instanceParams = {
  Filters: [
     {
    Name: "tag:NetworkId", 
    Values: [
       ""
    ]
   }
  ]
 }
 
async function listNodes(networkId) {
 
   _init(networkId)
 
   regionList = await _getRegionList()
   
   for (let i = 0; i < regionList.length; i++) {
     region = regionList[i]
     var data = await _getNodesPerRegion(region)
 
     if (data[1].length > 0) {
       data[1].forEach(e => {
         if (e.Instances && e.Instances.length > 0) {
           e.Instances.forEach(i => {
             _nodeList.push([data[0], i.InstanceId])
           })
         }
       })
     }
   }
 
   for (let i = 0; i < _nodeList.length; i++) {
     console.log(i, _nodeList[i])
   }
 }

function _init(networkId) {

  _region = "us-east-2"
  _networkId = networkId
  _groupName = `network-${_networkId}-sg`
  instanceParams.Filters[0].Values = [networkId.toString()]

  AWS.config.update({
    region: _region
  })

  EC2 = new AWS.EC2()

}

function _changeRegion(region) {
  _region = region

  AWS.config.update({
    region: _region
  })

  EC2 = new AWS.EC2()
}

async function _getRegionList() {
  try {
    var data = await EC2.describeRegions().promise()
  
    result = []
  
    data.Regions.forEach(r => {
      result.push(r.RegionName)
    })
  
    return result
  }
  catch {
    console.log(err, err.stack)
  }
}

async function _getNodesPerRegion(region) {
  _changeRegion(region)
  var data = await EC2.describeInstances(instanceParams).promise()
  return [region, data.Reservations]
}