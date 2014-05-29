window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.SyncSql = inherit({
    __constructor: function() {
        console.info('[Sync] Fallback sur SQL');
    }
});