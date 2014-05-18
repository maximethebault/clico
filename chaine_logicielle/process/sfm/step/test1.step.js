var Step = require('../../../Step');
var inherit = require('inherit');

var StepTest1 = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        console.log('step test1 created');
        setTimeout(this.done.bind(this), 5000);
    }
});

module.exports = StepTest1;