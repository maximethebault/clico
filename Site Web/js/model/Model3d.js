window.cnpao = window.cnpao || {};

/**
 * Classe représentant l'ensemble du processus de génération de modèle 3D
 */
window.cnpao.Model3d = inherit({
    __constructor: function() {
        this.id = 0;
        this.name = '';
        this.order = this.__self.PAUSE;
        this.processes = [];
    },
    addProcess: function(process) {
        process.model3d_id = this.id;
        this.processes.push(process);
        process.create();
    },
    create: function(cb) {
        var self = this;
        $.ajax({
            url: 'server/php/ajax/model3d-new.php',
            type: 'POST',
            data: {nom: 'test'}
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            self.id = resParsed.id;
            cb();
        });
    },
    del: function(cb) {
        var self = this;
        $.ajax({
            url: 'server/php/ajax/model3d-del.php',
            type: 'GET',
            data: {id: self.id}
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            if(resParsed.hasOwnProperty('error') && resParsed.error != 0)
                alert(resParsed.message);
            cb(resParsed.error);
        });
    },
    launch: function() {
        this.order = this.__self.RUN;
        $.ajax({
            url: 'server/php/ajax/model3d-update.php',
            type: 'POST',
            data: this.toJSON(false)
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            if(resParsed.hasOwnProperty('error') && resParsed.error != 0)
                alert(resParsed.message);
        });
    },
    toJSON: function(recursive) {
        var obj = {
            id: this.id,
            name: this.name,
            order: this.order
        };
        if(recursive)
            obj['processes'] = this.processes.map(function(process) {
                return process.toJSON();
            });
        return obj;
    }
},
{
    PAUSE: 0,
    RUN: 1,
    STOP: 2
});