var API = require('./api_default')
module.exports.create = createNode

var _EC2
var _networkId
var _groupName
var _user

async function createNode(networkId, region, user) {

  _init(networkId, region, user)

  var values = await Promise.all([API.getAmiId(_EC2), API.getSecurityGroupByName(_groupName,_EC2), API.getKeyPair("NeoNode",_EC2)])
  
  var amiId = values[0]
  var securityGroupId = values[1]
  var keyPair = values[2]

  if(!securityGroupId){
    securityGroupId = await API.createSecurityGroup(_groupName, _EC2)
  }

  if(!keyPair){
    keyPair = await API.createKeyPair("NeoNode",_user, _EC2)
  }

  return await API.runInstance(networkId.toString(), securityGroupId, amiId, _EC2)
}

function _init(networkId, region, user) {

  _EC2 = API.getEC2(region)
  
  _networkId = networkId
  _groupName = `network-${_networkId}-sg`
  _user = user
}
