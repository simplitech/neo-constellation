export PROJECT_FOLDER=/home/ec2-user
export BUCKETNAME=brcomsimpli
sudo aws s3 sync s3://$BUCKETNAME/neo/config-dotnet/ $PROJECT_FOLDER/neo-cli/neo-cli/bin/Release/netcoreapp2.0/
sudo aws s3 sync s3://$BUCKETNAME/neo/config-python/ $PROJECT_FOLDER/neo-python/neo/data/
sudo chown -R ec2-user:ec2-user $PROJECT_FOLDER/