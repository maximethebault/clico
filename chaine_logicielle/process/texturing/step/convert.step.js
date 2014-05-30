var spawn = require('child_process').spawn;
var fs = require('fs');
var deferred = require('deferred');
var Step = require('../../../Step');
var Texturing = require('./texturing.step');
var inherit = require('inherit');
var _ = require('underscore');

var StepConvert = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
        // indique si l'exécution a été interrompue
        this.interrupted = false;
    },
    processMeshlab: function(data) {
        var matches = data.match(/ERROR/g);
        if(matches) {
            this.error(matches[0]);
        }
    },
    start: function(cb) {
        var self = this;
        self.__base(function(err) {
            cb(err);
            self.interrupted = false;
            self._process._model3d.file({code: ['pointCloud', 'mesh']}, function(err, files) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des fichiers : ' + err + '.');
                    // on ne va pas plus loin
                    return;
                }
                if(!files || !files.pointCloud || !files.mesh) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : un des fichiers requis n\'est pas disponible en entrée (pointCloud, mesh).');
                    // on ne va pas plus loin
                    return;
                }
                var pointCloudPath = files.pointCloud._attrs.path;
                var meshPath = files.mesh._attrs.path;

                // On commence avec le nuage de points
                var splitInput = pointCloudPath.split('.');
                var pointCloudFormat = splitInput.pop().toLowerCase();

                if(Texturing.pointCloudInputFormat.indexOf(pointCloudFormat) !== -1) {
                    self.runMesh(meshPath);
                }
                else {
                    /*
                     * On change l'extension du fichier
                     */
                    self.outputFilePointCloud = splitInput.join('.') + '.ply';

                    self.process = spawn('meshlabserver', ['-i', pointCloudPath, '-o', self.outputFilePointCloud, '-m', 'vn', 'vc']);
                    self.process.on('error', self.error.bind(self));
                    self.process.stdout.setEncoding('utf-8');
                    self.process.stderr.setEncoding('utf-8');
                    self.process.stdout.on('data', self.processMeshlab.bind(self));
                    self.process.stderr.on('data', self.processMeshlab.bind(self));
                    self.process.on('close', function() {
                        self.process = null;
                        if(self.interrupted)
                            self.done(function() {
                                self.clean();
                            })
                        else
                            self.runMesh(meshPath);
                    });
                }
            });
        });
    },
    runMesh: function(meshPath) {
        var self = this;
        // C'est parti pour le mesh !
        var splitInput = meshPath.split('.');
        var meshFormat = splitInput.pop().toLowerCase();

        if(Texturing.meshInputFormat.indexOf(meshFormat) !== -1) {
            self.done(function() {
                self.clean();
            });
        }
        else {
            /*
             * On change l'extension du fichier
             */
            self.outputFileMesh = splitInput.join('.') + '.ply';

            self.process = spawn('meshlabserver', ['-i', meshPath, '-o', self.outputFileMesh, '-m', 'vn']);
            self.process.on('error', self.error.bind(self));
            self.process.stdout.setEncoding('utf-8');
            self.process.stderr.setEncoding('utf-8');
            self.process.stdout.on('data', self.processMeshlab.bind(self));
            self.process.stderr.on('data', self.processMeshlab.bind(self));
            self.process.on('close', function() {
                self.process = null;
                self.done(function() {
                    self.clean();
                });
            });
        }
    },
    pause: function(hurry, cb) {
        this.interrupted = true;
        this.__base(hurry, cb);
        if(hurry)
            this.kill();
    },
    stop: function(cb) {
        this.interrupted = true;
        this.__base(cb);
    },
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(_.isString(err))
            err = new Error(err);
        // toutes les erreurs de cette Step seront fatales (provoque l'arrêt de l'ensemble du traitement)
        err.fatal = true;
        this.interrupted = true;
        this.__base(err);
    },
    done: function(cb) {
        var self = this;
        // l'appel de self.__base n'est pas supporté trop loin dans le code, on contourne le problème
        var remBase = self.__base.bind(self);
        function checkOutput(path, code, name) {
            var dfd = deferred();
            fs.stat(path, function(err, stats) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer la taille du fichier : ' + err + '.');
                    dfd.resolve();
                    // on ne va pas plus loin
                    return;
                }
                self._process._model3d.file({code: code}, function(err, file) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération du ' + name + ' : ' + err + '.');
                        dfd.resolve();
                        // on ne va pas plus loin
                        return;
                    }
                    if(!file || !file[code]) {
                        self._process._model3d.createFile({code: code, path: path, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la création du ' + name + ' : ' + err + '.');
                            dfd.resolve();
                        });
                    }
                    else {
                        file[code].update({path: path, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la mise à jour du chemin du ' + name + ' : ' + err + '.');
                            dfd.resolve();
                        });
                    }
                });
            });
            return dfd.promise;
        }
        var outputToCheck = [];
        if(self.outputFilePointCloud)
            outputToCheck.push({path: self.outputFilePointCloud, code: 'pointCloud', name: 'nuage de points'});
        if(self.outputFileMesh)
            outputToCheck.push({path: self.outputFileMesh, code: 'mesh', name: 'mesh'});
        if(_.size(outputToCheck))
            deferred.map(outputToCheck, function(output) {
                return checkOutput(output.path, output.code, output.name);
            }).then(function() {
                remBase(cb);
            });
        else
            remBase(cb);
    },
    clean: function(cb) {
        if(this.process)
            this.process.kill();
        if(cb)
            cb();
    }
});

module.exports = StepConvert;