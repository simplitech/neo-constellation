export PROJECT_FOLDER=/home/ec2-user
export BUCKETNAME=brcomsimpli
sudo aws s3 sync s3://$BUCKETNAME/neo/config/ $PROJECT_FOLDER/neo-cli/neo-cli/bin/Release/netcoreapp2.0/
sudo chown -R ec2-user:ec2-user $PROJECT_FOLDER/neo-cli/neo-cli/