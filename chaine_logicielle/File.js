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
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        self._attrs = _.extend(self._attrs, fields);
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
    get: function(cond, process, cb) {
        var queryArgs = Utils.getQueryArgs(cond);
        sqlCon.query('SELECT f.*, sf.code FROM file f INNER JOIN spec_file sf ON f.spec_file_id=sf.id WHERE ' + queryArgs.where, queryArgs.args, function(err, rows) {
            if(err) {
                var message = '[File] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
            }
            else {
                var tabKeys = [];
                var tabModels = _.map(rows, function(row) {
                    tabKeys.push(row.code);
                    return new File(row, process);
                });
                cb(null, _.object(tabKeys, tabModels));
            }
        });
    }
});

module.exports = File;