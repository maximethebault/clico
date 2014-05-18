var inherit = require('inherit');
var async = require('async');
var _ = require('underscore');
var mysql = require('mysql');
var sqlCon = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cnpao',
    connectionLimit: 1
});
global.sqlCon = sqlCon;
var Process = require('./Process');
var poolModule = require('generic-pool');
var Constants = require('./Constants');

/**
 * Un Model3d, un Process ou une Step possède les mêmes contrôles qu'un lecteur de musique :
 * -> un 'play', nommé dans le code start, qui (re)démarre un traitement
 * -> un 'pause', qui interrompt temporairement un traitement qui pourra être repris au même endroit ultérieurement (même s'il est parfois nécessaire de recommencer la Step qui avait été interrompue depuis le début)
 * -> un 'stop', qui stoppe un traitement : si on veut le relancer, il faut recommencer depuis le début
 * 
 * Un Model3d peut se terminer de deux manières différentes :
 * -> l'utilisateur décide de stopper la génération du Model3d : la méthode stop est appelée et se propage aux Process et Step
 * -> le programme prend lui-même l'initiative de l'arrêt, décomposition en deux cas de figure :
 *      -> une erreur fatale est levée pendant l'éxécution d'une Step : les méthodes "error" des Step, Process et Model3d sont appelées successivement (propagées depuis une Step jusqu'au Model3d)
 *      -> il ne reste plus aucune Step, Process à éxécuter : les méthodes "done" des Step, Process et Model3d sont appelées successivement (propagées depuis une Step jusqu'au Model3d)
 */
var Model3d = inherit({
    __constructor: function(attrs) {
        this.attrs = attrs;
        this.poolIdentifier = undefined;
        this.processCurrent = undefined;
        this.commandInProgress = false;
        this.commandWatcher = setTimeout(this._commandWatch.bind(this), 1000);
    },
    _commandWatch: function() {
        
    },
    process: function(cb) {
        Process.get({model3d_id: this.attrs.id}, this, cb);
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        self.attrs = _.extend(self.attrs, fields);
        sqlCon.query('UPDATE model3d SET ? WHERE id=?', [fields, self.attrs.id], function(err) {
            if(err) {
                var message = '[Model3d] Erreur lors de la mise à jour de l\'enregistrement ' + self.attrs.id + ' en BDD : '+err+'.';
                console.log(message);
                cb(new Error(message), null);
                return;
            }
            cb(null);
        });
    },
    /*
     * Démarre la chaine de traitement
     * 
     * @param {Function} cb appelé quand le démarrage de la chaine de traitement est effectif
     */
    start: function(cb) {
        var self = this;
        if(self.commandInProgress)
            return;
        self.commandInProgress = true;
        self.__self.poolModel3d.acquire(function(err, poolIdentifier) {
            self.poolIdentifier = poolIdentifier;
            self.update({
                state: Constants.STATE_RUNNING
            }, function(err) {
                if(!err)
                    self._startNextProcess(cb);
                self.commandInProgress = false;
            });
        });
    },
    /**
     * Trouve le prochain Process à démarrer et le démarre
     * 
     * @param {Function} cb appelé quand le démarrage du Process est effectif (lorsqu'une Step a été lancée)
     */
    _startNextProcess: function(cb) {
        var self = this;
        self.process(function(err, processes) {
            processes.sort(function(a, b) {
                return a.attrs.ordering - b.attrs.ordering;
            });
            if(!self.processCurrent) {
                self.processCurrent = processes[0];
                console.log(self.processCurrent);
                self.processCurrent.start(cb);
            }
            else {
                for(var i = 0; i < processes.length; i++) {
                    // TODO: revoir cette partie, dans le cas où on a besoin de recommencer une étape
                    if(self.processCurrent.attrs.ordering < processes[i].attrs.ordering || self.processCurrent.attrs.id != processes[i].attrs.id)
                        continue;
                    if(self.processCurrent.attrs.id == processes[i].attrs.id) {
                        if(processes[i + 1]) {
                            self.processCurrent = processes[i + 1];
                            self.processCurrent.start(cb);
                        }
                        else {
                            self.processCurrent = undefined;
                            self.done();
                        }
                        break;
                    }
                }
            }
        });
    },
    /**
     * Met en pause la chaine de traitement
     * 
     * @param {boolean} hurry si le traitement actuel doit être interrompu dès que possible au risque de devoir par la suite recommencer la Step interrompue
     * @param {Function} cb appelé quand la mise en pause est effective, c'est-à-dire quand plus aucune Step lié à ce Model3d n'est en cours d'exécution
     */
    pause: function(hurry, cb) {
        var self = this;
        if(self.commandInProgress)
            return;
        if(self.processCurrent) {
            self.processCurrent.pause(hurry, function() {
                self.__self.poolModel3d.release(self.poolIdentifier);
                self.update({
                    state: Constants.STATE_PAUSED
                }, function(err) {
                    cb(err);
                    self.commandInProgress = false;
                });
            });
            return;
        }
        if(self.poolIdentifier)
            self.__self.poolModel3d.release(self.poolIdentifier);
        self.update({
            state: Constants.STATE_PAUSED
        }, function(err) {
            cb(err);
            self.commandInProgress = false;
        });
    },
    /*
     *
     *  
     * @param {Function} cb appelé quand la chaine de traitement est vraiment terminée
     */
    stop: function(cb) {
        var self = this;
        if(self.commandInProgress)
            return;
        if(self.processCurrent) {
            self.processCurrent.stop(function() {
                self.__self.poolModel3d.release(self.poolIdentifier);
                self.update({
                    state: Constants.STATE_STOPPED
                }, function(err) {
                    cb(err);
                    self.commandInProgress = false;
                });
            });
            return;
        }
        if(self.poolIdentifier)
            self.__self.poolModel3d.release(self.poolIdentifier);
        self.update({
            state: Constants.STATE_STOPPED
        }, function(err) {
            cb(err);
            self.commandInProgress = false;
        });
    },
    /*
     * Signale une erreur avant de suspendre ou stopper le traitement
     * 
     * @param {Error} err l'erreur rencontrée. Si elle est fatale (err.fatal === true), on stoppe le traitement, sinon, on se contente de le suspendre (pause)
     */
    error: function(err) {

    },
    /**
     * Réalise les traitements associés à la fin de génération d'un modèle
     */
    done: function() {

    }
}, {
    poolUniqueIdentifier: 1,
    poolModel3d: poolModule.Pool({
        name: 'model3d',
        create: function(callback) {
            callback(null, Model3d.poolUniqueIdentifier++);
        },
        destroy: function() {
        },
        // si on veut augmenter le nombre de Process traités en parallèle, on pourra augmenter le nombre suivant
        max: 1,
        refreshIdle: false
    }),
    get: function(cond, cb) {
        var query = '';
        var args = [];
        if(typeof cond === 'string') {
            query = '?';
            args = [cond];
        }
        else {
            query = [];
            _.each(cond, function(value, key) {
                query.push('?');
                var obj = {};
                obj[key] = value;
                args.push(obj);
            }, this);
            query = query.join(' AND ');
        }
        sqlCon.query('SELECT * FROM model3d WHERE '+query, args, function(err, rows) {
            if(err) {
                var message = '[Model3d] Erreur lors de la récupération des enregistrements en BDD : '+err+'.';
                console.log(message);
                cb(new Error(message), null);
                return;
            }
            var tabModels = _.map(rows, function(row) {
                return new Model3d(row);
            });
            cb(null, tabModels);
        });
    }
});

function checkPending() {
    Model3d.get({command: Constants.COMMAND_RUN, state: Constants.STATE_PAUSED}, function(err, models3d) {
        if(err) {
            setTimeout(checkPending, 5000);
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
                    setTimeout(checkPending, 5000);
                }
        );
    });
}
checkPending();