window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.SyncSql = inherit({
    __constructor: function() {
        var self = this;
        setTimeout(function() {
            self.refreshModel3d();
        }, self.__self.refreshInterval);
    },
    refreshModel3d: function() {
        var self = this;
        window.cnpao.Model.Model3d.get(true, null, function() {
            setTimeout(function() {
                self.refreshModel3d();
            }, self.__self.refreshInterval);
        });
    }
}, {
    refreshInterval: 5000
});