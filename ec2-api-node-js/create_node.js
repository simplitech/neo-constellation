module.exports.create = createNode

// Load the SDK
var AWS = require('aws-sdk')
var EC2

var _region
var _networkId
var _groupName

var instanceParams = {
  BlockDeviceMappings: [
    {
      DeviceName: "/dev/sda1",
      Ebs: {
        DeleteOnTermination: true,
      }
    }
  ],
  ImageId: '',
  InstanceType: 't2.micro',
  KeyName: 'NeoNode',
  SecurityGroupIds: [],
  MinCount: 1,
  MaxCount: 1,
  TagSpecifications: [
    {
      ResourceType: "instance", 
      Tags: [
        {
          Key: "NetworkId", 
          Value: ''
        }
      ]
    }
  ]
}
var vpcGetParams = {
  Filters: [
    {
      Name: 'isDefault',
      Values: ['true']
    }
  ]
}
var sgGetParams = {
  Filters:[
    {
      Name: 'group-name',
      Values: []
    }
  ]
}
var sgCreateParams = {
  GroupName: '',
  Description: ''
}
var amiGetParams = {
  Filters: [
    {
      Name: 'name',
      Values: ['ubuntu-xenial-16.04-amd64-server-dotnetcore-2018.03.27']
    }
  ]
}

async function createNode(networkId, region) {

  _init(networkId, region)

  var values = await Promise.all([_getAmiId(), _getSecurityGroup()])
  instanceParams.ImageId = values[0]
  instanceParams.SecurityGroupIds = [values[1]]

  return await _runInstance()
}

function _init(networkId, region) {

  _region = region
  _networkId = networkId
  _groupName = `network-${_networkId}-sg`

  instanceParams.TagSpecifications[0].Tags[0].Value = _networkId.toString()

  sgGetParams.Filters[0].Values = [_groupName]

  sgCreateParams.GroupName = _groupName
  sgCreateParams.Description = _groupName

  AWS.config.update({
    region: _region
  })

  EC2 = new AWS.EC2()

}

async function _runInstance() {
  var data = await EC2.runInstances(instanceParams).promise()
  var instanceId = data.Instances[0].InstanceId
  console.log(`Created instance #${instanceId}`)
  return instanceId
}

async function _createSecurityGroup() {

  sgCreateParams.VpcId = await _getDefaultVpc()

  var data = await EC2.createSecurityGroup(sgCreateParams).promise()
  return data.GroupId
}

async function _getDefaultVpc() {
  var data = await EC2.describeVpcs(vpcGetParams).promise()
  return data.Vpcs[0].VpcId
}

async function _getSecurityGroup() {
  var data = await EC2.describeSecurityGroups(sgGetParams).promise()
  if(data.SecurityGroups && data.SecurityGroups.length > 0){
    return data.SecurityGroups[0].GroupId
  } else {
    return await _createSecurityGroup()
  }
}

async function _getAmiId() {
  var data = await EC2.describeImages(amiGetParams).promise()
  return data.Images[0].ImageId
}