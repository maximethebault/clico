window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.View.Model3d = inherit({},
{
    loadView: function() {
        window.cnpao.Model.Model3d.get(true, null, function(err, models) {
            if(err) {
                // TODO: afficher un message d'erreur si le chargement a échoué
                return;
            }
            _.forEach(models, function(model) {
                if(model._attrs.configured)
                    new window.cnpao.View.Model3dConfigured(model);
                else
                    new window.cnpao.View.Model3dUnconfigured(model);
            });
        });
    }
});