var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');
var Constants = require('../../../Constants');

var StepNormalCalculation = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
    },
    processMeshlab: function(data) {
        var matches = data.match(/Mesh (.*) loaded has ([0-9]+) vn/g);
        if(matches) {
            if(matches[2] > Constants.MAX_POINT_LIMIT) {
                this.error('[Step] Etape "' + this._attrs.name + '" (ID = ' + this._attrs.id + ') : le nuage de points en entrée est trop volumineux ! ' + matches[2] + ' points détectés, limite fixée à ' + Constants.MAX_POINT_LIMIT + '.');
            }
        }
    },
    start: function(cb) {
        var self = this;
        self.__base(function(err) {
            cb(err);
            // au (re)démarrage, on réinitialise le compteur (on reset la progression)
            self.progress = 0;
            self._process._model3d.file({code: 'pointCloud'}, function(err, files) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des fichiers : ' + err + '.');
                    // on ne va pas plus loin
                    return;
                }
                if(!files || !files.pointCloud) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : aucun nuage de points disponible en entrée');
                    // on ne va pas plus loin
                    return;
                }
                self.inputFile = files.pointCloud._attrs.path;

                // grâce à la commande suivante, on teste le fichier en entrée
                self.process = spawn('meshlabserver', ['-i', self.inputFile]);
                self.process.stdout.setEncoding('utf-8');
                self.process.stderr.setEncoding('utf-8');
                self.process.stdout.on('data', self.processMeshlab.bind(self));
                self.process.stderr.on('data', self.processMeshlab.bind(self));
                self.process.on('error', self.error.bind(self));
                self.process.on('exit', function() {
                    self.process = null;
                    self.done(function() {
                        self.clean();
                    });
                });

            });
        });
    },
    pause: function(hurry, cb) {
        this.__base(hurry, cb);
        if(hurry)
            this.kill();
    },
    stop: function(cb) {
        this.__base(cb);
        this.kill();
    },
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(_.isString(err))
            err = new Error(err);
        // toutes les erreurs de cette Step seront fatales (provoque l'arrêt de l'ensemble du traitement)
        err.fatal = true;
        this.__base(err);
    },
    clean: function(cb) {
        if(this.process)
            this.process.kill();
        if(cb)
            cb();
    }
});

module.exports = StepNormalCalculation;