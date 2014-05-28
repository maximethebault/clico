window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.Model.Step = inherit({
    __constructor: function(attrs, process) {
        attrs = attrs || {};
        this._attrs = _.defaults(attrs, this.__self.defaultAttrs);
        this._process = process;
    }
},
{
    defaultAttrs: {
        id: 0,
        state: window.cnpao.Constants.STATE_PAUSED
    },
    tabCachedModels: {},
    get: function(refresh, conds, process, cb) {
        var self = this;
        if(refresh) {
            $.ajax({
                url: 'server/php/ajax/step-list.php',
                type: 'GET',
                data: conds
            }).done(function(result) {
                var resParsed = JSON.parse(result);
                if(resParsed.hasOwnProperty('error') && resParsed.error != 0) {
                    cb(resParsed.message);
                    return;
                }
                var tabModels = _.map(resParsed, function(row) {
                    return self.insert(row, process);
                });
                cb(null, tabModels);
            });
        }
        else {
            var ret = [];
            _.forEach(self.tabCachedModels, function(model) {
                var match = true;
                _.forEach(conds, function(condValue, condKey) {
                    if(!_.isArray(condValue))
                        condValue = [condValue];
                    if(condValue.indexOf(model._attrs[condKey]) === -1)
                        match = false;
                });
                if(match)
                    ret.push(model);
            });
            cb(null, ret);
        }
    },
    insert: function(row, process) {
        var self = this;
        if(self.tabCachedModels.hasOwnProperty(row.id))
            _.extend(self.tabCachedModels[row.id]._attrs, row);
        else
            self.tabCachedModels[row.id] = new window.cnpao.Model.Step(row, process);
        return self.tabCachedModels[row.id];
    }
});