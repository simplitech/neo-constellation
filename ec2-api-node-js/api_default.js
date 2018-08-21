// Load the SDK
var _NodeRSA = require('node-rsa');
var _AWS = require('aws-sdk')
_AWS.config.update({
  region: "us-east-1"
})
var _EC2 = new _AWS.EC2()
var _S3 = new _AWS.S3()

module.exports.login = login
module.exports.getEC2 = getNewEC2FromRegion
module.exports.getS3 = getDefaultS3
module.exports.getRegionList = getRegionList
module.exports.getAmiId = getAmiId
module.exports.getSecurityGroupByName = getSecurityGroupByName
module.exports.createSecurityGroup = createSecurityGroup
module.exports.runInstance = runInstance
module.exports.createKeyPair = createKeyPair
module.exports.getKeyPair = getKeyPair


module.exports.testGetObject = _getObject

function login(credentials) {

  _AWS.config.update({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey
  })

}

function getNewEC2FromRegion(region) {

  // If no region provided, returns the default EC2 for "us-east-1"
  if (!region) {
    return _EC2
  }

  _AWS.config.update({
    region: region
  })

  return new _AWS.EC2()
}

function getDefaultS3() {
    return _S3
}

async function getRegionList() {
  return await _EC2.describeRegions().promise()
}

async function getAmiId(regionalEC2 = _EC2) {

  var params = {
    Filters: [
      {
        Name: 'name',
        Values: ['ubuntu-xenial-16.04-amd64-server-dotnetcore-2018.03.27']
      }
    ]
  }

  return await regionalEC2.describeImages(params).promise()
}

async function getSecurityGroupByName(name, regionalEC2 = _EC2) {

  var params = {
    Filters:[
      {
        Name: 'group-name',
        Values: [name]
      }
    ]
  }

  return await regionalEC2.describeSecurityGroups(params).promise()
}

async function createSecurityGroup(name, regionalEC2 = _EC2) {

  var vpcData = await _getDefaultVpc(regionalEC2)
  var vpcId = vpcData.Vpcs[0].VpcId 

  var params = {
    GroupName: name,
    Description: name,
    VpcId: vpcId
  }

  var data = await regionalEC2.createSecurityGroup(params).promise()
  return data
}

async function runInstance(networkId, securityGroupId, amiId, regionalEC2 = _EC2) {
  var params = {
    BlockDeviceMappings: [
      {
        DeviceName: "/dev/sda1",
        Ebs: {
          DeleteOnTermination: true,
        }
      }
    ],
    ImageId: amiId,
    InstanceType: 't2.micro',
    KeyName: 'NeoNode',
    SecurityGroupIds: [securityGroupId],
    MinCount: 1,
    MaxCount: 1,
    TagSpecifications: [
      {
        ResourceType: "instance", 
        Tags: [
          {
            Key: "NetworkId", 
            Value: networkId
          }
        ]
      }
    ]
  }

  return data = await regionalEC2.runInstances(params).promise()

  }

async function getKeyPair(name, regionalEC2) {
  var params = {
    Filters: [
      {
        Name: 'key-name',
        Values: [name]
      }
    ]
  }

  return await regionalEC2.describeKeyPairs(params).promise()

}

async function createKeyPair(name, user, regionalEC2) {
  var privateKey = await _getObject(name + ".pem", "neo-bucket-" + user).Body
  var data

  if (privateKey) {
    var publicKey = new _NodeRSA(privateKey).exportKey('public').slice(27,-25)
    
    var importParams = {
      KeyName: name,
      PublicKeyMaterial: publicKey
    }

    data = await regionalEC2.importKeyPair(importParams).promise()
  } else {

    var createParams = {
      KeyName: name
    }

    data = await regionalEC2.createKeyPair(createParams).promise()
    var privateKey = data.KeyMaterial

    await _createBucket("neo-bucket-" + user)
    await _putObject(name + ".pem", privateKey, "neo-bucket-" + user)
  }

  return data
}

// Internal functions

async function _getDefaultVpc(regionalEC2) {
  var params = {
    Filters: [
      {
        Name: 'isDefault',
        Values: ['true']
      }
    ]
  }

  var data = await regionalEC2.describeVpcs(params).promise()
  return data
}

async function _getObject(object, bucket) {
  try {
    var params = {
      Bucket: bucket, 
      Key: object
    }
    return data = await _S3.getObject(params).promise()
  }
  catch (error){
    if (error.code == "NoSuchBucket" || error.code == "NoSuchKey") {
      return undefined
    }
    throw error
  }
}

async function _putObject(name, object, bucket) {

  var params = {
    Body: object, 
    Bucket: bucket, 
    Key: name
   }

   var data = await _S3.putObject(params).promise()

   return data

}

async function _createBucket(bucket) {

  var params = {
    Bucket: bucket
  }

  var data = await _S3.createBucket(params).promise()

  return data
}
