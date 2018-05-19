const express = require('express');
const bodyParser = require('body-parser');
const validFilename = require('valid-filename');
const fs = require('fs');

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var prettyEnv = JSON.stringify(process.env,null,4);
var pod = "xxxxx";
if( process.env.HOSTNAME ) {
	var hostname = process.env.HOSTNAME;
	index = hostname.lastIndexOf('-');
	pod = hostname.substring(index+1);
} 

var healthy = true;

function healthStatus(){
	if( healthy ) {
		return "I'm feeling OK.";
	} else {
		return "I'm not feeling all that well.";
	}
}

var directory = '/var/test';

app.set('port', process.env.PORT || 3000);

app.get('/files', function(req,res){
	fs.readdir(directory, function(err, items) {
		if( err ) {
			var pretty = JSON.stringify(err,null,4);
			  console.error(pretty);
			  res.render('error', { "pod": pod, "msg": pretty });
		} else {
			if( !items ) {
				items = [];
			}
			res.render('files', { "pod": pod, "items": items, "directory": directory });
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
				  res.render('error', { "pod": pod, "msg": pretty });
			  } else{
				  res.redirect('files');
			  }
		}); 
	} else {
		var pretty ='Invalid filename: "' + filename + '"';
		console.error(pretty);
		res.render('error', { "pod": pod, "msg": pretty });
	}
	
});

app.get('/logit', function(req,res){
	var msg = req.query.msg;
	console.log(msg);
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
	console.log(pod + ':' + status);
	res.redirect('home');
});

app.get('/home',  
	function(req, res) {
		var status = healthStatus();
		res.render('home', {"pretty": prettyEnv, "pod": pod, "healthStatus": status });
	}
);

app.get('/version', function(req,res){
	res.status(200);
	res.send("1.1.0");
});

app.get('/',  
	function(req, res) {
		res.redirect('home');
	}
);

// 7 second delay in start up, to help explore crashes
setTimeout( function(){
	app.listen(app.get('port'), '0.0.0.0', function() {
		  console.log(pod + ": server starting on port " + app.get('port'));
	})},
	7000
);



	