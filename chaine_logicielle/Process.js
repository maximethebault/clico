var inherit = require('inherit');
var Step = require('./Step');
var _ = require('underscore');
var Utils = require('./Utils');
var Constants = require('./Constants');
var sqlCon = global.sqlCon;

var Process = inherit({
    __constructor: function(attrs, model3d) {
        /*
         * Process a pour vocation d'être étendue, c'est pourquoi tous ses champs sont précédés d'un underscore : on évite ainsi que des champs se fassent écrasés, ce qui pourrait produire des bugs bizarres
         */
        this._attrs = attrs;
        this._model3d = model3d;
        this._running = false;
        /*
         * Quand ce champ passe à vrai, on ignore toutes les erreurs qui peuvent arriver.
         * Utilité : on vient d'avoir une erreur (par ex. : impossible de trouver le fichier x) : la première est souvent l'erreur source, et elle est suivie par d'autres (puisqu'on fait ensuite un kill, on pourrait avoir des erreurs dues à des fermetures prématurées de processus).
         * Ces dernières sont moins intéressantes et écraseraient l'erreur d'origine. C'est pourquoi on met une sécurité.
         */
        this._ignoreError = false;
        this._stepCurrent = null;
    },
    step: function(options, cb) {
        if(_.isFunction(options)) {
            cb = options;
            options = {};
        }
        _.extend(options, {process_id: this._attrs.id});
        Step.get(options, this, cb);
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        _.extend(self._attrs, fields);
        sqlCon.query('UPDATE process SET ? WHERE id=?', [fields, self._attrs.id], function(err) {
            if(err) {
                var message = '[Process] Erreur lors de la mise à jour de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
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
        if(!self._running) {
            self._running = true;
            self._ignoreError = false;
            console.info('[Process] Processus "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') lancé');
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
        if(self._attrs.state !== Constants.STATE_RUNNING) {
            return;
        }
        self.step(function(err, steps) {
            if(err) {
                cb(err);
                return;
            }
            steps.sort(function(a, b) {
                return a._attrs.ordering - b._attrs.ordering;
            });
            self._stepCurrent = undefined;
            for(var i = 0; i < steps.length; i++) {
                if(steps[i]._attrs.state == Constants.STATE_STOPPED)
                    continue;
                self._stepCurrent = steps[i];
                self._stepCurrent.start(cb);
                break;
            }
            if(!self._stepCurrent) {
                self.done(function(err) {
                    if(err)
                        console.log("[Process] N'a pas pu mettre fin au Process : " + err);
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
        console.info('[Process] Processus "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') mis en pause');
        if(hurry)
            self._ignoreError = true;
        if(self._stepCurrent) {
            self._stepCurrent.pause(hurry, function() {
                self._running = false;
                self._stepCurrent = null;
                self.update({
                    state: Constants.STATE_PAUSED
                }, cb);
            });
            return;
        }
        else {
            if(self._running)
                self._running = false;
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
        console.info('[Process] Processus "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') arrêté');
        self._ignoreError = true;
        if(self._stepCurrent) {
            self._stepCurrent.stop(function() {
                self._running = false;
                self._stepCurrent = null;
                self.update({
                    state: Constants.STATE_STOPPED
                }, cb);
            });
            return;
        }
        else {
            if(self._running)
                self._running = false;
            self.update({
                state: Constants.STATE_STOPPED
            }, cb);
        }
        self.removeCache();
    },
    error: function(err) {
        if(this._ignoreError)
            return;
        if(err.fatal)
            this._ignoreError = true;
        this._model3d.error(err);
    },
    done: function(cb) {
        var self = this;
        self._ignoreError = true;
        console.info('[Process] Processus "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') terminé');
        self.update({
            state: Constants.STATE_STOPPED
        }, function(err) {
            if(err) {
                cb(err);
                return;
            }
            if(self._running)
                self._running = false;
            self._stepCurrent = null;
            self._model3d.startNextProcess(cb);
        });
    },
    sendNotification: function(message) {
        message.process_id = this._attrs.id;
        this._model3d.sendNotification(message);
    },
    removeCache: function() {
        Step.removeCache(this);
    }
}, {
    tabCachedModels: {},
    get: function(cond, model3d, cb) {
        var self = this;
        var queryArgs = Utils.getQueryArgs(cond);
        sqlCon.query('SELECT p.*, sp.name, sp.library_directory, sp.library_name, sp.ordering FROM process p INNER JOIN spec_process sp ON p.spec_process_id=sp.id WHERE ' + queryArgs.where, queryArgs.args, function(err, rows) {
            if(err) {
                var message = '[Process] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
            }
            else {
                var tabModels = _.map(rows, function(row) {
                    if(self.tabCachedModels.hasOwnProperty(row.id))
                        _.extend(self.tabCachedModels[row.id]._attrs, row);
                    else {
                        // require met en cache les fichiers déjà chargés
                        var ProcessObject = require('./process/' + row.library_directory + '/' + row.library_name + '.process');
                        self.tabCachedModels[row.id] = new ProcessObject(row, model3d);
                    }
                    return self.tabCachedModels[row.id];
                });
                cb(null, tabModels);
            }
        });
    },
    /**
     * Pour pouvoir ré-utiliser les mêmes objects entre chaque pause, ils sont mis en cache dans des tableaux associatifs (en JavaScript, ce sont tout simplement des objets) : tabCachedModels
     * On peut rencontrer les mêmes problèmes qu'en Java : tant qu'on garde une référence vers un objet, il ne sera pas nettoyé par le Garbage Collector : c'est donc le problème que résout cette fonction
     */
    removeCache: function(model3d) {
        _.forEach(this.tabCachedModels, function(cachedModel, index) {
            if(cachedModel._model3d == model3d)
                delete this.tabCachedModels[index];
        }, this);
    }
});

module.exports = Process;