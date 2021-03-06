var inherit = require('inherit');
var _ = require('underscore');
var Utils = require('./Utils');
var Constants = require('./Constants');
var sqlCon = global.sqlCon;

var Param = inherit({
    __constructor: function(attrs, model3d) {
        /*
         * Step a pour vocation d'être étendue, c'est pourquoi tous ses champs sont précédés d'un underscore : on évite ainsi que des champs se fassent écrasés, ce qui pourrait produire des bugs bizarres
         */
        this._attrs = attrs;
        this._model3d = model3d;
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        _.extend(self._attrs, fields);
        sqlCon.query('UPDATE param SET ? WHERE id=?', [fields, self._attrs.id], function(err) {
            if(err) {
                var message = '[Param] Erreur lors de la mise à jour de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
                return;
            }
            cb(null);
        });
    }
}, {
    tabCachedModels: {},
    get: function(cond, model3d, cb) {
        var self = this;
        var model3d_id = cond.model3d_id;
        var queryArgs = Utils.getQueryArgs(_.omit(cond, 'model3d_id'));
        sqlCon.query('SELECT p.*, sp.code, sp.value_default FROM spec_param sp LEFT JOIN param p ON p.spec_param_id=sp.id AND p.model3d_id=' + model3d_id + ' WHERE (p.id IS NULL OR p.model3d_id=' + model3d_id + ') AND (' + queryArgs.where + ')', queryArgs.args, function(err, rows) {
            if(err) {
                var message = '[Param] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
            }
            else {
                var tabKeys = [];
                var tabModels = _.map(rows, function(row) {
                    tabKeys.push(row.code);
                    if(!row.id)
                        return new Param(row, model3d);
                    if(self.tabCachedModels.hasOwnProperty(row.id))
                        _.extend(self.tabCachedModels[row.id]._attrs, row);
                    else
                        self.tabCachedModels[row.id] = new Param(row, model3d);
                    return self.tabCachedModels[row.id];
                });
                cb(null, _.object(tabKeys, tabModels));
            }
        });
    },
    /**
     * Pour pouvoir ré-utiliser les mêmes objects entre chaque pause, ils sont mis en cache dans des tableaux associatifs (en JavaScript, ce sont tout simplement des objets) : tabCachedModels
     * On peut rencontrer les mêmes problèmes qu'en Java : tant qu'on garde une référence vers un objet, il ne sera pas nettoyé par le Garbage Collector : c'est donc le problème que résout cette fonction
     */
    removeCache: function(model3d) {
        _.forEach(this.tabCachedModels, function(cachedModel, index) {
            if(cachedModel._model3d == model3d)
                delete this.tabCachedModels[index];
        }, this);
    }
});

module.exports = Param;