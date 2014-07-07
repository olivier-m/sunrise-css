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
            code.slideToggle({
                duration: 200,
                complete: function() {
                    if (code.is(':visible')) {
                        link.text('[-] hide source');
                    } else {
                        link.text('[+] view source');
                    }
                }
            });
        });
    });
});
