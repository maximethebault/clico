window.cnpao = window.cnpao || {Model: {}, View: {}};

/**
 * Moyen d'obtenir un identifiant unique, se basant sur le temps
 * 
 * @returns {Number} l'identifiant unique
 */


/*$('body').on('click', '.generate', function(e) {
    e.preventDefault();
    var arrayFiles = [];
    $('.template-download').find('.toggle:checked').closest('.template-download').find('.name').each(function() {
        arrayFiles.push($(this).text().trim());
    });
    $('.generate').prop('checked', false);
    var sfm = new SFM();
    sfm.launch(arrayFiles);
    $(sfm).on('progress-update', function(eventName, progressManager) {
        $('#3d_status').text('Etape ' + progressManager.currentStepNb + '/' + progressManager.totalStepNb + ' : ' + progressManager.currentStepName);
        $('#3d_progress').css('width', progressManager.currentStepProgress + '%');
    });
    $(sfm).on('progress-error', function(eventName, progressManager) {
        $('#3d_status').text('Erreur : ' + progressManager.currentError);
    });
    $(sfm).on('progress-state', function(eventName, progressManager) {
        if(progressManager.state == ProgressManager.PAUSED)
            $('#3d_progress').addClass('progress-bar-danger').removeClass('progress-bar-info').removeClass('progress-bar-success');
        else if(progressManager.state == ProgressManager.DONE) {
            $('#3d_progress').addClass('progress-bar-success').removeClass('progress-bar-info');
            //nvm.0.ply
            $('#3d_status').html('Fini ! <a href="../data/1/nvm.0.ply">Télécharger</a>');
        }
        else
            $('#3d_progress').addClass('progress-bar-info').removeClass('progress-bar-danger').removeClass('progress-bar-success');
        //$('#3d_state').text('State : ' + progressManager.state);
    });
});*/