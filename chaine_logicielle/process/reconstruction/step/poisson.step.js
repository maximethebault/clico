var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var Utils = require('../../../Utils');
var inherit = require('inherit');
var _ = require('underscore');

var StepPoisson = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
    },
    processPoissonRecon: function(data) {
        var matches = data.match(/ERROR/g);
        if(matches) {
            this.error(data);
        }
    },
    start: function(cb) {
        var self = this;
        self.__base(function(err) {
            cb(err);
            self._process._model3d.file({code: ['pointCloud', 'mesh']}, function(err, files) {
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
                var inputFile = files.pointCloud._attrs.path;
                self.outputFile = Utils.getReducedPath(inputFile) + '.poisson.ply';

                self._process._model3d.param({code: ['poissonDepth', 'poissonWeight']}, function(err, param) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des paramètres : ' + err + '.');
                        // on ne va pas plus loin
                        return;
                    }
                    if(!param || !param.poissonDepth || !param.poissonWeight) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer les paramètres.');
                        // on ne va pas plus loin
                        return;
                    }

                    var poissonDepth = param.poissonDepth._attrs.id ? param.poissonDepth._attrs.value : param.poissonDepth._attrs.value_default;
                    var poissonWeight = param.poissonWeight._attrs.id ? param.poissonWeight._attrs.value : param.poissonWeight._attrs.value_default;

                    self.process = spawn('PoissonRecon.x64', ['--in', inputFile, '--out', self.outputFile, '--depth', poissonDepth, '--pointWeight', poissonWeight, '--verbose']);
                    self.process.on('error', self.error.bind(self));
                    self.process.stdout.setEncoding('utf-8');
                    self.process.stderr.setEncoding('utf-8');
                    self.process.stdout.on('data', self.processPoissonRecon.bind(self));
                    self.process.stderr.on('data', self.processPoissonRecon.bind(self));
                    self.process.on('close', function() {
                        self.process = null;
                        self.done(function() {
                            self.clean();
                        });
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
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(_.isString(err))
            err = new Error(err);
        // toutes les erreurs de cette Step seront fatales (provoque l'arrêt de l'ensemble du traitement)
        err.fatal = true;
        this.__base(err);
    },
    done: function(cb) {
        var self = this;
        // l'appel de self.__base n'est pas supporté trop loin dans le code, on contourne le problème
        var remBase = self.__base.bind(self);
        if(!self.outputFile) {
            self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : un des fichiers de sortie est manquant.');
            remBase(cb);
        }
        else {
            var outputToCheck = [];
            outputToCheck.push({path: self.outputFile, code: 'mesh', name: 'mesh'});
            self.saveFiles(outputToCheck, function() {
                remBase(cb);
            });
        }
    },
    clean: function(cb) {
        if(this.process)
            this.process.kill();
        if(cb)
            cb();
    }
});

module.exports = StepPoisson;