var Process = require('../../Process');
var inherit = require('inherit');

var ProcessPoisson = inherit(Process, {
    __constructor: function(attrs, model3d) {
        this.__base(attrs, model3d);
    }
});

module.exports = ProcessPoisson;