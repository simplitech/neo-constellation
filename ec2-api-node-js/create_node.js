module.exports.init = init
module.exports.create = createNode

// Load the SDK
var AWS = require('aws-sdk')
var EC2

var isInitialized = false

// Params required:
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

function init(networkId, region) {

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

  isInitialized = true
}

function createNode() {

  if(!isInitialized) {
    throw new Error("Builder not initialized")
  }

  EC2.waitFor('keyPairExists').promise

  vpcGetPromise = EC2.describeVpcs(vpcGetParams).promise()
  sgGetPromise = EC2.describeSecurityGroups(sgGetParams).promise()
  amiGetPromise = EC2.describeImages(amiGetParams).promise()
  
  Promise.all([vpcGetPromise,sgGetPromise,amiGetPromise])
  .then(
    function(values) {
      sgCreateParams.VpcId = values[0].Vpcs[0].VpcId
      instanceParams.ImageId = values[2].Images[0].ImageId

      if(values[1].SecurityGroups && values[1].SecurityGroups.length > 0){
        instanceParams.SecurityGroupIds = [values[1].SecurityGroups[0].GroupId]
        _runInstance()
      } else {
        sgSetPromise = EC2.createSecurityGroup(sgCreateParams).promise()

        sgSetPromise
        .then(
          function(data) {
            instanceParams.SecurityGroupIds = [data.GroupId]
            _runInstance()
          }
        )
        .catch(
          function(err){
            console.log(err, err.stack)
          }
        )
      }
    }
  )
  .catch(
    function(err) {
      console.log(err, err.stack)
    }
  )
}

function _runInstance() {
  EC2.runInstances(instanceParams).promise()
  .then(
    function(data){
      var instanceId = data.Instances[0].InstanceId
      console.log(`Created instance #${instanceId}`)
    }
    )
  .catch(
    function(err) {
      console.log(err, err.code, err.stack)
    }
  )
}