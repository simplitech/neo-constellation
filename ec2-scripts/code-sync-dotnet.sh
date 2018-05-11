export PROJECT_FOLDER=/home/ec2-user
export HOME=/home/ec2-user
export PROJECT_NAME=neo-cli
rm -rf $PROJECT_FOLDER/temp
git clone $NODESRC_DOTNET $PROJECT_FOLDER/temp/
rm -rf $PROJECT_FOLDER/$PROJECT_NAME/
mkdir $PROJECT_FOLDER/$PROJECT_NAME/
mv -bfv $PROJECT_FOLDER/temp/* $PROJECT_FOLDER/$PROJECT_NAME/
find $PROJECT_FOLDER -name "*~" -exec rm -rf {} \;
$PROJECT_FOLDER/dotnet/dotnet restore $PROJECT_FOLDER/neo-cli/
$PROJECT_FOLDER/dotnet/dotnet publish -c Release $PROJECT_FOLDER/neo-cli/
chown -R ec2-user:ec2-user $PROJECT_FOLDER