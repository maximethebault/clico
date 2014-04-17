window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.View.Model3d = inherit({
    __constructor: function(model) {
        this.model = model;
        $('#photos_in').prepend(tmpl("template-uploader", {id: model.id}));
        // on met un dollar devant le nom de la variable pour mettre en valeur le fait qu'elle est passée par jQuery
        this.$el = $('.uploader[data-id=' + model.id + ']');
        $('.fileupload', this.$el).fileupload({
            url: 'server/php/libs/UploadHandler/',
            // lorsqu'on uploadera un fichier, on enverra avec l'ID du Model3d associé au fichier
            formData: {mid: model.id},
            dropZone: $('.fileupload', this.$el),
            disableImagePreview: true,
            disableImageLoad: true,
            disableImageHead: true,
            disableExif: true,
            disableExifThumbnail: true,
            disableExifSub: true,
            disableExifGps: true,
            disableImageMetaDataLoad: true,
            disableImageMetaDataSave: true,
            disableAudioPreview: true,
            disableVideoPreview: true,
            maxChunkSize: 5000000, // 5 MB
            add: function(e, data) {
                var that = this;
                $.getJSON('server/php/libs/UploadHandler/', {file: data.files[0].name, mid: model.id}, function(result) {
                    var file = result.file;
                    data.uploadedBytes = file && file.size;
                    $.blueimp.fileupload.prototype
                            .options.add.call(that, e, data);
                });
            }
        });
        $('.fileupload', this.$el).fileupload('option', 'done').call($('.fileupload', this.$el), $.Event('done'), {result: {files: this.model.files}});
        this.bindEvents();
        
        this.params = new window.cnpao.View.Params(this.model.params, this);
    },
    bindEvents: function() {
        $('.delete-model3d', this.$el).on('click', this.deleteModel.bind(this));
        $('.generate', this.$el).on('click', this.generate.bind(this));
    },
    unbindEvents: function() {
        $('.delete-model3d', this.$el).off('click');
        $('.generate', this.$el).off('click');
    },
    deleteModel: function() {
        this.model.del(function(err) {
            if(err == 0) {
                this.$el.remove();
                this.unbindEvents();
            }
            else {
                //TODO: échec lors de la suppression du modèle, gérer l'erreur
            }
        }.bind(this));
    },
    generate: function(e) {
        e.preventDefault();
        var sfm = new window.cnpao.Model.SFM();
        this.model.addProcess(sfm);
        this.model.launch();
        this.$el.on('progress-update', function(eventName, progressManager) {
            $('#3d_status', this.$el).text('Etape ' + progressManager.currentStepNb + '/' + progressManager.totalStepNb + ' : ' + progressManager.currentStepName);
            $('#3d_progress', this.$el).css('width', progressManager.currentStepProgress + '%');
        }.bind(this));
        this.$el.on('progress-error', function(eventName, progressManager) {
            $('#3d_status', this.$el).text('Erreur : ' + progressManager.currentError);
        }.bind(this));
        this.$el.on('progress-state', function(eventName, progressManager) {
            if(progressManager.state == window.cnpao.ProgressManager.PAUSED)
                $('#3d_progress', this.$el).addClass('progress-bar-danger').removeClass('progress-bar-info').removeClass('progress-bar-success');
            else if(progressManager.state == window.cnpao.ProgressManager.DONE) {
                $('#3d_progress', this.$el).addClass('progress-bar-success').removeClass('progress-bar-info');
                $('#3d_status', this.$el).html('Fini ! <a href="../data/' + this.model.id + '/nvm.0.ply">Télécharger</a>');
            }
            else
                $('#3d_progress', this.$el).addClass('progress-bar-info').removeClass('progress-bar-danger').removeClass('progress-bar-success');
        }.bind(this));
    }
},
{
    create: function() {
        var model = new window.cnpao.Model.Model3d();
        model.create(function() {
            new window.cnpao.View.Model3d(model);
        });
    },
    loadView: function() {
        window.cnpao.Model.Model3d.loadAjax(function(err, models) {
            if(err) {
                // TODO: afficher un message d'erreur si le chargement a échoué
                return;
            }
            _.forEach(models, function(model) {
                new window.cnpao.View.Model3d(model);
            });
        });
    }
});

$('#photos').on('click', '.add-model3d', window.cnpao.View.Model3d.create);