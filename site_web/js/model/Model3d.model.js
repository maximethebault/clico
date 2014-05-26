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
                    if(self.tabCachedModels.hasOwnProperty(row.id))
                        _.extend(self.tabCachedModels[row.id]._attrs, row);
                    else
                        self.tabCachedModels[row.id] = new window.cnpao.Model.Model3d(row);
                    return self.tabCachedModels[row.id];
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
    }
});