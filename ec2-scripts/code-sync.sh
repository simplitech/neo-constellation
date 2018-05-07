rm -rf /home/ec2-user/temp/
git clone $NODESRC /home/ec2-user/temp/
mv -bfv /home/ec2-user/temp/* /home/ec2-user/neo-cli/
find / -name "*~" -exec rm -rf {} \;
/home/ec2-user/dotnet/dotnet restore /home/ec2-user/neo-cli/
/home/ec2-user/dotnet/dotnet publish -c Release /home/ec2-user/neo-cli/