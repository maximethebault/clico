var spawn = require('child_process').spawn,
	net = require('net'),
	fs = require('fs'),
    ls    = spawn('VisualSFM', ['listen', '9999']);
var readline = require('readline');
var stream = require('stream');
var tabCommands = 	['33166 data\\list.txt\n', //Open+ Multi Images
					 '33033\n', //Compute Missing Match
					 '33041\n', //Reconstruct Sparse
					 '33471 E:\\Mes documents\\GitHub\\cnpao\\chaine_logicielle\\data\\output.nvm\n']; //Reconstruct Dense
var ident = 0;
var iSift = 1, iMatch = 1; // pour matching

var nbPictures = 16;

/*if (nbPictures == 0) {
	var exec = require('child_process').exec,
		child;
		
	child = exec('find /v /c "" < list.txt',
		function (error, stdout, stderr) {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
			}
		});
}*/


ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

ls.stderr.on('data', function (data) {
  console.log('stderr:  '+ data);
});

ls.on('error', function (code) {
  console.log('error ' + code);
});

ls.on('close', function (code) {
  console.log('child process exited with code ' + code);
});

var client = net.connect({port: 9999}, function() {
	console.log('client connected');
	callNextCommand();
});

var rl = readline.createInterface({
	  input: client,
	  output: new stream.Writable()
});

function callNextCommand(){
	if(ident < tabCommands.length) client.write(tabCommands[ident++]);
}

/**
/* function charge la commande suivante quand elle lit '*command processed*'
/* @param data, la ligne de log
*/
rl.on('line', function(data) {
	data = data.toString();
	console.log(data);
	
	var nbMatch = nbPictures*(nbPictures-1)/2; //somme des termes suite arithm. pour etape matching
	
	//gestion du temps
	switch(ident){
	case 1: //Open+ Multi Images
		var matches = /^(\d+):/.exec(data); //cherche un numero d'image dans le log
		if(matches) {
			console.log('## loading image '+(parseInt(matches[1])+1)+'/'+nbPictures);
		}
		break;
	case 2: //Compute Missing Match
		var matchesFirstPart = /^SIFT: (\d){4}/.exec(data), //cherche ligne type SIFT: 0000
			matchesSecondPart = /^(\d){4} and (\d){4}: \d+/.exec(data); //cherche ligne type 0001 and 0002
		if(matchesFirstPart) {
			console.log('## sift'+(iSift++)+'/'+nbPictures);
		}
		else if(matchesSecondPart) {
			console.log('## compute match '+(iMatch++)+'/'+nbMatch);
		}
		break;
	}
	
  	/* indexOf compare une chaine avec la chaine en parametre
	   retourne -1 si rien trouve, ou bien la position de la chaine trouvee */
	if(data.indexOf('*command processed*')>-1) {
		callNextCommand(); //Compute Missing Match
	}
});

client.on('error', function(err) {
  console.log('error '+err);
});
client.on('end', function() {
  console.log('client disconnected');
});