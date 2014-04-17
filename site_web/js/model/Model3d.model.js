window.cnpao = window.cnpao || {Model: {}, View: {}};

/**
 * Classe représentant l'ensemble du processus de génération de modèle 3D
 */
window.cnpao.Model.Model3d = inherit({
    __constructor: function(attrs) {
        this.id = (attrs && attrs.id) ? attrs.id : 0;
        this.name = (attrs && attrs.name) ? attrs.name : '';
        this.order = (attrs && attrs.order) ? attrs.order : this.__self.PAUSE;
        this.processes = (attrs && attrs.processes) ? attrs.processes : [];
        this.params = (attrs && attrs.params) ? attrs.params : {};
        // Contrairement aux précédents, le champ suivant n'est pas mis à jour suivant les interactions de l'utilisateur
        // cette partie est gérée par jQuery File Uploader, et le champ est présent juste pour assurer le chargement de la vue du model3d
        this.files = (attrs && attrs.files) ? attrs.files : [];
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
        var self = this;
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
        if(recursive) {
            obj['processes'] = _.map(this.processes, function(process) {
                return process.toJSON();
            });
            obj['params'] = _.map(this.params, function(param) {
                return param.toJSON();
            });
        }
        return obj;
    }
},
{
    PAUSE: 0,
    RUN: 1,
    STOP: 2,
    loadAjax: function(cb) {
        $.ajax({
            url: 'server/php/ajax/model3d-list.php',
            type: 'GET'
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            if(resParsed.hasOwnProperty('error') && resParsed.error != 0)
                cb(resParsed.message);
            else
                cb(null, this.loadModels(resParsed));
        }.bind(this));
    },
    loadModels: function(models) {
        return _.map(models, function(model3d) {
            if(model3d.processes)
                model3d.processes = window.cnpao.Model.Process.loadModels(model3d.processes);
            if(model3d.params)
                model3d.params = window.cnpao.Model.Param.loadModels(model3d.params);
            return new window.cnpao.Model.Model3d(model3d);
        }, this);
    }
});