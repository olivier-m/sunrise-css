/* global $:true */

$(function() {
    $('pre.example-toggle').each(function() {
        var link = $('<a href="#">[+] view source</a>');
        var code = $(this);
        code.addClass('togglable');

        code.hide();
        code.after($('<p class="example-toggle"></p>').append(link));

        link.click(function(evt) {
            evt.preventDefault();
            code.toggle();
        });
    });

    var toggler = $('<button id="toggle-grid">Toggle grid</button>');
    $('#main').prepend(toggler);

    toggler.on('click', function(evt) {
        evt.preventDefault();
        $('body').toggleClass('show-grid');
    });
});
