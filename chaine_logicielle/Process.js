var inherit = require('inherit');
var Step = require('./Step');
var _ = require('underscore');
var Constants = require('./Constants');
var sqlCon = global.sqlCon;

var Process = inherit({
    __constructor: function(attrs, model3d) {
        this.attrs = attrs;
        this.model3d = model3d;
        this.running = false;
    },
    step: function(cb) {
        Step.get({process_id: this.attrs.id}, this, cb);
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        self.attrs = _.extend(self.attrs, fields);
        sqlCon.query('UPDATE process SET ? WHERE id=?', [fields, self.attrs.id], function(err) {
            if(err) {
                var message = '[Process] Erreur lors de la mise à jour de l\'enregistrement ' + self.attrs.id + ' en BDD : ' + err + '.';
                console.log(message);
                cb(new Error(message), null);
                return;
            }
            cb(null);
        });
    },
    /*
     * Démarre la chaine de Step associée au Process courant
     * 
     * @param {Function} cb appelé quand le démarrage de la chaine de Step est effectif
     */
    start: function(cb) {
        var self = this;
        if(!self.running) {
            self.running = true;
            console.info('[Process] Processus "' + this.attrs.name + '" (ID = ' + this.attrs.id + ') lancé');
            self.update({
                state: Constants.STATE_RUNNING
            }, function(err) {
                if(!err)
                    self.startNextStep(cb);
            });
        }
    },
    /**
     * Trouve la prochaine Step à démarrer et la démarre
     * 
     * @param {Function} cb appelé quand le démarrage de la Step est effectif
     */
    startNextStep: function(cb) {
        var self = this;
        if(self.attrs.state !== Constants.STATE_RUNNING) {
            return;
        }
        self.step(function(err, steps) {
            if(err) {
                cb(err);
                return;
            }
            steps.sort(function(a, b) {
                return a.attrs.ordering - b.attrs.ordering;
            });
            self.stepCurrent = undefined;
            for(var i = 0; i < steps.length; i++) {
                // TODO: revoir cette partie, dans le cas où on a besoin de recommencer une étape
                if(steps[i].attrs.state == Constants.STATE_STOPPED)
                    continue;
                self.stepCurrent = steps[i];
                self.stepCurrent.start(cb);
                break;
            }
            if(!self.stepCurrent) {
                self.done(function(err) {
                    if(err)
                        console.log("[Model3d] N'a pas pu mettre fin au Model3d : " + err);
                    cb(err);
                });
            }
        });
    },
    /**
     * Met en pause le Process courant
     * 
     * @param {boolean} hurry si le traitement actuel doit être interrompu dès que possible au risque de devoir par la suite recommencer la Step interrompue
     * @param {Function} cb appelé quand la mise en pause est effective, c'est-à-dire quand plus aucune Step lié à ce Model3d n'est en cours d'exécution
     */
    pause: function(hurry, cb) {
        var self = this;
        console.info('[Process] Processus "' + this.attrs.name + '" (ID = ' + this.attrs.id + ') mis en pause');
        if(self.stepCurrent) {
            self.stepCurrent.pause(hurry, function() {
                self.running = false;
                self.update({
                    state: Constants.STATE_PAUSED
                }, cb);
            });
            return;
        }
        else {
            if(self.running)
                self.running = false;
            self.update({
                state: Constants.STATE_PAUSED
            }, cb);
        }
    },
    /*
     *
     *  
     * @param {Function} cb appelé quand la chaine de traitement est vraiment terminée
     */
    stop: function(cb) {
        var self = this;
        console.info('[Process] Processus "' + this.attrs.name + '" (ID = ' + this.attrs.id + ') arrêté');
        if(self.stepCurrent) {
            self.stepCurrent.stop(function() {
                self.running = false;
                self.update({
                    state: Constants.STATE_STOPPED
                }, cb);
            });
            return;
        }
        else {
            if(self.running)
                self.running = false;
            self.update({
                state: Constants.STATE_STOPPED
            }, cb);
        }
    },
    error: function(err) {
        // TODO
    },
    done: function(cb) {
        var self = this;
        console.info('[Process] Processus "' + this.attrs.name + '" (ID = ' + this.attrs.id + ') terminé');
        self.update({
            state: Constants.STATE_STOPPED
        }, function(err) {
            if(err) {
                cb(err);
                return;
            }
            if(self.running)
                self.running = false;
            self.stepCurrent = null;
            self.model3d.startNextProcess(cb);
        });
    }
}, {
    get: function(cond, model3d, cb) {
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
        sqlCon.query('SELECT p.*, sp.name, sp.library_directory, sp.library_name, sp.ordering FROM process p INNER JOIN spec_process sp ON p.spec_process_id=sp.id WHERE ' + query, args, function(err, rows) {
            if(err) {
                var message = '[Model3d] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
            }
            else {
                var tabModels = _.map(rows, function(row) {
                    // require met en cache les fichiers déjà chargés
                    var ProcessObject = require('./process/' + row.library_directory + '/' + row.library_name + '.process');
                    return new ProcessObject(row, model3d);
                });
                cb(null, tabModels);
            }
        });
    }
});

module.exports = Process;