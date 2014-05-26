window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.Model.Param = inherit({
    __constructor: function(attrs, model3d) {
        attrs = attrs || {};
        this._attrs = _.defaults(attrs, this.__self.defaultAttrs);
        this._model3d = model3d;
    },
    create: function(cb) {
        var self = this;
        $.ajax({
            url: 'server/php/ajax/param-new.php',
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
                cb();
        });
    },
    update: function(attrs, cb) {
        _.extend(this._attrs, attrs);
        $.ajax({
            url: 'server/php/ajax/param-update.php',
            type: 'POST',
            data: this._attrs
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            if(resParsed.hasOwnProperty('error') && resParsed.error != 0) {
                if(cb)
                    cb(resParsed.message);
                return;
            }
            if(cb)
                cb();
        });
    },
    del: function(cb) {
        var self = this;
        $.ajax({
            url: 'server/php/ajax/param-del.php',
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
        id: 0
    },
    tabCachedModels: {},
    get: function(refresh, conds, model3d, cb) {
        var self = this;
        if(refresh) {
            $.ajax({
                url: 'server/php/ajax/param-list.php',
                type: 'GET',
                data: conds
            }).done(function(result) {
                var resParsed = JSON.parse(result);
                if(resParsed.hasOwnProperty('error') && resParsed.error != 0) {
                    cb(resParsed.message);
                    return;
                }
                var tabModels = _.map(resParsed, function(row) {
                    return self.insert(row, model3d);
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
    insert: function(row, model3d) {
        var self = this;
        if(self.tabCachedModels.hasOwnProperty(row.id))
            _.extend(self.tabCachedModels[row.id]._attrs, row);
        else
            self.tabCachedModels[row.id] = new window.cnpao.Model.Param(row, model3d);
        return self.tabCachedModels[row.id];
    }
});