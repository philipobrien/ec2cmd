ec2cmd
==========
Command line client for Amazon EC2. V0.1. 

Provides a wrapper for some of the core functionality of the EC2 command-line tools.

## Interactive

	node ec2cmd.js

Start ec2cmd in interactive mode. Available commands:

`ec2> help` show interactive help

`ec2> describe` describe instances associated with the account

`ec2> list` list all elastic IPs for account in region

`ec2> start <instance #>` start the corresponding instance

`ec2> stop <instance #>` stop the corresponding instance

`ec2> associate <instance #> <elastic IP>` associate elastic IP with instance

`ec2> connect <user> <instance #>` connect to instance via ssh

`ec2> download /path/to/file <instance #> /dest` download file/directory from instance to local 

`ec2> upload /path/to/file <instance #> /dest` upload file/directory from local to instance 

`ec2> exit` to quit

### configuration file

	{ "accessKeyId": "YOUR ACCESS KEY", 
	  "secretAccessKey": "YOUR SECRET ACCESS KEY", 
	  "region": "eu-west-1", 
	  "pemFile": "/path/to/key/mykey.pem"}


### Examples

`ec2> describe` will produce output similar to 

| Instance# | ID | State | Name |
|:---------:|:--:|:-----:|:----:|
| 1 | i-9a0ba3e5 | stopped | Test Server |

`ec2> start 1` will start *Test Server* listed above

`ec2> connect ubuntu 1` will connect to *Test Server* via ssh as ubuntu

`ec2> download ~/index.html 1 ~/Desktop` will copy index.html from *Test Server* to your desktop via scp

`ec2> upload ~/Desktop/index.html 1 ~/` will copy index.html from your desktop to the home directory of *Test Server* via scp

`ec2> associate 1 10.11.12.10` will associate this elastic IP with *Test Server*
