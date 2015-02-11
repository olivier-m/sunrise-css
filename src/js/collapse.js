/* jshint jquery:true */

(function($, window, document, undefined) {
    'use strict';

    var Collapse = function(el) {
        this.element = $(el);

        var selector = this.element.data('target');
        if (!selector) {
            selector = this.element.attr('href');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        this.target = $(selector);
    };

    Collapse.prototype.toggle = function() {
        if (this.target.is(':visible')) {
            this.hide();
        } else {
            this.show();
        }
    };

    Collapse.prototype.show = function() {
        var h = this.target.height();
        this.target.css({
            'visibility': 'visible',
            'overflow': 'hidden',
            'height': 0
        })
        .show()
        .velocity({'height': h}, 200).promise()
        .then(function(el) {
            $(el).css({'overflow': '', 'height': ''});
        });
    };

    Collapse.prototype.hide = function() {
        this.target.css({'overflow': 'hidden'})
        .velocity({'height': 0}, 200).promise()
        .then(function(el) {
            $(el).hide().css({
                'overflow': '',
                'height': '',
                'visibility': 'hidden'
            });
        });
    };

    var Plugin = function(option) {
        return this.each(function() {
            var $this = $(this);
            var instance = $this.data('sr.collapse');
            if (!instance) {
                $this.data('sr.collapse', (instance = new Collapse(this)));
            }
            if (typeof option === 'string') {
                instance[option].call(instance);
            }
        });
    };

    $.fn.collapse = Plugin;
    $.fn.collapse.constructor = Collapse;

    $(document).on('click.sr.collapse', '[data-toggle=collapse]', function(evt) {
        evt.preventDefault();
        Plugin.call($(this), 'toggle');
    });
})(jQuery, window, window.document);
