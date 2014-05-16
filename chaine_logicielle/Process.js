var inherit = require('inherit');
var Step = require('./Step');
var _ = require('underscore');
var sqlCon;

var Process = inherit({
    __constructor: function(attrs) {
        this.attrs = attrs;
    },
    step: function() {
        
    },
    start: function() {
        
    },
    pause: function() {
        
    },
    stop: function() {
        
    }
}, {
    all: function(cond, cb) {
        sqlCon.query('SELECT * FROM process WHERE ?', [cond], function(err, rows) {
            if(err || !rows.length) {
                var message = '[Process] Erreur lors de la récupération de l\'enregistrement '+id+' en BDD.';
                console.log(message);
                cb(new Error(message), null);
            }
            else {
                var tabModels = _.map(rows, function(row) {
                    // require met en cache les fichiers déjà chargés
                    var ProcessObject = require('./process/'+row.name_library+'/'+row.name_library);
                    return new ProcessObject(row);
                });
                if(tabModels.length === 1)
                    cb(null, tabModels[0]);
                else
                    cb(null, tabModels);
            }
        });
    },
    get: function(id, cb) {
        sqlCon.query('SELECT * FROM process WHERE id=?', [id], function(err, rows) {
            if(err || !rows.length) {
                var message = '[Process] Erreur lors de la récupération de l\'enregistrement '+id+' en BDD.';
                console.log(message);
                cb(new Error(message), null);
            }
            else {
                cb(null, new Process(rows[0]));
            }
        });
    }
});

module.exports = function(pool) {
    sqlCon = pool;
    return Process;
};