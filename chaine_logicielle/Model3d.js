var inherit = require('inherit');
var async = require('async');
var _ = require('underscore');
var mysql = require('mysql');
var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cnpao',
    connectionLimit: 1
});
var Process = require('./Process')(pool);
var poolModule = require('generic-pool');
var poolUniqueIdentifier = 0;
var poolModel3d = poolModule.Pool({
    name: 'model3d',
    create: function(callback) {
        callback(null, poolUniqueIdentifier++);
    },
    destroy: function() {
    },
    max: 1,
    refreshIdle: false
});

var Model3d = inherit({
    __constructor: function(attrs) {
        this.attrs = attrs;
        this.poolIdentifier = undefined;
        this.processCurrent = undefined;
    },
    process: function(cb) {
        Process.all({model3d_id: this.attrs.id}, cb);
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        this.attrs = _.extend(this.attrs, fields);
        sqlCon.query('UPDATE model3d SET ? WHERE id=?', [fields, this.attrs.id], function(err) {
            if(err) {
                var message = '[Model3d] Erreur lors de la mise à jour de l\'enregistrement ' + self.attrs.id + ' en BDD.';
                console.log(message);
                cb(new Error(message), null);
                return;
            }
            cb(null);
        });
    },
    start: function(cb) {
        var self = this;
        poolModel3d.acquire(function(err, poolIdentifier) {
            self.poolIdentifier = poolIdentifier;
            self.update({
                state: self.__self.STATE_RUNNING
            });
            self._startNextProcess(cb);
        });
    },
    _startNextProcess: function(cb) {
        var self = this;
        this.process(function(err, processes) {
            processes.sort(function(a, b) {
                return a.attrs.ordering - b.attrs.ordering;
            });
            if(!self.processCurrent) {
                self.processCurrent = processes[0];
                self.processCurrent.start(cb);
            }
            else {
                for(var i = 0; i < processes.length; i++) {
                    if(self.processCurrent.attrs.ordering < processes[i].attrs.ordering || self.processCurrent.attrs.id != processes[i].attrs.id)
                        continue;
                    if(self.processCurrent.attrs.id == processes[i].attrs.id) {
                        if(processes[i+1]) {
                            self.processCurrent = processes[i+1];
                            self.processCurrent.start(cb);
                        }
                        else {
                            self.processCurrent = undefined;
                            cb(new Error('Plus de processus'));
                        }
                        break;
                    }
                }
            }
        });
    },
    pause: function(cb) {

    },
    stop: function(cb) {

    }
}, {
    COMMAND_PAUSE: 0,
    COMMAND_RUN: 1,
    COMMAND_STOP: 2,
    STATE_PAUSED: 0,
    STATE_RUNNING: 1,
    STATE_STOPPED: 2,
    get: function(cond, cb) {
        sqlCon.query('SELECT * FROM model3d WHERE ?', [cond], function(err, rows) {
            if(err || !rows.length) {
                var message = '[Model3d] Erreur lors de la récupération des enregistrements ' + cond + ' en BDD.';
                console.log(message);
                cb(new Error(message), null);
                return;
            }
            if(rows.length == 1)
                cb(null, new Model3d(rows[0]));
            else
                cb(null, _.map(rows, function(row) {
                    return new Model3d(row);
                }));
        });
    }
});

function checkPending() {
    Model3d.get({command: Model3d.COMMAND_RUN, state: Model3d.STATE_PAUSED}, function(err, models3d) {
        async.each(
                models3d,
                function(model3d, callback) {
                    model3d.start(function() {
                        callback();
                    });
                },
                function() {
                    setTimeout(checkPending, 5000);
                }
        );
    })
}
checkPending();