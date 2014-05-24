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
    start: function() {
        var self = this;

        // TODO: passage des noms de fichiers entre Process
        var inputCloud = 'input.ply';
	var inputMesh = 'input_mesh.ply';

        // nom du fichier en sortie, composé du nom du fichier en entrée + _TEXTURED.obj
        var splitInput = inputCloud.split('.');
        splitInput.pop();
        var outputFile = splitInput.join('.') + '_TEXTURED.obj';

	var border = 5;
	// TODO: permettre le choix de la border par l'utilisateur.

        self.process = spawn('MeshTexturer', ['-ccloud', inputCloud, '-mesh', inputMesh, '-tmesh', outputFile, '-width', '4096', '-height', '4096', '-k', '5', '-border', border, '-v']);

        self.process.on('error', self.error.bind(self));
        self.process.on('exit', function() {
            self.process = null;
            self.done();
        });
    },
    pause: function(hurry, cb) {
        var self = this;
        self.__base(hurry, cb);
        if(hurry) {
            self.kill();
        }
    },
    stop: function(cb) {
        var self = this;
        self.__base(cb);
        self.kill();
    },
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(_.isString(err))
            err = new Error(err);
        // toutes les erreurs de cette Step seront fatales (provoque l'arrêt de l'ensemble du traitement)
        err.fatal = true;
        this.__base(err);
    },
    done: function() {
        var self = this;
        self.__base(function() {
            self.clean();
        });
    },
    clean: function(cb) {
        var self = this;
        if(self.process)
            self.process.kill(function() {
                if(cb)
                    cb();
            });
        else if(cb)
            cb();
    }
});

