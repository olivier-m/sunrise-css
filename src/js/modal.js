/* jshint jquery:true */

;(function($, window, document, undefined) {
    'use strict';

    var overlay = null;
    var backdrop = null;
    var current = null;

    var Modal = function(el) {
        this.element = $(el);
        this.target = null;
        this.target_parent = null;
        this.target_next = null;
    };

    Modal.prototype._set_target = function() {
        this._reset_target();
        var $this = this.element;

        var selector = $this.data('target');
        if (!selector) {
            selector = $this.attr('href');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        if (!selector) {
            return;
        }

        var target = $(selector);
        if (target.length === 0) {
            return;
        }
        this.target = target;
        this.target_parent = target.parent();
        this.target_next = target.next();
    };

    Modal.prototype._reset_target = function() {
        this.target = this.target_parent = this.target_next = null;
    };

    Modal.prototype.open = function() {
        _close();
        this._set_target();
        if (!this.target) {
            return;
        }

        var self = this;
        var $this = this.element;

        return _showOverlay()
        .then(function() {
            $this.trigger({
                type: 'show.sr.modal',
                relatedTarget: self.target[0]
            });
            return self._showModal();
        })
        .then(function() {
            $('<button class="modal-close" data-toggle="modal-close"><i /></button>')
            .appendTo(self.target);

            $this.trigger({
                type: 'shown.sr.modal',
                relatedTarget: self.target[0]
            });
        });
    };

    Modal.prototype.close = function() {
        var self = this;
        var $this = this.element;

        $this.trigger({
            type: 'close.sr.modal',
            relatedTarget: this.target[0]
        });

        return this._hideModal().then(function() {
            $('.modal-close', self.target).remove();
            $this.trigger({
                type: 'closed.sr.modal',
                relatedTarget: self.target[0]
            });
            self._reset_target();
            return _hideOverlay();
        });
    };

    Modal.prototype._showModal = function() {
        current = this;
        overlay.append(this.target);
        this.target.append(this.close_button);

        return this.target.css({'top': -(this.target.height())})
        .velocity({'top': 0}, 250).promise();
    };

    Modal.prototype._hideModal = function() {
        current = null;
        var self = this;

        return this.target.velocity({
            'top': -(this.target.height() + this.target.offset().top)
        }, 100).promise()
        .then(function() {
            if (self.target_next.length > 0) {
                self.target.insertBefore(self.target_next);
            } else {
                self.target_parent.append(self.target);
            }
        });
    };

    var _showOverlay = function() {
        if (!overlay) {
            overlay = $('<div class="modal-overlay" />');
            backdrop = $('<div class="modal-backdrop" />').appendTo(overlay)
            .on('click.sr.overlay', _close);

            $('body').append(overlay);
        }

        if (overlay.is(':visible')) {
            return $.fn.promise();
        }

        $('body').addClass('modal-lock');
        overlay.show();
        return backdrop.css('opacity', 0)
        .velocity({'opacity': 0.8}, 250).promise();
    };

    var _hideOverlay = function() {
        if (!overlay || !overlay.is(':visible')) {
            return $.fn.promise();
        }

        return backdrop.velocity({'opacity': 0}, 150).promise()
        .then(function() {
            overlay.hide();
            $('body').removeClass('modal-lock');
        });
    };

    var _close = function(evt) {
        if (evt) {
            evt.preventDefault();
        }
        if (current) {
            current.close();
        }
    };

    var openImage = function(el) {
        if (!el.data('target')) {
            var modal = $('<div class="modal modal-loading"><span>...</span></div>');
            el.data('target', modal);
            $('body').append(modal);
            el.one('shown.sr.modal', function() {
                $('<img src="' + el.attr('href') + '" alt="" />').hide().appendTo('body')
                .one('load.sr.modal', function() {
                    modal.addClass('modal-image').removeClass('modal-loading');
                    $('span', modal).remove();
                    modal.prepend($(this).show());
                });
            });
        }

        Plugin.call(el, 'open');
    };

    var keydown = function(evt) {
        if (evt.keyCode === 27 && current) {
            evt.preventDefault();
            evt.stopPropagation();
            current.close();
        }
    };

    var Plugin = function(option) {
        return this.each(function() {
            var $this = $(this);
            var instance = $this.data('rs.modal');
            if (!instance) {
                $this.data('rs.modal', (instance = new Modal(this)));
            }
            if (typeof option === 'string') {
                instance[option].call(instance);
            }
        });
    };

    $.fn.modal = Plugin;
    $.fn.modal.constructor = Modal;

    $(document)
    .on('click.sr.modal', '[data-toggle=modal]', function(evt) {
        evt.preventDefault();
        Plugin.call($(this), 'open');
    })
    .on('keydown.sr.modal', keydown)
    .on('click.sr.modal', '[data-toggle=modal-close]', _close);

    $(document)
    .on('click.sr.modal-image', '[data-toggle=modal-image]', function(evt) {
        if (!evt.metaKey) {
            evt.preventDefault();
            openImage($(this));
        }
    });
})(jQuery, window, document, undefined);
