window.cnpao = window.cnpao || {Model: {}, View: {}};

/**
 * Classe représentant l'ensemble du processus de génération de modèle 3D
 */
window.cnpao.Model.Model3d = inherit({
    __constructor: function(attrs) {
        attrs = attrs || {};
        this._attrs = _.defaults(attrs, this.__self.defaultAttrs);
        this._porcess = {};
    },
    process: function(options, cb) {
        _.extend(options, {model3d_id: this._attrs.id});
        Process.get(false, options, this, cb);
    },
    create: function(cb) {
        var self = this;
        $.ajax({
            url: 'server/php/ajax/model3d-new.php',
            type: 'POST',
            data: this._attrs
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            if(resParsed.hasOwnProperty('error') && resParsed.error != 0) {
                if(cb)
                    cb(resParsed.message);
                return;
            }
            self._attrs.id = resParsed.id;
            self.__self.tabCachedModels[self._attrs.id] = self;
            if(cb)
                cb(null);
        });
    },
    del: function(cb) {
        var self = this;
        $.ajax({
            url: 'server/php/ajax/model3d-del.php',
            type: 'GET',
            data: {id: self._attrs.id}
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            if(resParsed.hasOwnProperty('error') && resParsed.error != 0) {
                if(cb)
                    cb(resParsed.message);
                return;
            }
            delete self.__self.tabCachedModels[self._attrs.id];
            if(cb)
                cb();
        });
    },
    /**
     * A partir des Process associés au Model3d, renvoie un tableau d'IDs des File nécessaires
     */
    calculateFileDeps: function(cb) {
        var self = this;
        // premièrement, on récupère l'ensemble des Process associés à ce modèle :
        window.cnpao.Model.Process.get(false, {model3d_id: self._attrs.id}, self, function(err, res) {
            if(res) {
                // on transforme le tableau des Process en tableau de SpecProcess
                res = _.map(res, function(process) {
                    return window.specProcesses[process._attrs.spec_process_id];
                });
                res.sort(function(a, b) {
                    return a.ordering - b.ordering;
                });
                // contiendra la liste des dépendances à fournir par l'utilisateur, sous la forme d'une liste d'IDs de File
                var deps = [];
                // contiendra la liste des IDs de File rencontrés en output pendant le traitement
                var globalOutput = [];
                // l'algo est assez simple : dès qu'on n'a pas déjà rencontré l'input d'un Process en output d'un autre jusqu'alors, c'est que l'utilisateur doit le fournir !
                _.forEach(res, function(specProcess) {
                    _.forEach(specProcess.specFileInput, function(file) {
                        if(globalOutput.indexOf(file.id) === -1) {
                            deps.push(file.id);
                            globalOutput.push(file.id);
                        }
                    });
                    _.forEach(specProcess.specFileOutput, function(file) {
                        if(globalOutput.indexOf(file.id) === -1)
                            globalOutput.push(file.id);
                    });
                });
                cb(err, deps);
            }
            else
                cb(err, []);
        });
    }
},
{
    defaultAttrs: {
        id: 0,
        membres_id: window.user_id,
        command: window.cnpao.Constants.COMMAND_PAUSE,
        state: window.cnpao.Constants.STATE_PAUSED,
        error: ''
    },
    tabCachedModels: {},
    get: function(refresh, conds, cb) {
        var self = this;
        if(refresh) {
            $.ajax({
                url: 'server/php/ajax/model3d-list.php',
                type: 'GET',
                data: conds
            }).done(function(result) {
                var resParsed = JSON.parse(result);
                if(resParsed.hasOwnProperty('error') && resParsed.error != 0) {
                    cb(resParsed.message);
                    return;
                }
                var tabModels = _.map(resParsed, function(row) {
                    return self.insert(row);
                });
                cb(null, tabModels);
            });
        }
        else {
            var ret = [];
            _.forEach(self.tabCachedModels, function(model) {
                var match = true;
                _.forEach(conds, function(condValue, condKey) {
                    if(model._attrs[condKey] !== condValue)
                        match = false;
                });
                if(match)
                    ret.push(model);
            });
            cb(null, ret);
        }
    },
    insert: function(row) {
        var self = this;
        if(row.processes) {
            _.forEach(row.processes, function(process) {
                window.cnpao.Model.Process.insert(process);
            });
            row.processes = null;
        }
        if(row.params) {
            _.forEach(row.params, function(param) {
                window.cnpao.Model.Param.insert(param);
            });
            row.params = null;
        }
        if(self.tabCachedModels.hasOwnProperty(row.id))
            _.extend(self.tabCachedModels[row.id]._attrs, row);
        else
            self.tabCachedModels[row.id] = new window.cnpao.Model.Model3d(row);
        return self.tabCachedModels[row.id];
    }
});