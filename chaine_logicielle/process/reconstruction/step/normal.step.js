var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');

var StepNormalCalculation = inherit(Step, {
    __constructor: function() {
        
    },
    start: function() {
        var self = this;
        this.count = 0;
        console.log('Début de l\'etape ' + this.getName());

        // TODO: passage des noms de fichiers entre Process
        var inputFile = 'input.ply';

        // nom du fichier en sortie, composé du nom du fichier en entrée + _NORMAL.ply
        var splitInput = inputFile.split('.');
        splitInput.pop();
        var outputFile = splitInput.join('.') + '_NORMAL.ply';

        this.process = spawn('meshlabserver', ['-i', inputFile, '-o', outputFile, '-m', 'vn', '-s', 'script_normal.mlx']);
        // setEncoding permet de dire à node d'interpréter les données reçues sur stdout comme une chaine de caractères plutôt que du binaire
        this.process.stdout.setEncoding('utf-8');
        this.process.stdout.on('data', function(data) {
            self.processLine(data);
        });
        this.process.on('error', function(err) {
            console.log('[ERREUR] NormalCalculation: ' + err);
        });
    },
    stop: function() {
        this.base();
        this.process.kill();
    },
    processDone: function() {
        console.log('finished');
    },
    getName: function() {
        return "Normal calculation";
    },
    processLine: function(data) {
        console.log(data);
        var matches = data.match(/Fitting planes/g);
        if(matches) {
            this.updateProgress(((this.count++) / 91) * 100);
        }
    }
});

function test_unitaire() {
    var step_normal = new StepNormalCalculation();
    step_normal.start();
}
test_unitaire();