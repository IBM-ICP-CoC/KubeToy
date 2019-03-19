const express = require('express');
const bodyParser = require('body-parser');
const validFilename = require('valid-filename');
const fs = require('fs');
const ping = require('net-ping');
const { exec } = require('child_process');
const util = require('util');
const sprintf = require("sprintf-js").sprintf;
const dns = require('dns');
const ibmcos = require('ibm-cos-sdk');
const formidable = require('formidable');
const { uname } = require('node-uname');
const sysInfo = uname();
const sysInfoStr = `Arch: ${sysInfo.machine}, Release: ${sysInfo.release}`
const appVersion = "1.9.0";

const configFile = "/var/config/config.json";
const secretFile = "/var/secret/toy-secret.txt";

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


var pod = "xxxxx";
if( process.env.HOSTNAME ) {
	var hostname = process.env.HOSTNAME;
	index = hostname.lastIndexOf('-');
	pod = hostname.substring(index+1);
} 


var stressCpu = 5;
var stressIo = 5;
var stressVm = 5;
var stressVmBytes = "1024M";
var stressTimeout = 10;
var pid;
var healthy = true;
var duckImage = "duck.png";

function healthStatus(){
	if( healthy ) {
		return "I'm feeling OK.";
	} else {
		return "I'm not feeling all that well.";
	}
}

var directory = '/var/test';
var filesystem = fs.existsSync(directory);

app.set('port', process.env.PORT || 3000);

if( filesystem ) {
	app.get('/files', function(req,res){
		fs.readdir(directory, function(err, items) {
			if( err ) {
				var pretty = JSON.stringify(err,null,4);
				  console.error(pretty);
				  res.render('error', { "pod": pod, "filesystem": filesystem, "msg": pretty, "objectstore": objectstore });
			} else {
				if( !items ) {
					items = [];
				}
				res.render('files', { "pod": pod, "items": items, "filesystem": filesystem, "directory": directory, "objectstore": objectstore });
			}
		});
	});

	app.get('/show', function(req,res){
		var index = req.query.f;
		fs.readdir(directory, function(err, items) {
		    if( index<items.length ) {
		    		res.sendFile( '/var/test/' + items[index] );
		    } else {
		    		res.redirect('files');
		    }
		});
	});
	
	app.post('/files', function(req,res){
		var filename = req.body.filename;
		if( validFilename( filename ) ){
			var content = req.body.content;
			console.log( 'creating file: ' + filename );
			
			fs.writeFile(directory + '/' + filename, content, 'utf8', function (err) {
				  if (err) {
					  var pretty = JSON.stringify(err,null,4);
					  console.error(pretty);
					  res.render('error', { "pod": pod, "filesystem": filesystem, "msg": pretty, "objectstore": objectstore });
				  } else{
					  res.redirect('files');
				  }
			}); 
		} else {
			var pretty ='Invalid filename: "' + filename + '"';
			console.error(pretty);
			res.render('error', { "pod": pod, "filesystem": filesystem, "msg": pretty, "objectstore": objectstore });
		}
	});
}

// Populate Cloud ObjectStorage Credentials
//load Object Storage (S3) credentials from a file if available
var ibmcosconfig = {}

var objectstore = fs.existsSync("/cos-configuration/cos-credentials.json");

if( objectstore ) {

	ibmcosconfig = require("/cos-configuration/cos-credentials.json");

	var cos = new ibmcos.S3(ibmcosconfig);

  app.get('/cos', function(req,res){
        items = [];
        //list documents from IBM Cloud Object storage
        cos.listObjects({
          Bucket: ibmcosconfig.bucket
        }, function(err, data) {
            if (err) {
                console.log(err.extendedRequstId);
            } else if (data && data.Contents) {
                data.Contents.forEach(function(content) {
                    items[items.length] = content.Key;
                });
            }
            res.render('cos', { "cos": cos, "objectstore": objectstore, "bucket": ibmcosconfig.bucket, "pod": pod, "items":items, "filesystem": filesystem});
        });
  });

  app.get('/cosmeta', function(req,res){
		var key = req.query.key;
		var obj = cos.getObject({
			Bucket: ibmcosconfig.bucket,
			Key: key
		}, function(err,data){
			console.log( "Metadata: " + JSON.stringify(data.Metadata) );
			res.send(JSON.stringify(data.Metadata));
		});
    
  });

  app.get('/cosshow', function(req,res){
    //var index = req.query.f;
		var key = req.query.key;
		var cosGetObjectStream = cos.getObject({
			Bucket: ibmcosconfig.bucket,
			Key: key
		}).createReadStream();
		cosGetObjectStream.pipe(res);
	
  });

  app.get('/cosdel', function(req,res){
      var key = req.query.key;
      cos.deleteObject({
        Bucket: ibmcosconfig.bucket,
        Key: key
      },function(err, data) {
        if (err) {
          console.log(err);
        }
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.redirect('cos');
      });
	});
	
	function parseMetadata(values){
		var re = /^[a-zA-Z][\w-]*$/g;
		var metadata = {};
		if( typeof values === 'string' ){
			var data = values.split('\n');
			for(var i=0;i<data.length;i++ ){
				var line = data[i].trim();
				var kv = line.split(':');
				if( kv.length == 2 ) {
					var k = kv[0].trim();
					if( k.match(re) ) {
						metadata[k]= kv[1].trim();
					}
				}
			}
		}
		return metadata;
	}

  app.post('/cos', function(req,res){
		var filename = req.body.filename;
    if( validFilename( filename ) ){
      var content = req.body.content;
			var metadata = parseMetadata(req.body.metadata);
      cos.putObject({
          Bucket: ibmcosconfig.bucket,
          Key: filename,
					Body: content,
					Metadata: metadata
      },function(err, data) {
        if (err) {
          console.log(err);
        }
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.redirect('cos');
      });
    } else {
      var form = new formidable.IncomingForm();
      // Putting the file into COS
      // After parse ... need to redirect/refresh page
      form.parse(req, function(err, fields, files) {
				if (err) next(err);
				var metadata = parseMetadata(fields.metadata);
        cos.putObject({
            Bucket: ibmcosconfig.bucket,
            Key: files.chosenfilename.name,
            Body: fs.createReadStream(files.chosenfilename.path),
						Metadata: metadata
        },function(err, data) {
          if (err) {
            console.log(err);
          }
          res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
          res.redirect('cos');
        });
      });
    };

  });
};

app.get('/mutate', function(req,res){
	console.log("mutating");
	exec('echo "#\!/bin/bash\npwd" > /usr/local/bin/mutate.sh');
	exec('chmod +x /usr/local/bin/mutate.sh');
	exec('top &');
	duckImage = "fduck.png";
	res.redirect('home');
});


app.post('/dns', function(req,res){
	var host = req.body.dnsHost;
	
	if( !host ) {
		var message = "Please provide a host name or IP";
		var args = { 
				"pod": pod, 
				"filesystem": filesystem, 
				"pingResponse": "",
				"pingHost": "",
				"pingActive": "",
				"dnsResponse": message,
				"dnsHost": host,
        "dnsActive": "active",
        "objectstore": objectstore
			};
		
		res.render('network', args);
	} else {
		// ping options
		var options = {
		    networkProtocol: ping.NetworkProtocol.IPv4,
		    packetSize: 16,
		    retries: 1,
		    timeout: 2000,
		    ttl: 128
		};
		
		dns.resolve4(host, function(err,addresses){
			if( err ) {
				var args = { 
						"pod": pod, 
						"filesystem": filesystem, 
						"pingResponse": "",
						"pingHost": "",
						"pingActive": "",
						"dnsResponse": err,
						"dnsHost": host,
            "dnsActive": "active",
            "objectstore": objectstore
					};
				
				res.render('network', args);
			} else {
				console.log( addresses );
				var addrList = '';
				for(var i=0;i<addresses.length;i++){
					if( i>1 ) {
						addrList += '\n'+addresses[i];
					} else {
						addrList += addresses[i];
					}
				}
				
				var args = { 
						"pod": pod, 
						"filesystem": filesystem, 
						"pingResponse": "",
						"pingHost": "",
						"pingActive": "",
						"dnsResponse": addrList,
						"dnsHost": host,
            "dnsActive": "active",
            "objectstore": objectstore
					};
				res.render('network', args);
			}
		});
	}
});


app.post('/ping', function(req,res){
	var host = req.body.pingHost;
	
	if( !host ) {
		var message = "Please provide a host name or IP";
		var args = { 
				"pod": pod, 
				"filesystem": filesystem, 
				"pingResponse": message,
				"pingHost": host,
				"pingActive": "active",
				"dnsResponse": "",
				"dnsHost": "",
        "dnsActive": "",
        "objectstore": objectstore
			};
		res.render('network', args);
	}
	
	// ping options
	var options = {
	    networkProtocol: ping.NetworkProtocol.IPv4,
	    packetSize: 16,
	    retries: 1,
	    timeout: 2000,
	    ttl: 128
	};
	
	var session = ping.createSession(options);
	
	dns.resolve4(host, function(err,addresses){
		
		if( err ) {
			var args = { 
					"pod": pod, 
					"filesystem": filesystem, 
					"pingResponse": err,
					"pingHost": host,
					"pingActive": "active",
					"dnsResponse": "",
					"dnsHost": "",
          "dnsActive": "",
          "objectstore": objectstore
				};
			res.render('network', args);
		} else {
			console.log( addresses );
			var ip = addresses[0];
			session.pingHost(ip, function(error, ip) {
				var message;
			    if (error){
			    	message = ip + ": " + error;
			    }
			    else {
			    	message = ip + ": Alive";
			    }
				var args = { 
						"pod": pod, 
						"filesystem": filesystem, 
						"pingResponse": message,
						"pingHost": host,
						"pingActive": "active",
						"dnsResponse": "",
						"dnsHost": "",
            "dnsActive": "",
            "objectstore": objectstore
					};
				res.render('network', args);
			});
		}
	});
});


app.get('/network', function(req,res){
	var args = { 
			"pod": pod, 
			"filesystem": filesystem, 
			"pingResponse": "",
			"pingHost": "",
			"pingActive": "",
			"dnsResponse": "",
			"dnsHost": "",
      "dnsActive": "active",
      "objectstore": objectstore
		};
	res.render('network', args);
});


app.get('/logit', function(req,res){
	var msg = req.query.msg;
	console.log(msg);
	res.redirect('home');
});

app.get('/errit', function(req,res){
	var msg = req.query.msg;
	console.error(msg);
	res.redirect('home');
});


function crash(msg, res){
	// write message to log
	if( !msg ) {
		msg = 'Aaaaah!';
	}
	console.error(pod + ': ' + msg);
	
	// set up timer to crash after 3 seconds 
	setTimeout( function(){
	  // process.exit(-1);  // produces simpler clear log entries than uncaught exception
	  process.nextTick(function () {
		  throw new Error;
	  });
	}, 3000 );
	
	// in the meantime render crash page
	res.render('rip', {"pod": pod.substring(0,5), "msg": msg});
}

app.post('/crash', function(req,res){
	var msg = req.body.msg;
	if( !msg ) msg ="going down.";
	crash(req.body.msg, res);
});	

app.get('/health', function(req,res){
	if( healthy ) {
		res.status(200);
	} else {
		res.status(500);
	}
	var status = healthStatus();
	res.send(status);
});

app.post('/health', function(req,res){
	healthy = !healthy;
	var status = healthStatus();
	console.log(pod + ': ' + status);
	res.redirect('home');
});

app.get('/config',  
	function(req, res) {
		var config = "(file missing)";
		var secret = "(file missing)";
		
		if( fs.existsSync(configFile) ) {
			config = fs.readFileSync(configFile);
		}
		if( fs.existsSync(secretFile) ) {
			secret = fs.readFileSync(secretFile);
		}
		var prettyEnv = JSON.stringify(process.env,null,4);
		
		res.render('config', {"pod": pod, "pretty": prettyEnv, "filesystem": filesystem, "config": config, "secret": secret, "objectstore": objectstore });
	}
);


app.get('/home',  
	function(req, res) {
		var status = healthStatus();
		res.render('home', {"pod": pod, "duckImage": duckImage, "healthStatus": status, "filesystem": filesystem, "version": appVersion, "sysInfoStr": sysInfoStr, "objectstore": objectstore });
	}
);

app.get('/version', function(req,res){
	res.status(200).send(appVersion);
});

app.get('/',  
	function(req, res) {
		res.redirect('home');
	}
);

console.log(`Version: ${appVersion}` );
console.log(sysInfoStr);


app.listen(app.get('port'), '0.0.0.0', function() {
	  console.log(pod + ": server starting on port " + app.get('port'));
});



	
