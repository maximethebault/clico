$('#photos').on('click', '.add-model3d', function() {
    // TODO: donner la possibilité de nommer le modèle, et l'envoyer dans le champ 'data' qui suit
    var model = new window.cnpao.Model3d();
    model.create(function() {
        $('#photos').prepend(tmpl("template-uploader", {id: model.id}));
        // on met un dollar devant le nom de la variable pour mettre en valeur le fait qu'elle est passée par jQuery
        var $uploader = $('.uploader[data-id=' + model.id + ']');
        $('.fileupload', $uploader).fileupload({
            url: 'server/php/libs/UploadHandler/',
            // lorsqu'on uploadera un fichier, on enverra avec l'ID du Model3d associé au fichier
            formData: {mid: model.id}
        });
        $('.delete-model3d', $uploader).on('click', function(e) {
            model.del(function(err) {
                if(err == 0)
                    $uploader.remove();
            });
        });
        $('.generate', $uploader).on('click', function(e) {
            e.preventDefault();
            var sfm = new window.cnpao.SFM();
            model.addProcess(sfm);
            model.launch();
            $uploader.on('progress-update', function(eventName, progressManager) {
                $('#3d_status', $uploader).text('Etape ' + progressManager.currentStepNb + '/' + progressManager.totalStepNb + ' : ' + progressManager.currentStepName);
                $('#3d_progress', $uploader).css('width', progressManager.currentStepProgress + '%');
            });
            $uploader.on('progress-error', function(eventName, progressManager) {
                $('#3d_status', $uploader).text('Erreur : ' + progressManager.currentError);
            });
            $uploader.on('progress-state', function(eventName, progressManager) {
                if(progressManager.state == window.cnpao.ProgressManager.PAUSED)
                    $('#3d_progress', $uploader).addClass('progress-bar-danger').removeClass('progress-bar-info').removeClass('progress-bar-success');
                else if(progressManager.state == window.cnpao.ProgressManager.DONE) {
                    $('#3d_progress', $uploader).addClass('progress-bar-success').removeClass('progress-bar-info');
                    //nvm.0.ply
                    $('#3d_status', $uploader).html('Fini ! <a href="../data/'+model.id+'/nvm.0.ply">Télécharger</a>');
                }
                else
                    $('#3d_progress', $uploader).addClass('progress-bar-info').removeClass('progress-bar-danger').removeClass('progress-bar-success');
                //$('#3d_state').text('State : ' + progressManager.state);
            });
        });
    });
});