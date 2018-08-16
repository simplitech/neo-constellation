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
 
   regionList = await API.getRegionList()
   
   for (let i = 0; i < regionList.length; i++) {
    region = regionList[i]
    var regionalEC2 = API.getEC2(region)
    _promiseList.push(_getNodesPerRegion(regionalEC2, region))
   }

   var values = await Promise.all(_promiseList)

   values.forEach(v => {
    if (v[1].length > 0) {
      v[1].forEach(e => {
        if (e.Instances && e.Instances.length > 0) {
          e.Instances.forEach(i => {
            _nodeList.push([v[0], i.InstanceId])
          })
        }
      })
    }
  })

   return _nodeList
 }

function _init(networkId) {

  _networkId = networkId
  _EC2 = API.getEC2()

  instanceParams.Filters[0].Values = [networkId.toString()]

}

async function _getNodesPerRegion(regionalEC2, region) {
  var data = await regionalEC2.describeInstances(instanceParams).promise()
  return [region, data.Reservations]
}