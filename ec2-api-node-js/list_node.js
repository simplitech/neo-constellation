var API = require('./api_default')
module.exports.list = listNodes

var _EC2
var _nodeList = []
var _promiseList = []

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
 
   result = await API.getRegionList()

   regionList = []

   result.Regions.forEach(r => {
    regionList.push(r.RegionName)
  })
   
   for (let i = 0; i < regionList.length; i++) {
    region = regionList[i]
    var regionalEC2 = API.getEC2(region)
    _promiseList.push(_getNodesPerRegion(regionalEC2, region))
   }

   return await Promise.all(_promiseList)

 }

function _init(networkId) {

  _networkId = networkId
  _EC2 = API.getEC2()

  instanceParams.Filters[0].Values = [networkId.toString()]

}

async function _getNodesPerRegion(regionalEC2, region) {
  var data = await regionalEC2.describeInstances(instanceParams).promise()
  return [region, data]
}