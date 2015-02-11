/* jshint jquery:true */

(function($, window, document, undefined) {
    'use strict';

    var backdrop = '.dropdown-backdrop';
    var toggle_selector = '[data-toggle=dropdown]';

    var Dropdown = function(el) {
        this.btn = $(el);
        if (this.btn.data('target-selector')) {
            this.menu = $(this.btn.data('target-selector'));
        } else {
            this.menu = this.btn.next('ul[role=menu]');
        }

        if (this.menu.length !== 1) {
            return;
        }

        this.is_valid = true;
        this.btn.data('is-open', false);
        this.menu.data('dropdown-instance', this);
        this.menu.addClass('f-dropdown');
    };

    Dropdown.prototype.init = function() {
        this.btn.on('click.sr.dropdown', toggle);
    };

    Dropdown.prototype.show = function() {
        var sy = $(window).scrollTop();
        var sx = $(window).scrollLeft();
        var offset = this.btn.offset();
        var py = offset.top - sy;
        var px = offset.left - sx;
        var ly = $(window).height() - py - this.btn.innerHeight();
        var lx = $(window).width() - px;

        var mh = this.menu.innerHeight();
        var mw = this.menu.innerWidth();

        var p = ((mh > ly) ? 't' : 'b') + ((mw > lx) ? 'r' : 'l');
        var pos = this.btn.position();

        var menu_position = {top: pos.top + this.btn.innerHeight() + 5, left: pos.left};

        // no negative position
        var top_offset = pos.top - mh - 5;
        var right_offset = menu_position.left + this.btn.innerWidth() - mw;

        if (p[0] === 't' && top_offset < 0) {
            p = 'b' + p[1];
        }
        if (p[1] === 'r' && right_offset < 0) {
            p = p[0] + 'l';
        }

        // set position
        if (p[0] === 't') {
            menu_position.top = top_offset;
        }

        if (p[1] === 'r') {
            menu_position.left = right_offset;
        }

        this.btn.trigger('show.sr.dropdown');

        if ('ontouchstart' in document.documentElement) {
            // if mobile we use a backdrop because click events don't delegate
            $('<div class="dropdown-backdrop"/>').insertAfter(this.btn).on('click', clearMenus);
        }

        this.menu.css(menu_position)
        .removeClass('f-dropdown-tl f-dropdown-tr f-dropdown-bl f-dropdown-br')
        .addClass('f-dropdown-' + p);

        this.btn.data('is-open', true).trigger('focus');
        this.btn.trigger('shown.sr.dropdown');
    };

    Dropdown.prototype.hide = function() {
        if (!this.btn.data('is-open')) {
            return;
        }

        this.btn.trigger('hide.sr.dropdown');
        this.menu.css({'left': '-9999px'});
        this.btn.data('is-open', false);
        $(backdrop).remove();
        this.btn.trigger('hidden.sr.dropdown');
    };

    var getInstance = function(el, init) {
        init = typeof(init) !== 'undefined' ? init : false;
        var data = $(el).data('sr.dropdown');
        if (!data) {
            $(el).data('sr.dropdown', (data = new Dropdown(el)));
            if (init) {
                data.init();
            }
        }
        return data;
    };

    var toggle = function(evt) {
        var instance = getInstance(evt.target);
        if (!instance.is_valid) {
            return;
        }

        clearMenus($.Event('click.sr.dropdown', {target: evt.target}));
        evt.preventDefault();
        evt.stopPropagation();

        if (!instance.btn.data('is-open')) {
            instance.show();
        } else {
            instance.hide();
        }
    };

    var keydown = function(evt) {
        if (!/(38|40|27)/.test(evt.keyCode)) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        var instance = $(evt.target).data('sr.dropdown');
        if (!instance) {
            instance = $(evt.target).data('dropdown-instance');
            if (!instance) {
                $(evt.target).parents().each(function() {
                    instance = $(this).data('dropdown-instance');
                    if (typeof(instance) !== 'undefined') {
                        return false;
                    }
                });
            }
        }
        if (!instance) {
            return;
        }

        if (evt.keyCode === 27 && instance.btn.data('is-open')) {
            instance.hide();
            instance.btn.trigger('focus');
            return;
        }

        var items = instance.menu.find('li:not(.divider):visible a, li:not(.divider):visible button');
        if (items.length === 0) {
            return;
        }

        var index = items.index(items.filter(':focus'));
        if (evt.keyCode === 38) {
            index = index > 0 ? index - 1 : items.length - 1;
        } else if (evt.keyCode === 40) {
            index = index < items.length - 1 ? index + 1 : 0;
        }

        items.eq(index).trigger('focus');
    };

    var clearMenus = function(evt) {
        if (evt && evt.which === 3) {
            return;
        }

        $(toggle_selector).each(function() {
            var $this = $(this);
            if (this !== evt.target) {
                $this.dropdown('hide');
            }
        });
    };

    var Plugin = function(option) {
        return this.each(function () {
            var instance = getInstance(this, true);
            if (typeof option === 'string') {
                instance[option].call(instance);
            }
        });
    };

    $.fn.dropdown = Plugin;
    $.fn.dropdown.Constructor = Dropdown;

    $(document)
    .on('click.sr.dropdown', clearMenus)
    .on('click.sr.dropdown', toggle_selector, toggle)
    .on('keydown.sr.dropdown', toggle_selector + ', [role=menu]', keydown);

})(jQuery, window, window.document);
