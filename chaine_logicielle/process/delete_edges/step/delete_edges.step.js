var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');

var StepDeleteEdges = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
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
            self._process._model3d.file({code: 'mesh'}, function(err, files) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des fichiers :' + err + '.');
                    // on ne va pas plus loin
                    return;
                }
                if(!files || !files.mesh) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : aucun mesh disponible en entrée');
                    // on ne va pas plus loin
                    return;
                }
                var inputFile = files.mesh._attrs.path;

                /*
                 * Il nous faut le nom du fichier en sortie, qui est composé du nom du fichier en entrée + _MESH + la nouvelle extension
                 */
                var splitInput = inputFile.split('.');
                self.outputFile = splitInput[0] + '_EDGES.ply';


                self.process = spawn('meshlabserver', ['-i', inputFile, '-o', self.outputFile, '-m', 'vn', '-s', 'script_delete.mlx']);
                self.process.on('error', self.error.bind(self));
                self.process.on('data', self.processMeshlab.bind(self));
                self.process.on('close', function() {
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
            self.error('[Step] Pas de fichier de sortie...');
            remBase(cb);
        }
        else {
            fs.stat(self.outputFile, function(err, stats) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer la taille du fichier :' + err + '.');
                    remBase(cb);
                    // on ne va pas plus loin
                    return;
                }
                self._process._model3d.file({code: 'mesh'}, function(err, file) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération du mesh:' + err + '.');
                        remBase(cb);
                        // on ne va pas plus loin
                        return;
                    }
                    if(!file || !file.mesh) {
                        self._process._model3d.createFile({code: 'mesh', path: self.outputFile, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la création du mesh :' + err + '.');
                            remBase(cb);
                        });
                    }
                    else {
                        file.mesh.update({path: self.outputFile, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la mise à jour du chemin du mesh :' + err + '.');
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
});

module.exports = StepDeleteEdges;