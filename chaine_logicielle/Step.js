var inherit = require('inherit');
var _ = require('underscore');
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
        self._attrs = _.extend(self._attrs, fields);
        sqlCon.query('UPDATE step SET ? WHERE id=?', [fields, self._attrs.id], function(err) {
            if(err) {
                var message = '[Step] Erreur lors de la mise à jour de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
                return;
            }
            cb(null);
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
     * @param {Function} cb appelé quand la mise en pause est effective, c'est-à-dire quand plus aucune Step lié à ce Model3d n'est en cours d'exécution
     */
    pause: function(hurry, cb) {
        var self = this;
        console.info('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') mise en pause');
        self._order = Constants.COMMAND_PAUSE;
        if(hurry)
            self._ignoreError = true;
        self._pendingCallback = cb;
    },
    /*
     *
     *  
     * @param {Function} cb appelé quand la chaine de traitement est vraiment terminée
     */
    stop: function(cb) {
        var self = this;
        console.info('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') arrêtée');
        self._order = Constants.COMMAND_STOP;
        self._ignoreError = true;
        self._pendingCallback = cb;
    },
    error: function(err) {
        var self = this;
        if(!self._running)
            return;
        if(!self._ignoreError) {

        }
    },
    done: function(cb) {
        var self = this;
        if(!self._running) {
            cb();
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
    }
}, {
    get: function(cond, process, cb) {
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
        sqlCon.query('SELECT s.*, ss.name, ss.library_name, ss.ordering FROM step s INNER JOIN spec_step ss ON s.spec_step_id=ss.id WHERE ' + query, args, function(err, rows) {
            if(err) {
                var message = '[Model3d] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
            }
            else {
                var tabModels = _.map(rows, function(row) {
                    // require met en cache les fichiers déjà chargés
                    var StepObject = require('./process/' + process._attrs.library_directory + '/step/' + row.library_name + '.step');
                    return new StepObject(row, process);
                });
                cb(null, tabModels);
            }
        });
    }
});

module.exports = Step;