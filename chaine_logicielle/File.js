var inherit = require('inherit');
var _ = require('underscore');
var Utils = require('./Utils');
var Constants = require('./Constants');
var sqlCon = global.sqlCon;

var File = inherit({
    __constructor: function(attrs, model3d) {
        /*
         * Step a pour vocation d'être étendue, c'est pourquoi tous ses champs sont précédés d'un underscore : on évite ainsi que des champs se fassent écrasés, ce qui pourrait produire des bugs bizarres
         */
        this._attrs = attrs;
        this._model3d = model3d;
    },
    getName: function() {
        var nameSplit = this._attrs.path.split(/\\|\//);
        return nameSplit.pop();
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        _.extend(self._attrs, fields);
        sqlCon.query('UPDATE file SET ? WHERE id=?', [fields, self._attrs.id], function(err) {
            if(err) {
                var message = '[File] Erreur lors de la mise à jour de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
                return;
            }
            cb(null);
        });
    }
}, {
    tabCachedModels: {},
    /**
     * Récupère des File depuis la base de données
     * 
     * @param {String|Object} cond la condition de sélection
     * @param {Model3d} model3d le Model3d parent
     * @param {Function} cb fonction de callback(err,res)
     * @returns {Object} les File indexés suivant leurs codes. Des File avec le même code sont regroupés dans un tableau.
     */
    get: function(cond, model3d, cb) {
        var self = this;
        var queryArgs = Utils.getQueryArgs(cond);
        sqlCon.query('SELECT f.*, sf.code, sf.multiplicity_min FROM file f INNER JOIN spec_file sf ON f.spec_file_id=sf.id WHERE ' + queryArgs.where + ' ORDER BY sf.code', queryArgs.args, function(err, rows) {
            if(err) {
                var message = '[File] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
            }
            else {
                var objModels = {};
                _.each(rows, function(row) {
                    if(self.tabCachedModels.hasOwnProperty(row.id))
                        _.extend(self.tabCachedModels[row.id]._attrs, row);
                    else
                        self.tabCachedModels[row.id] = new File(row, model3d);
                    var file = self.tabCachedModels[row.id];
                    if(objModels.hasOwnProperty(row.code)) {
                        objModels[row.code].push(file)
                    }
                    else {
                        if(row.multiplicity_min > 1 || row.multiplicity_min === 0) {
                            objModels[row.code] = [file];
                        }
                        else {
                            objModels[row.code] = file;
                        }
                    }
                });
                cb(null, objModels);
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
        });
    }
});

module.exports = File;