var Process = require('../../Process');
var inherit = require('inherit');

var ProcessTest1 = inherit(Process, {
    __constructor: function(attrs, model3d) {
        this.__base(attrs, model3d);
        console.log('process test1 created '+attrs);
        console.log(Process);
    }
});

module.exports = ProcessTest1;