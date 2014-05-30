var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');

var StepConvert = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
    },
    start: function() {
        var self = this;

        // TODO: passage des noms de fichiers entre Process
        var inputFile = 'input.asc';

        // nom du fichier en sortie, composé du nom du fichier en entrée + .ply
        var splitInput = inputFile.split('.');
        splitInput.pop();
        var outputFile = splitInput.join('.') + '.ply';

        self.process = spawn('meshlabserver', ['-i', inputFile, '-o', outputFile, '-m', 'vn']);

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
    kill: function() {
        var self = this;
        self.clean(function() {
            self.done(function(err) {
                console.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') ne s\'est pas terminée normalement : ' + err + '.');
            });
        });
    },
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(typeof err === 'string')
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
    }
});

