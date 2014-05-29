window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.View.Model3dConfigured = inherit({
    __constructor: function(model, $el) {
        this.model = model;
        this.$el = $el;
        this.updateView();
        /**
         * Mettre à jour la vue pouvant être une opération coûteuse, on limite à une update toutes les secondes
         */
        this.throttledUpdateView = _.throttle(this.updateView.bind(this), 1000, {
            leading: false
        });
        this.bindEvents();
    },
    updateView: function() {
        var self = this;
        var templateData = {
            id: self.model._attrs.id,
            process: {},
            step: {}
        };
        window.cnpao.Model.Process.get(false, {model3d_id: self.model._attrs.id}, self.model, function(err, res) {
            var idToLook = [];
            _.forEach(res, function(process) {
                templateData.process[process._attrs.spec_process_id] = process._attrs;
                idToLook.push(process._attrs.id);
            });
            window.cnpao.Model.Step.get(false, {process_id: idToLook}, null, function(err, res) {
                _.forEach(res, function(step) {
                    templateData.step[step._attrs.spec_step_id] = step._attrs;
                    if(templateData.step[step._attrs.spec_step_id].progress === 0 && templateData.step[step._attrs.spec_step_id].state >= window.cnpao.Constants.STATE_RUNNING)
                        templateData.step[step._attrs.spec_step_id].progress = 100;
                });
                if(self.$el)
                    self.$el.replaceWith(tmpl("template-model3d-progress", templateData));
                else
                    $('#model3d-list').prepend(tmpl("template-model3d-progress", templateData));
                self.$el = $('.model3d-progress-' + self.model._attrs.id);
            });
        });
    },
    uiUpdate: function(e, model3d_id) {
        var self = this;
        if(model3d_id == self.model._attrs.id)
            self.throttledUpdateView();
    },
    uiProgress: function(e, model3d_id, process_id, step_id, progress) {
        var self = this;
        if(model3d_id == self.model._attrs.id) {
            $('.progress-bar-' + step_id, self.$el).prop('aria-valuenow', progress);
            $('.progress-bar-' + step_id, self.$el).css('width', progress + '%');
        }
    },
    bindEvents: function() {
        $(document).on('ui-update', this.uiUpdate.bind(this));
        $(document).on('ui-progress', this.uiProgress.bind(this));
    },
    unbindEvents: function() {
        $(document).off('ui-update', this.uiUpdate.bind(this));
        $(document).off('ui-progress', this.uiProgress.bind(this));
    },
    destroy: function() {
        this.unbindEvents();
        this.$el.remove();
    },
    deleteModel: function() {
        this.model.del(function(err) {
            if(err === 0) {
                this.$el.remove();
            }
            else {
                //TODO: échec lors de la suppression du modèle, gérer l'erreur
            }
        }.bind(this));
    }
});