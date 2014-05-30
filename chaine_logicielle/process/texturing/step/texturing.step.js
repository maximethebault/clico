var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');

// TODO: on fait des split sur les ".", mais qu'est-ce qui se passe si ces points sont dans les noms de répertoires ? Drame. Fix this!

var StepTexturing = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
        // indique si l'itération a échoué
        this.processHasFailed = false;
        // indique s'il faut arrêter de générer la texture
        this.stopYaLoop = false;
    },
    processTexturer: function(data) {
        console.log(data);
        var matches = /1 * 1 triangle/.exec(data);
        if(matches)
            this.processHasFailed = true;
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
                if(!files || !files.pointCloud || !files.mesh) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : un des fichiers requis n\'est pas disponible en entrée (pointCloud, mesh).');
                    // on ne va pas plus loin
                    return;
                }
                self.pointCloudPath = files.pointCloud._attrs.path;
                self.meshPath = files.mesh._attrs.path;

                /*
                 * Il nous faut le nom du fichier en sortie, qui est composé du nom du fichier en entrée + _TEXTURE + la nouvelle extension
                 */
                var splitInput = self.meshPath.split('.');
                self.outputFile = splitInput[0] + '.textured.obj';

                self._process._model3d.param({code: 'texturingBorder'}, function(err, param) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des paramètres : ' + err + '.');
                        // on ne va pas plus loin
                        return;
                    }
                    if(!param || !param.texturingBorder) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer les paramètres.');
                        // on ne va pas plus loin
                        return;
                    }

                    self.texturingBorder = param.texturingBorder._attrs.id ? param.texturingBorder._attrs.value : param.texturingBorder._attrs.value_default;
                    self.stopYaLoop = false;
                    self.startNewBorder();
                });
            });
        });
    },
    startNewBorder: function() {
        var self = this;
        if(self.texturingBorder < 0) {
            self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de générer la texture.');
            return;
        }
        if(self.stopYaLoop)
            return;
        self.processHasFailed = false;
        console.log('MeshTexturer ' + ['-ccloud', self.pointCloudPath, '-mesh', self.meshPath, '-tmesh', self.outputFile, '-width', '4096', '-height', '4096', '-k', '5', '-border', self.texturingBorder, '-v'].join(' '));
        self.process = spawn('MeshTexturer', ['-ccloud', self.pointCloudPath, '-mesh', self.meshPath, '-tmesh', self.outputFile, '-width', '4096', '-height', '4096', '-k', '5', '-border', self.texturingBorder, '-v']);
        self.process.on('error', self.error.bind(self));
        self.process.stdout.setEncoding('utf-8');
        self.process.stderr.setEncoding('utf-8');
        self.process.stdout.on('data', self.processTexturer.bind(self));
        self.process.stderr.on('data', self.processTexturer.bind(self));
        self.process.on('close', function(code) {
            self.process = null;
            if((self.processHasFailed || code !== 0) && !self.stopYaLoop) {
                self.texturingBorder--;
                self.startNewBorder();
            }
            else {
                self.done(function() {
                    self.clean();
                });
            }
        });
    },
    pause: function(hurry, cb) {
        this.stopYaLoop = true;
        this.__base(hurry, cb);
        if(hurry)
            this.kill();
    },
    stop: function(cb) {
        this.stopYaLoop = true;
        this.__base(cb);
    },
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(_.isString(err))
            err = new Error(err);
        // toutes les erreurs de cette Step seront fatales (provoque l'arrêt de l'ensemble du traitement)
        err.fatal = true;
        this.stopYaLoop = true;
        this.__base(err);
    },
    done: function(cb) {
        var self = this;
        self.stopYaLoop = true;
        // l'appel de self.__base n'est pas supporté trop loin dans le code, on contourne le problème
        var remBase = self.__base.bind(self);
        if(!self.outputFile) {
            self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : un des fichiers de sortie est manquant.');
            remBase(cb);
        }
        else {
            fs.stat(self.outputFile, function(err, stats) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer la taille du fichier : ' + err + '.');
                    remBase(cb);
                    // on ne va pas plus loin
                    return;
                }
                self._process._model3d.file({code: 'mesh'}, function(err, file) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération du mesh : ' + err + '.');
                        remBase(cb);
                        // on ne va pas plus loin
                        return;
                    }
                    if(!file || !file.mesh) {
                        self._process._model3d.createFile({code: 'mesh', path: self.outputFile, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la création du mesh : ' + err + '.');
                            remBase(cb);
                        });
                    }
                    else {
                        file.mesh.update({path: self.outputFile, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la mise à jour du chemin du mesh : ' + err + '.');
                            remBase(cb);
                        });
                    }
                });
            });
        }
    },
    clean: function(cb) {
        if(this.process)
            this.process.kill();
        if(cb)
            cb();
    }
}, {
    pointCloudInputFormat: ['pcd', 'ply'],
    meshInputFormat: ['ply', 'vtk', 'obj', 'stl']
});

module.exports = StepTexturing;