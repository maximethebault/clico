var async = require('async');
var mysql = require('mysql');
var sqlCon = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cnpao',
    connectionLimit: 1
});
global.sqlCon = sqlCon;
var Constants = require('./Constants');
var Model3d = require('./Model3d');
var WebsocketManager = require('./broadcast/WebsocketManager');

// on lance le listener pour les Websocket
new WebsocketManager();

// au lancement du script, on réinitialise tout ce qui était dans l'état "RUNNING" à l'état "PAUSED"
// cela permet de recommencer les traitements qui peuvent avoir été interrompus par un arrêt non prévu du script
sqlCon.query('UPDATE model3d SET state=? WHERE state=?', [Constants.STATE_PAUSED, Constants.STATE_RUNNING], function(err) {
    if(err) {
        var message = '[Model3d] Erreur en BDD lors de l\'initialisation : ' + err + '.';
        console.error(message);
        cb(new Error(message), null);
        return;
    }
});
sqlCon.query('UPDATE process SET state=? WHERE state=?', [Constants.STATE_PAUSED, Constants.STATE_RUNNING], function(err) {
    if(err) {
        var message = '[Process] Erreur en BDD lors de l\'initialisation : ' + err + '.';
        console.error(message);
        cb(new Error(message), null);
        return;
    }
});
sqlCon.query('UPDATE step SET state=? WHERE state=?', [Constants.STATE_PAUSED, Constants.STATE_RUNNING], function(err) {
    if(err) {
        var message = '[Step] Erreur en BDD lors de l\'initialisation : ' + err + '.';
        console.error(message);
        cb(new Error(message), null);
        return;
    }
});

function checkPending() {
    Model3d.get({command: Constants.COMMAND_RUN, state: Constants.STATE_PAUSED}, function(err, models3d) {
        if(err) {
            setTimeout(checkPending, Model3d.checkInterval);
            return;
        }
        async.each(
                models3d,
                function(model3d, callback) {
                    model3d.start(function() {
                        callback();
                    });
                },
                function() {
                    setTimeout(checkPending, Model3d.checkInterval);
                }
        );
    });
}
checkPending();