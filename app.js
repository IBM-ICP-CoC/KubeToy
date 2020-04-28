const express = require('express');
const bodyParser = require('body-parser');
const validFilename = require('valid-filename');
const fs = require('fs');
const { exec } = require('child_process');
const { uname } = require('node-uname');
const sysInfo = uname();
const sysInfoStr = `Arch: ${sysInfo.machine}, Release: ${sysInfo.release}`
const appVersion = "2.5.0";

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
function usingFilesystem(){
	return fs.existsSync(directory);
}

app.set('port', process.env.PORT || 3000);

if( usingFilesystem() ) {
	app.get('/files', function(req,res){
		fs.readdir(directory, function(err, items) {
			if( err ) {
				var pretty = JSON.stringify(err,null,4);
				  console.error(pretty);
				  res.render('error', { "pod": pod, "filesystem": usingFilesystem(), "msg": pretty, "objectstore": objectstore });
			} else {
				if( !items ) {
					items = [];
				}
				res.render('files', { "pod": pod, "items": items, "filesystem": usingFilesystem(), "directory": directory, "objectstore": objectstore });
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
					  res.render('error', { "pod": pod, "filesystem": usingFilesystem(), "msg": pretty, "objectstore": objectstore });
				  } else{
					  res.redirect('files');
				  }
			}); 
		} else {
			var pretty ='Invalid filename: "' + filename + '"';
			console.error(pretty);
			res.render('error', { "pod": pod, "filesystem": usingFilesystem(), "msg": pretty, "objectstore": objectstore });
		}
	});
}

app.post('/stress', function(req,res){
    var cmd = 'stress';

    var cpu = parseInt(req.body.cpu);
    if( typeof cpu != 'NaN' ) cmd += ' --cpu ' + cpu;

    var io = parseInt(req.body.io);
    if( typeof io != 'NaN' ) cmd += ' --io ' + io;

    var vm = parseInt(req.body.vm);
    if( typeof vm != 'NaN' ) cmd += ' --vm ' + vm;

    var vmb = req.body.vmb;
    var vals = vmb.match(/^([0-9]+)\s?([MG])$/);
    if( vals ) {
        cmd += ' --vm-bytes ' + vals[1] + vals[2];
    }
    var timeout = req.body.timeout;
    var vals = timeout.match(/^([0-9]+)\s?([sm])$/);
    if( vals ) {
        cmd += ' --timeout ' + vals[1] + vals[2];
    }
    console.log(cmd);
    exec(cmd);
	res.redirect('home');
});

app.get('/mutate', function(req,res){
	console.log("mutating");
	exec('echo "#\!/bin/bash\npwd" > /usr/local/bin/mutate.sh');
	exec('chmod +x /usr/local/bin/mutate.sh');
	exec('top &');
	duckImage = "fduck.png";
	res.redirect('home');
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
		
		res.render('config', {"pod": pod, "pretty": prettyEnv, "filesystem": usingFilesystem(), "config": config, "secret": secret });
	}
);


app.get('/home',  
	function(req, res) {
		var status = healthStatus();
		res.render('home', {"pod": pod, "duckImage": duckImage, "healthStatus": status, "filesystem": usingFilesystem(), "version": appVersion, "sysInfoStr": sysInfoStr });
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



	
