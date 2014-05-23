var Step = require('../../../Step');
var inherit = require('inherit');

var StepTest1 = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        this.timeout = null;
    },
    start: function(cb) {
        var self = this;
        self.__base(function(err) {
            self._process._model3d.file({code: ['sfmImages']}, function(err, res) {
                console.log(res);
            });
            self.timeout = setTimeout(function() {
                self.done(function(err) {
                    self.timeout = null;
                    console.log('youhou');
                    if(err)
                        console.log("[Step] N'a pas pu mettre fin à la Step : " + err);
                });
            }, 10000);
            cb(err);
        });
    },
    pause: function(hurry, cb) {
        var self = this;
        self.__base(hurry, cb);
        if(hurry) {
            self.kill();
        }
    },
    stop: function(cb) {
        var self = this;
        self.__base(cb);
        self.kill();
    },
    kill: function() {
        var self = this;
        if(self.timeout)
            clearTimeout(self.timeout);
        self.done(function(err) {
            console.error('[Step] La step n\'a pas réussi à se terminer');
        });
    }
});

module.exports = StepTest1;