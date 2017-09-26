/*global module,require,global,setTimeout,jQuery*/
global.jQuery = require( 'jquery' );
( function( $ ) {
    'use strict';
    $.fn.whiteout = function ( type, options ) {
        var self, settings;

        if( typeof type === 'object' && type !== 'null' && typeof type && type ){
            options = type;
        }
        self = this;
        settings = $.extend({
            whiteoutColor : '#ffffff',
            opacity       : 1,
            speed         : '600ms',
            endOpacity    : 0,
            loadingText   : '',
            delay         : '0',
            loadingIcon   : ''
        }, options );

        function clearWhiteout(){
            self.children( '.whiteout__inner' ).css({ 'opacity' : settings.endOpacity, 'transition-duration' : settings.speed, 'transition-delay' : settings.delay });
            setTimeout( function(){
                self.removeClass( 'whiteout' ).css( 'position', '' );
                self.children( '.whiteout__inner' ).remove();
            }, parseFloat( settings.speed ) + parseFloat( settings.delay ) );
        }

        if( type === 'clear' ){
            clearWhiteout();
            return false;
        }

        if( type === 'selfClearing' ){
            setTimeout( clearWhiteout, 0 );
        }

        if( this.css( 'position' ) !== 'static' ){
            this.css( 'position', this.css( 'position' ) );
        }

        this.addClass( 'whiteout' );

        if( this.children( '.whiteout__inner' ).length === 0 ){
            this.prepend( '<div class="whiteout__inner" />' );
            if( settings.loadingIcon ){
                this.find( '.whiteout__inner' ).append( '<span class="loading loading--icon">' + settings.loadingIcon + '</span>' );
            } else if( settings.loadingText ){
                this.find( '.whiteout__inner' ).append( '<span class="loading loading--text">' + settings.loadingText + '</span>' );
            }
        }

        this.children( '.whiteout__inner' ).css({
            'background' : settings.whiteoutColor,
            'opacity'    : settings.opacity
        });

        return this;
    };
}( jQuery ));
