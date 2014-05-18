var inherit = require('inherit');
var _ = require('underscore');
var Constants = require('./Constants');
var sqlCon = global.sqlCon;

var Step = inherit({
    __constructor: function(attrs, process) {
        this.attrs = attrs;
        this.process = process;
        this.running = false;
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        self.attrs = _.extend(self.attrs, fields);
        sqlCon.query('UPDATE step SET ? WHERE id=?', [fields, self.attrs.id], function(err) {
            if(err) {
                var message = '[Step] Erreur lors de la mise à jour de l\'enregistrement ' + self.attrs.id + ' en BDD : '+err+'.';
                console.log(message);
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
        if(!self.running) {
            self.running = true;
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
        if(self.stepCurrent) {
            self.stepCurrent.pause(hurry, function() {
                self.running = false;
                self.update({
                    state: Constants.STATE_PAUSED
                }, cb);
            });
            return;
        }
        if(self.running)
            self.running = false;
        self.update({
            state: Constants.STATE_PAUSED
        }, cb);
    },
    /*
     *
     *  
     * @param {Function} cb appelé quand la chaine de traitement est vraiment terminée
     */
    stop: function(cb) {
        var self = this;
        if(self.stepCurrent) {
            self.stepCurrent.stop(function() {
                self.running = false;
                self.update({
                    state: Constants.STATE_STOPPED
                }, cb);
            });
            return;
        }
        if(self.running)
            self.running = false;
        self.update({
            state: Constants.STATE_STOPPED
        }, cb);
    },
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
        sqlCon.query('SELECT s.*, ss.library_name, ss.ordering FROM step s INNER JOIN spec_step ss ON s.spec_step_id=ss.id WHERE '+query, args, function(err, rows) {
            if(err) {
                var message = '[Model3d] Erreur lors de la récupération des enregistrements en BDD : '+err+'.';
                console.log(message);
                cb(new Error(message), null);
            }
            else {
                var tabModels = _.map(rows, function(row) {
                    // require met en cache les fichiers déjà chargés
                    var StepObject = require('./process/'+process.attrs.library_directory+'/step/'+row.library_name+'.step');
                    return new StepObject(row, process);
                });
                cb(null, tabModels);
            }
        });
    }
});

module.exports = Step;