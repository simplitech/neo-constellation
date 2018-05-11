export PROJECT_FOLDER=/home/ec2-user  
export HOME=/home/ec2-user 
export PROJECT_NAME=neo-python
rm -rf $PROJECT_FOLDER/temp
git clone $NODESRC_PYTHON $PROJECT_FOLDER/temp/
rm -rf $PROJECT_FOLDER/$PROJECT_NAME/
mkdir $PROJECT_FOLDER/$PROJECT_NAME/
mv -bfv $PROJECT_FOLDER/temp/* $PROJECT_FOLDER/$PROJECT_NAME/
find $PROJECT_FOLDER -name "*~" -exec rm -rf {} \;
cd $PROJECT_FOLDER/$PROJECT_NAME/
python3.6 -m venv venv
source venv/bin/activate
pip install -U setuptools pip wheel
pip install -e .
chown -R ec2-user:ec2-user $PROJECT_FOLDER
