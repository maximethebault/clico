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
        this._attrs = attrs;
        this.poolIdentifier = undefined;
        this.processCurrent = undefined;
        this.commandInProgress = false;
        this.commandWatcher = setTimeout(this._commandWatch.bind(this), this.__self.watchInterval);
        console.info('[Model3d] Traitement (ID = ' + this._attrs.id + ') créé');
    },
    _commandWatch: function() {
        var self = this;
        sqlCon.query('SELECT command FROM model3d WHERE id=? AND command<>state', [self._attrs.id], function(err, rows) {
            // on factorise dans la fonction suivante le code à exécuter après le lancement de l'ordre
            function resetTimer() {
                self.commandWatcher = setTimeout(self._commandWatch.bind(self), self.__self.watchInterval);
            }
            if(err) {
                var message = '[Model3d] Impossible de vérifier l\'état de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
                console.error(message);
            }
            if(rows.length) {
                var newCommand = rows[0].command;
                if(newCommand == Constants.COMMAND_PAUSE) {
                    self.pause(false, function(err) {
                        if(err)
                            console.error('[Model3d] Impossible de mettre le processus en pause : ' + err + '.');
                        resetTimer();
                    });
                }
                else if(newCommand == Constants.COMMAND_RUN) {
                    self.start(function(err) {
                        if(err)
                            console.error('[Model3d] Impossible de démarrer le processus : ' + err + '.');
                        resetTimer();
                    });
                }
                else if(newCommand == Constants.COMMAND_STOP) {
                    self.stop(function(err) {
                        if(err)
                            console.error('[Model3d] Impossible d\'arrêter le processus : ' + err + '.');
                        resetTimer();
                    });
                }
                else {
                    console.error('[Model3d] La commande n\'a pas été comprise.');
                    resetTimer();
                }
            }
            else
                resetTimer();
        });
    },
    process: function(cb) {
        Process.get({model3d_id: this._attrs.id}, this, cb);
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        self._attrs = _.extend(self._attrs, fields);
        sqlCon.query('UPDATE model3d SET ? WHERE id=?', [fields, self._attrs.id], function(err) {
            if(err) {
                var message = '[Model3d] Erreur lors de la mise à jour de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
                console.error(message);
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
        // on empêche la possibilité de donner un ordre alors qu'un autre n'est pas terminé
        if(self.commandInProgress)
            return;
        self.commandInProgress = true;
        if(self._attrs.state == Constants.STATE_STOPPED) {
            self.update({
                command: Constants.COMMAND_STOP
            }, function() {
                self.commandInProgress = false;
            });
            return;
        }
        console.info('[Model3d] Traitement (ID = ' + this._attrs.id + ') lancé');
        self.__self.poolModel3d.acquire(function(err, poolIdentifier) {
            self.poolIdentifier = poolIdentifier;
            self.update({
                state: Constants.STATE_RUNNING
            }, function(err) {
                if(!err)
                    self.startNextProcess(cb);
                self.commandInProgress = false;
            });
        });
    },
    /**
     * Trouve le prochain Process à démarrer et le démarre
     * 
     * @param {Function} cb appelé quand le démarrage du Process est effectif (lorsqu'une Step a été lancée)
     */
    startNextProcess: function(cb) {
        var self = this;
        self.process(function(err, processes) {
            processes.sort(function(a, b) {
                return a._attrs.ordering - b._attrs.ordering;
            });
            self.processCurrent = undefined;
            for(var i = 0; i < processes.length; i++) {
                // TODO: revoir cette partie, dans le cas où on a besoin de recommencer une étape
                if(processes[i]._attrs.state == Constants.STATE_STOPPED)
                    continue;
                self.processCurrent = processes[i];
                self.processCurrent.start(cb);
                break;
            }
            if(!self.processCurrent) {
                self.done(function(err) {
                    if(err)
                        console.error("[Model3d] N'a pas pu mettre fin au Model3d : " + err);
                    cb(err);
                });
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
        // on empêche la possibilité de donner un ordre alors qu'un autre n'est pas terminé
        if(self.commandInProgress)
            return;
        self.commandInProgress = true;
        if(self._attrs.state == Constants.STATE_STOPPED) {
            self.update({
                command: Constants.COMMAND_STOP
            }, function() {
                self.commandInProgress = false;
            });
            return;
        }
        console.info('[Model3d] Traitement (ID = ' + this._attrs.id + ') mis en pause');
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
        else {
            if(self.poolIdentifier)
                self.__self.poolModel3d.release(self.poolIdentifier);
            self.update({
                state: Constants.STATE_PAUSED
            }, function(err) {
                cb(err);
                self.commandInProgress = false;
            });
        }
    },
    /*
     *
     *  
     * @param {Function} cb appelé quand la chaine de traitement est vraiment terminée
     */
    stop: function(cb) {
        var self = this;
        // on empêche la possibilité de donner un ordre alors qu'un autre n'est pas terminé
        if(self.commandInProgress)
            return;
        self.commandInProgress = true;
        console.info('[Model3d] Traitement (ID = ' + this._attrs.id + ') arrêté');
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
        else {
            if(self.poolIdentifier)
                self.__self.poolModel3d.release(self.poolIdentifier);
            self.update({
                state: Constants.STATE_STOPPED
            }, function(err) {
                cb(err);
                self.commandInProgress = false;
            });
        }
    },
    /*
     * Signale une erreur avant de suspendre ou stopper le traitement
     * 
     * @param {Error} err l'erreur rencontrée. Si elle est fatale (err.fatal === true), on stoppe le traitement, sinon, on se contente de le suspendre (pause)
     */
    error: function(err) {
        // TODO
    },
    /**
     * Réalise les traitements associés à la fin de génération d'un modèle
     */
    done: function(cb) {
        var self = this;
        console.info('[Model3d] Traitement (ID = ' + this._attrs.id + ') terminé');
        if(self.poolIdentifier)
            self.__self.poolModel3d.release(self.poolIdentifier);
        self.update({
            state: Constants.STATE_STOPPED
        }, function(err) {
            self.commandInProgress = false;
            self.processCurrent = null;
            cb(err);
        });
    }
}, {
    // l'intervalle en millisecondes entre chaque vérification pour de nouvelles générations à démarrer
    checkInterval: 5000,
    // l'intervalle en millisecondes entre chaque vérification de nouvel ordre pour un Model3d
    watchInterval: 100,
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
        sqlCon.query('SELECT * FROM model3d WHERE ' + query, args, function(err, rows) {
            if(err) {
                var message = '[Model3d] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
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

// TODO: reprise des running, en cas de redémarrage du script