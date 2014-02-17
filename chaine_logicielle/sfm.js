var spawn = require('child_process').spawn,
	net = require('net'),
    ls    = spawn('VisualSFM', ['listen', '9999']);
var tabCommands = 	['33166 data\\list.txt\n', //Open+ Multi Images
					 '33033\n', //Compute Missing Match
					 '33041\n', //Reconstruct Sparse
					 '33471 E:\\Mes documents\\GitHub\\cnpao\\chaine_logicielle\\data\\output.nvm\n']; //Reconstruct Dense
var ident = 0;

var fs = require('fs');
var nbPictures = fs.readdirSync('data\\visualize').length-1; //nombre de fichiers .jpg charges
console.log(nbPictures.toString()); //test affiche le nombre d'images chargees


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

function callNextCommand(){
	if(ident < tabCommands.length) client.write(tabCommands[ident++]);
}

/**
/* function charge la commande suivante quand elle lit '*command processed*'
/* @param data, la ligne de log
*/
client.on('data', function(data) {
	console.log(data.toString());
	
	//gestion du temps
	switch(ident){
	case 1: //Open+ Multi Images
		/^(\d+):/.exec(data); //cherche un numero d'image dans le log
		////// PROBLEME COMMENT COMMENCER NUMEROTATION A 1 ????
		////// PROBLEME PLACE DANS LE CODE
		console.log('loading image '+RegExp.$1+'/'+nbPictures);
		break;
	case 2: //Compute Missing Match
		/^(\d+){4} and (\d+){4}/.exec(data); //cherche ligne type 0001 and 0002
		var nbMatch = nbPictures*(nbPictures-1)/2; //somme des termes suite arithm.
		var currentMatch =(RegExp.$1+1)+(RegExp.$2+1)*(RegExp.$2)/2;
		console.log('compute match '+(RegExp.$1+1)+'/'+nbMatch);
		break;
	}
	
  	/* indexOf compare une chaine avec la chaine en parametre
	   retourne -1 si rien trouve, ou bien la position de la chaine trouvee */
	if(data.toString().indexOf('*command processed*')>-1) {
		callNextCommand(); //Compute Missing Match
	}
});

client.on('error', function(err) {
  console.log('error '+err);
});
client.on('end', function() {
  console.log('client disconnected');
});