var inherit = require('inherit');
var _ = require('underscore');
var Utils = require('./Utils');
var Constants = require('./Constants');
var sqlCon = global.sqlCon;

var Step = inherit({
    __constructor: function(attrs, process) {
        /*
         * Step a pour vocation d'être étendue, c'est pourquoi tous ses champs sont précédés d'un underscore : on évite ainsi que des champs se fassent écrasés, ce qui pourrait produire des bugs bizarres
         */
        this._attrs = attrs;
        this._process = process;
        this._running = false;
        // quand ce champ passe à vrai, on ignore toutes les erreurs qui peuvent arriver (on a sans doute forcer la fermeture d'un child_process)
        this._ignoreError = false;
        // si l'utilisateur a demandé une pause/un stop, on va enregistrer le callback pour pouvoir l'appeler lorsque "done" est appelée
        this._pendingCallback = null;
        // l'ordre donné à la Step
        this._order = null;
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        _.extend(self._attrs, fields);
        sqlCon.query('UPDATE step SET ? WHERE id=?', [fields, self._attrs.id], function(err) {
            if(err) {
                var message = '[Step] Erreur lors de la mise à jour de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message));
                return;
            }
            cb(null);
            if(fields && fields.state)
                self.sendNotification({
                    uiUpdate: true
                });
        });
    },
    /**
     * Met à jour la progression d'une étape
     *
     * @param {int} newProgress la nouvelle progression (pourcentage compris entre 0 et 100)
     */
    updateProgress: function(newProgress) {
        var self = this;
        if(newProgress > 100)
            newProgress = 100;
        if(newProgress < 0)
            newProgress = 0;
        self.update({progress: newProgress}, function(err) {
            if(err)
                console.error('[Step] Mise à jour de la progression non effectuée pour la Step ' + self._attrs.id + ' : ' + err + '.');
            self.sendNotification({
                progress: newProgress
            });
        });
    },
    /*
     * Démarre la Step courante
     *
     * @param {Function} cb appelé quand le démarrage de la Step est effectif
     */
    start: function(cb) {
        var self = this;
        if(!self._running) {
            self._running = true;
            self._ignoreError = false;
            self._pendingCallback = null;
            self._order = null;
            console.info('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') lancée');
            self.update({
                state: Constants.STATE_RUNNING
            }, cb);
        }
    },
    /**
     * Met en pause la Step courante
     *
     * @param {boolean} hurry si la Step courante doit être interrompue dès que possible au risque de devoir par la suite la recommencer
     * @param {Function} cb appelé quand la mise en pause est effective, c'est-à-dire une fois que la Step a été vraiment arrêtée
     */
    pause: function(hurry, cb) {
        var self = this;
        console.info('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') mise en pause');
        if(!self._running) {
            cb();
            return;
        }
        self._order = Constants.COMMAND_PAUSE;
        self._pendingCallback = cb;
        if(hurry)
            self._ignoreError = true;
    },
    /*
     *
     *
     * @param {Function} cb appelé quand la chaine de traitement est vraiment terminée
     */
    stop: function(cb) {
        var self = this;
        console.info('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') arrêtée');
        if(!self._running) {
            cb();
            return;
        }
        self._order = Constants.COMMAND_STOP;
        self._ignoreError = true;
        self._pendingCallback = cb;
        self.kill();
    },
    error: function(err) {
        var self = this;
        if(!self._running)
            return;
        if(err.fatal !== false)
            err.fatal = true;
        if(!self._ignoreError) {
            if(err.fatal)
                self._ignoreError = true;
            console.error('[Step] Erreur sur l\'étape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : ' + err + '.');
            this._process.error(err);
        }
    },
    done: function(cb) {
        var self = this;
        if(!self._running) {
            cb();
            if(self._pendingCallback) {
                self._pendingCallback();
                self._pendingCallback = undefined;
            }
            return;
        }
        self._running = false;
        // si "done" est appelée et que des erreurs surviennent ensuite, c'est qu'elles sont surement dues à une fermeture parfois un peu brutale des child_process ou autres : pas très grave, on peut les ignorer
        self._ignoreError = true;
        console.info('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') terminée');
        self.update({
            state: self._order ? self._order : Constants.STATE_STOPPED
        }, function(err) {
            if(self._pendingCallback) {
                self._pendingCallback();
                self._pendingCallback = undefined;
                cb(err);
            }
            else
                self._process.startNextStep(function(err2) {
                    if(!err2)
                        err2 = err;
                    cb(err2);
                });
        });
    },
    /**
     * Fonction chargée de nettoyer les processus et autres créés pour cette Step
     *
     * @param {Function} cb la fonction à exécuter une fois le ménage fait
     */
    clean: function(cb) {
        console.warn('[WARNING][Step] La fonction "clean" devrait être redéfinie !');
        // si la fonction n'a pas été redéfinie dans une classe fille, on considère qu'il n'y a rien à nettoyer (hautement improbable, Step des plus étranges) : on exécute directement le callback
        cb();
    },
    /**
     * Wrapper de clean, appelle 'done' une fois que le ménage est terminé
     */
    kill: function() {
        var self = this;
        self.clean(function() {
            self.done(function(err) {
                if(err)
                    console.error('[Step] La step n\'a pas réussi à se terminer : ' + err + '.');
            });
        });
    },
    sendNotification: function(message) {
        message.step_id = this._attrs.id;
        this._process.sendNotification(message);
    }
}, {
    tabCachedModels: {},
    get: function(cond, process, cb) {
        var self = this;
        var queryArgs = Utils.getQueryArgs(cond);
        sqlCon.query('SELECT s.*, ss.name, ss.library_name, ss.ordering FROM step s INNER JOIN spec_step ss ON s.spec_step_id=ss.id WHERE ' + queryArgs.where, queryArgs.args, function(err, rows) {
            if(err) {
                var message = '[Step] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
            }
            else {
                var tabModels = _.map(rows, function(row) {
                    if(self.tabCachedModels.hasOwnProperty(row.id))
                        _.extend(self.tabCachedModels[row.id]._attrs, row);
                    else {
                        // require met en cache les fichiers déjà chargés
                        var StepObject = require('./process/' + process._attrs.library_directory + '/step/' + row.library_name + '.step');
                        self.tabCachedModels[row.id] = new StepObject(row, process);
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
    removeCache: function(process) {
        _.forEach(this.tabCachedModels, function(cachedModel, index) {
            if(cachedModel._process == process)
                delete this.tabCachedModels[index];
        }, this);
    }
});

module.exports = Step;