var inherit = require('inherit');
var Step = require('./Step');
var _ = require('underscore');
var Utils = require('./Utils');
var Constants = require('./Constants');
var sqlCon = global.sqlCon;

var User = inherit({
    __constructor: function(attrs) {
        this._attrs = attrs;
        console.info('[User] Utilisateur (ID = ' + this._attrs.id + ') créé');
    },
    update: function(fields, cb) {
        var self = this;
        // on met à jour les attributs de l'objet
        _.extend(self._attrs, fields);
        sqlCon.query('UPDATE user SET ? WHERE id=?', [fields, self._attrs.id], function(err) {
            if(err) {
                var message = '[User] Erreur lors de la mise à jour de l\'enregistrement ' + self._attrs.id + ' en BDD : ' + err + '.';
                console.error(message);
                if(cb)
                    cb(new Error(message), null);
                return;
            }
            if(cb)
                cb(null);
        });
    },
    /**
     * Vérifie si le mot de passe fourni et le mot de passe en BDD correspondent
     * 
     * @returns {boolean} true si c'est bon, false sinon
     */
    verify: function(password) {
        return (password && password === this._attrs.password);
    },
    removeCache: function() {
        this.__self.removeCache(this._attrs.id);
    }
}, {
    tabCachedModels: {},
    get: function(cond, cb) {
        var self = this;
        var queryArgs = Utils.getQueryArgs(cond);
        sqlCon.query('SELECT * FROM user WHERE ' + queryArgs.where, queryArgs.args, function(err, rows) {
            if(err) {
                var message = '[User] Erreur lors de la récupération des enregistrements en BDD : ' + err + '.';
                console.error(message);
                cb(new Error(message), null);
                return;
            }
            var tabModels = _.map(rows, function(row) {
                if(self.tabCachedModels.hasOwnProperty(row.id))
                    _.extend(self.tabCachedModels[row.id]._attrs, row);
                else
                    self.tabCachedModels[row.id] = new User(row);
                return self.tabCachedModels[row.id];
            });
            cb(null, tabModels);
        });
    },
    /**
     * Pour pouvoir ré-utiliser les mêmes objects entre chaque pause, ils sont mis en cache dans des tableaux associatifs (en JavaScript, ce sont tout simplement des objets) : tabCachedModels
     * On peut rencontrer les mêmes problèmes qu'en Java : tant qu'on garde une référence vers un objet, il ne sera pas nettoyé par le Garbage Collector : c'est donc le problème que résout cette fonction
     */
    removeCache: function(id) {
        delete this.tabCachedModels[id];
    }
});

module.exports = User;