var net = require('net');
var client = net.connect({port: 9999},
    function() { //'connect' listener
  console.log('client connected');
  //client.write('33166 E:\\Mes documents\\GitHub\\cnpao\\chaine_logicielle\\data\\lion\\dsc_4073.jpg E:\\Mes documents\\GitHub\\cnpao\\chaine_logicielle\\data\\lion\\dsc_4074.jpg done\n');
  client.write('33186 done\n');
  client.write('33033 done\n');
  client.write('33041 done\n');
  client.write('33471 done\n');
  client.end();
});
client.on('data', function(data) {
  console.log(data.toString());
});
client.on('error', function(err) {
  console.log('error '+err);
});
client.on('end', function() {
  console.log('client disconnected');
});