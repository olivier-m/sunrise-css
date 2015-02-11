/* jshint jquery:true */
(function($) {
    // Offcanvas handler
    $(function() {
        $('[data-toggle="offcanvas"]').click(function (evt) {
            evt.preventDefault();
            $('.offcanvas').toggleClass('active');
        });
    });
})(jQuery);
