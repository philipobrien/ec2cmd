/* 
 * Command Line Interface for Amazon Elastic Compute Cloud
 *
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED 
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
 * DISCLAIMED.  IN NO EVENT SHALL T AUTHOR BE LIABLE FOR ANY DIRECT, 
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES 
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING 
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
 * POSSIBILITY OF SUCH DAMAGE. 
 */

var AWS       = require('aws-sdk');
AWS.config.loadFromPath('./config.json');

var readline  = require('readline');
var fs        = require('fs');
var sys       = require('sys');
var exec      = require('child_process').exec;
var spawn     = require('child_process').spawn;
var ec2       = new AWS.EC2();
var AMIs      = {instance: [], name: [], id: [], dns: [], state: []};
var child;
var rl;
var pem;

var red, reset;
red = '\033[31m';
reset = '\033[0m';

var promptForInput = function() {
    rl.question("ec2> ", function(input) {
          runCommand(rl, input, promptForInput);
    });
};

exports.main = function() {

  var data = fs.readFileSync('./config.json');
  var myObj;

  try {
    myObj = JSON.parse(data);
    pem = myObj.pemFile;
  }
  catch (err) {
    console.log("There has been an error parsing the config file.");
    console.log(err);
  }

  rl = readline.createInterface({input: process.stdin, output: process.stdout});
  promptForInput();
};


var runCommand = function(rl, input, callback) {
  var params;

  if (input.indexOf("list") > -1) {
    list(function() {
      callback();
    });
  }
  else if (input.indexOf("start") > -1) {
    params = input.split(" ");
    start(params[1], function() {
      callback();
    });
  }
  else if (input.indexOf("stop") > -1) {
    params = input.split(" ");
    stop(params[1], function() {
      callback();
    });
  }
  else if (input.indexOf("associate") > -1) {
    params = input.split(" ");
    associate(params[1], params[2], function() {
      callback();
    });
  }
  else if (input.indexOf("connect") > -1) {
    params = input.split(" ");
    connect(params[1], function() {
      callback();
    });
  }
  else if (input.indexOf("describe") > -1) {
    describe(function() {
      callback();
    });
  }
  else if (input.indexOf("download") > -1) {
    params = input.split(" ");
    download(params[1], params[2], params[3], function() {
      callback();
    });
  }
  else if (input.indexOf("upload") > -1) {
    params = input.split(" ");
    upload(params[1], params[2], params[3], function() {
      callback();
    });
  }
  else if (input.indexOf("exit") > -1) {
      rl.close();
  }
  else if (input.indexOf("help") > -1) {
    help();
    callback();
  }
  else {
    callback();
  }
};

var help = function() {
  console.log("");
  console.log("describe                                     - describe instances");
  console.log("list                                         - list all elastic IPs in this region");
  console.log("start <instance #>                           - start instance");
  console.log("stop <instance #>                            - stop instance");
  console.log("associate <instance #> <elastic IP>          - associate IPs to AMIs");
  console.log("connect <instance #>                         - ssh to instance");
  console.log("download /path/to/file <instance #> /dest    - download from instance to local");
  console.log("upload /path/to/file <instance #> /dest      - upload from local to instance");
  console.log("exit                                         - to quit");
  console.log("");
};

/**
 * list elastic IPs associated with account
 */

var list = function(callback) {
  ec2.describeAddresses(function (err, data) {
  if (err) {
    console.log(err); // an error occurred
    callback();
  } else {
    console.log("\nElasticIP\tAssociated Instance");
    console.log("----------------------------------------------------------------");
    for (var PublicIp in data.Addresses) {
      console.log(data.Addresses[PublicIp].PublicIp + "\t" + data.Addresses[PublicIp].InstanceId);
    }
    callback();
  }
});
};

/**
 * describe instances associated with account.
 * numbers them beginning with '1' for easy referencing.
 * when reading the 'name' tag this checks if the instance 
 * is running map-reduce jobs and if so, names it EMR.
 */

var describe = function(callback) {
  ec2.describeInstances(function (err, data) {
  if (err) {
    console.log(err);
    callback();
  } else {
    for (ImageId in data.Reservations) {
      AMIs.instance[+ImageId] = +ImageId+1;
      AMIs.id[+ImageId] = data.Reservations[+ImageId].Instances[0].InstanceId;
      AMIs.dns[+ImageId] = data.Reservations[+ImageId].Instances[0].PublicDnsName;
      AMIs.state[+ImageId] = data.Reservations[+ImageId].Instances[0].State.Name;
      if (data.Reservations[+ImageId].Instances[0].Tags[0].Key.indexOf("elasticmapreduce") > -1) {
        AMIs.name[+ImageId] = "EMR";
      } else {
        AMIs.name[+ImageId] = data.Reservations[+ImageId].Instances[0].Tags[0].Value;
      }
    }
    console.log("\nInstance#\tID\t\tState\t\tName");
    console.log("----------------------------------------------------------------");
    for (var i = 0, j = AMIs.instance.length; i < j; i += 1) {
      if(AMIs.state[i] === 'running') {
        console.log(red + AMIs.instance[i] + "\t\t" + AMIs.id[i] + "\t" + AMIs.state[i] + "\t\t" + AMIs.name[i] + reset);
      } else {
        console.log(AMIs.instance[i] + "\t\t" + AMIs.id[i] + "\t" + AMIs.state[i] + "\t\t" + AMIs.name[i]);
      }
    }
    callback();
  }
});
};

/**
 * start an instance
 */

var start = function(instance, callback) {
  params = {
    InstanceIds: [AMIs.id[+instance-1]],
    AdditionalInfo: ""
  };

  ec2.startInstances(params, function (err, data) {
    if (err) {
      console.log(err);
      console.log("Usage: start 1");
      callback();
    } else {
      console.log("Starting instance " + AMIs.id[+instance-1]);
      callback();
    }
  });
};

/**
 * stop an instance
 */

var stop = function(instance, callback) {
  params = {
    InstanceIds: [AMIs.id[+instance-1]]
  };

  ec2.stopInstances(params, function (err, data) {
    if (err) {
      console.log(err);
      console.log("Usage: stop 1");
      callback();
    } else {
      console.log("Stopping instance " + AMIs.id[+instance-1]);
      callback();
    }
  });
};

/**
 * associate an elastic IP with an instance
 */

var associate = function(instance, IP, callback) {
  params = {
    InstanceId: AMIs.id[+instance-1],
    PublicIp: IP
  };

  ec2.associateAddress(params, function (err, data) {
    if (err) {
      console.log(err);
      console.log("Usage: associate 1 198.1.2.3");
      callback();
    } else {
      console.log("Associating IP " + IP + " to instance " + AMIs.id[+instance-1]);
      callback();
    }
  });
};

/**
 * connect to an instance
 * currently assumes all instances (apart from EMR one) run ubuntu
 */

var connect = function(instance, callback) {
  var host = AMIs.dns[+instance-1];
  var user;
  if (AMIs.name[+instance-1] == "EMR") {
    user = "hadoop";
  } else {
    user = "ubuntu";
  }

  var ssh   = spawn('ssh', ['-tt', '-o', 'StrictHostKeyChecking=no', '-i', pem, '-l', user, host]);
  ssh.stdout.pipe(process.stdout, { end: false });
  process.stdin.resume();
  process.stdin.pipe(ssh.stdin, { end: false });

  ssh.on('exit', function () {
    callback();
  });
};

/**
 * copy file/directory from ec2 instance to local machine
 * add option for copying directory as well as just files (pass -r as an option to scp)
 */

var download = function(src, instance, dest, callback) {

  var host = AMIs.dns[+instance-1];
  var user;
  src = ":" + src;
  if (AMIs.name[+instance-1] == "EMR") {
    user = "hadoop";
  } else {
    user = "ubuntu";
  }

  var scpCmd = "scp -r -o StrictHostKeyChecking=no -i " + pem + " " + user + "@" + host + src + " " + dest;
  var scp = exec(scpCmd, function (error) {
    if (error) {
      console.log("Error!");
      console.log("Usage: download /path/to/source/ <instance #> /path/to/dest");
    }
    else {
      console.log("Transfer Successful");
    }
    callback();
  });
};

/**
 * copy file/directory from local to ec2 instance
 */

var upload = function(src, instance, dest, callback) {

  var host = AMIs.dns[+instance-1];
  var user;
  dest = ":" + dest;
  if (AMIs.name[+instance-1] == "EMR") {
    user = "hadoop";
  } else {
    user = "ubuntu";
  }
  var scpCmd = "scp -o StrictHostKeyChecking=no -i " + pem + " " + src + " " + user + "@" + host + dest;
  var scp = exec(scpCmd, function (error) {
    if (error) {
      console.log("Error!");
      console.log("Usage: upload /path/to/source/ <instance #> /path/to/dest");
    }
    else {
      console.log("Transfer Successful");
    }
    callback();
  });
};


