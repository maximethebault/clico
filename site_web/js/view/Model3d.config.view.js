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
            files: self.model._attrs.files,
            isDone: (self.model._attrs.state == window.cnpao.Constants.STATE_STOPPED && !self.model._attrs.error),
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
                    else if(templateData.step[step._attrs.spec_step_id].state === window.cnpao.Constants.STATE_STOPPED)
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
        window.cnpao.Model.Step.get(false, {id: step_id}, null, function(err, res) {
            if(res && res.length) {
                var step = res[0];
                var progress = step._attrs.progress;
                if(step._attrs.progress === 0 && step._attrs.state >= window.cnpao.Constants.STATE_RUNNING)
                    progress = 100;
                if(model3d_id == self.model._attrs.id) {
                    $('.progress-bar-' + step_id, self.$el).prop('aria-valuenow', progress);
                    $('.progress-bar-' + step_id, self.$el).css('width', progress + '%');
                }
            }
        });
    },
    bindEvents: function() {
        $(document).on('ui-update', this.uiUpdate.bind(this));
        $(document).on('ui-progress', this.uiProgress.bind(this));
        $(document).on('click', '.model3d-delete-' + this.model._attrs.id, this.deleteModel.bind(this));
    },
    unbindEvents: function() {
        $(document).off('ui-update', this.uiUpdate.bind(this));
        $(document).off('ui-progress', this.uiProgress.bind(this));
        $(document).off('click', '.model3d-delete-' + this.model._attrs.id, this.deleteModel.bind(this));
    },
    destroy: function() {
        var self = this;
        self.unbindEvents();
        self.$el.slideUp(function() {
            self.$el.remove();
        });
    },
    deleteModel: function() {
        var self = this;
        this.model.del(function(err) {
            self.destroy();
        });
    }
});