#!/bin/bash
export NODESRC_DOTNET=https://github.com/neo-project/neo-cli.git
export NODESRC_PYTHON=https://github.com/CityOfZion/neo-python.git
export BUCKETNAME=brcomsimpli
/home/ec2-user/scripts/code-sync-dotnet.sh
/home/ec2-user/scripts/code-sync-python.sh
/home/ec2-user/scripts/aws-sync.sh

