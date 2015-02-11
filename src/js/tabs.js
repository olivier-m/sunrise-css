/* jshint jquery:true */

(function($, window, document, undefined) {
    'use strict';

    var Tab = function(el) {
        this.element = $(el);
    };

    Tab.prototype.show = function() {
        var $this = this.element;

        if ($this.parent('li').hasClass('active')) {
            return;
        }

        var ul = $this.closest('ul');
        var selector = $this.data('target');
        if (!selector) {
            selector = $this.attr('href');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        if ($this.parent('li').hasClass('active')) {
            return;
        }

        var previous = ul.find('.active:last a')[0];
        var evt = $.Event('show.sr.tab', {
            relatedTarget: previous
        });

        $this.trigger(evt);

        if (evt.isDefaultPrevented()) {
            return;
        }

        var target = $(selector);

        target.parent().find('> .active').velocity({'opacity': 0}, 200).promise()
        .then(function(el) {
            $(el).removeClass('active').hide();
            target.addClass('active').css({'opacity': 0});
            ul.find('> .active').removeClass('active');
            $this.closest('li').addClass('active');
            return target.show().css('opacity', 0).velocity({'opacity': 1}, 300).promise();
        })
        .then(function() {
            $this.trigger({
                type: 'shown.sr.tab',
                relatedTarget: previous
            });
        });
    };

    var Plugin = function(option) {
        return this.each(function() {
            var $this = $(this);
            var instance = $this.data('sr.tab');
            if (!instance) {
                $this.data('sr.tab', (instance = new Tab(this)));
            }
            if (typeof option === 'string') {
                instance[option].call(instance);
            }
        });
    };

    $.fn.tab = Plugin;
    $.fn.tab.constructor = Tab;

    $(document).on('click.sr.tab', '[data-toggle=tab]', function(evt) {
        evt.preventDefault();
        Plugin.call($(this), 'show');
    });
})(jQuery, window, window.document);
