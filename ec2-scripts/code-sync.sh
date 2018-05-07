export PROJECT_FOLDER=/home/ec2-user  
export HOME=/home/ec2-user 
rm -rf $PROJECT_FOLDER/temp
git clone $NODESRC $PROJECT_FOLDER/temp/
rm -rf $PROJECT_FOLDER/neo-cli/
mkdir $PROJECT_FOLDER/neo-cli/
mv -bfv $PROJECT_FOLDER/temp/* $PROJECT_FOLDER/neo-cli/
find $PROJECT_FOLDER -name "*~" -exec rm -rf {} \;
$PROJECT_FOLDER/dotnet/dotnet restore $PROJECT_FOLDER/neo-cli/
$PROJECT_FOLDER/dotnet/dotnet publish -c Release $PROJECT_FOLDER/neo-cli/
chown -R ec2-user:ec2-user $PROJECT_FOLDER