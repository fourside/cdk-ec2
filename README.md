# CDK-EC2

## prerequisite
- set env below:
  - `MY_IP` ... ip address of your machine by cydr format
  - `KEY_NAME` ... your key name using ssh to ec2
  - `CDK_DEFAULT_ACCOUNT` ... aws access key of IAM user 
  - optional
    - `CDK_DEFAULT_REGION` ... region, default is `ap-northeast-1`
    - `IMAGE_ID` ... AMI, default is the image id of Ubuntu 20.04 

## spec
- boot an ec2 instance at 10:00 JST from monday to friday
- stop an ec2 instance at 20:00 JST if ec2 tag "autoStop" is "true"
