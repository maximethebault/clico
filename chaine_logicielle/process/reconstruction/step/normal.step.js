var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');

var StepNormalCalculation = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
        // va nous permettre de suivre la progression
        this.progress = 0;
    },
    processLine: function(data) {
        var matches = data.match(/Fitting planes/g);
        if(matches) {
            this.updateProgress(((this.progress++) / 91) * 100);
        }
    },
    start: function() {
        var self = this;
        // au (re)démarrage, on réinitialise le compteur (on reset la progression)
        self.progress = 0;

        // TODO: passage des noms de fichiers entre Process
        var inputFile = 'input.ply';

        // nom du fichier en sortie, composé du nom du fichier en entrée + _NORMAL.ply
        var splitInput = inputFile.split('.');
        splitInput.pop();
        var outputFile = splitInput.join('.') + '_NORMAL.ply';

        self.process = spawn('meshlabserver', ['-i', inputFile, '-o', outputFile, '-m', 'vn', '-s', 'script_normal.mlx']);
        
        self.process.stdout.setEncoding('utf-8');
        self.process.stdout.on('data', self.processLine.bind(self));
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
