var inherit = require('inherit');
var _ = require('underscore');

var Utils = inherit({}, {
    /**
     * Fonction qui traduit une condition en une requête SQL accompagnée de sa liste d'arguments
     * Si cond est une chaine de caractères : reste intacte.
     * Si cond est un objet, les clés seront considérés comme des noms de champs, et les valeurs comme la valeur recherchée. On fera un AND entre tous les éléments de l'objet.
     *                       si la valeur est un tableau, il sera utilisé dans une clause IN (...) 
     * Exemples :
     * "id=4 AND sal>4" : la condition est une chaîne de caractères, on renvoie tel quel : {where: "id=4 AND sal>4"}
     * {id: 5, sal: 4} : {where: "? AND ?", args: [{id: 5}, {sal: 4}]}
     * {id: 5, model3d_id: [4, 5, 6]} : {where: "id=? AND model3d_id IN (?,?,?)", args: [5, 4, 5, 6]}
     * 
     * @param {Object} cond la condition à traduire
     * @returns {Objet} un objet composé de deux champs :
     *                  -> dans le champ 'where' => requête générée
     *                  -> dans le champ 'args' => liste d'arguments générée
     */
    getQueryArgs: function(cond) {
        var query = '';
        var args = [];
        if(_.isString(cond)) {
            query = '?';
            args = [cond];
        }
        else {
            query = [];
            _.each(cond, function(value, key) {
                if(_.isArray(value)) {
                    var queryPart = key+' IN (';
                    var inMember = [];
                    _.each(value, function(value) {
                        inMember.push('?');
                        args.push(value);
                    });
                    queryPart += inMember.join(', ')+')';
                    query.push(queryPart);
                }
                else {
                    query.push('?');
                    var obj = {};
                    obj[key] = value;
                    args.push(obj);
                }
            }, this);
            query = query.join(' AND ');
        }
        return {
            where: query,
            args: args
        };
    }
});

module.exports = Utils;