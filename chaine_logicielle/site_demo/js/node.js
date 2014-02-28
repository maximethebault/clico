$('.generate').on('click', 'body', function(e) {
    e.preventDefault();
    console.log('coucou');
    $('.template-download').find('.toggle:checked')
            .closest('.template-download')
            .find('.name').each(function() {
        console.log(this.text());
    });
    $('.generate').prop('checked', false);
});