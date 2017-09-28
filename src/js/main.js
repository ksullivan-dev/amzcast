/*global require*/
(function () {
	'use strict';

	var $         = require('jquery'),
		_         = require('lodash'),
		Moment    = require('moment'),
		Chart     = require('chart.js'),
		LoadCSS   = require('fg-loadcss'),
		Templates = require('../templates/'),
		Module    = {};

	$.extend( Module, {
		init: function(){
			this.chartData = this.createChartArrays( this.fakeData() );
			this.data = this.parseData( this.fakeData() );
			this.renderCurrent( this.data[0] );
			this.renderWeek( this.data.slice( 0, 7 ) );
			this.renderChart();
			$( document ).click( '.toggle--menu', this.showMenu );
			$( document ).click( this.closeMenu );
		},
		showMenu: function( e ){
			var el = $( e.target );
			if( ! el.hasClass( 'header__icon' ) ){
				el = el.closest( '.header__icon' );
			}
			el[ el.hasClass( 'open' ) ? 'removeClass' : 'addClass' ]( 'open' );
			el.siblings( '.header__menu' ).toggleClass( 'collapsed' );
		},
		closeMenu: function( e ){
			if( $( '.header__icon' ).hasClass( 'open' ) && ! $( e.target ).closest( '.header' ).length ){
				e.preventDefault();
				$( '.header__icon' ).removeClass( 'open' );
				$( '.header__menu' ).addClass( 'collapsed' );
			}
		},
		parseData: function( data ){
			_.each( data, function( item ){
				item.dayOfWeek = Moment( item.date ).format( 'dddd' );
				item.dayOfMonth = Moment( item.date ).format( 'MMMM Do' );
				item.dateString = Moment( item.date ).format( 'dddd MMM D, YYYY' );
				item.displayTemp = item.value + '\xB0';
				if( item.value >= 85 ){
					item.condition = "Very Dynamic";
					item.iconSlug = 'sunny';
				} else if( item.value < 85 && item.value >= 75 ){
					item.condition = "Somewhat Dynamic";
					item.iconSlug = 'partlycloudy';
				} else if( item.value < 75 && item.value >= 65 ){
					item.condition = "Perfectly Average";
					item.iconSlug = 'cloudy';
				} else if( item.value < 65 && item.value >= 55 ){
					item.condition = "Somewhat Calm";
					item.iconSlug = 'extracloudy';
				} else if( item.value < 55 ){
					item.condition = "Very Calm";
					item.iconSlug = 'snowy';
				}
			});
			return data;
		},
		createChartArrays: function( data ){
			var chartData = {
				dateArray: [],
				valueArray: []
			};
			_.each( data, function( item ){
				chartData.dateArray.push( item.date );
				chartData.valueArray.push( item.value );
			});
			return chartData;
		},
		fakeData: function(){
			var data = [];
			while( data.length < 30 ){
				data.push({ date: Moment().subtract( data.length, 'days' ), value: Math.floor( Math.random() * 50 ) + 50 });
			}
			return data;
		},
		renderChart: function( ){
			var self, ctx, historicChart;
			self = this;
			ctx = $( '#historic-chart' )[0].getContext('2d');
			historicChart = new Chart(ctx, {
			    type: 'bar',
				data: {
					labels: self.chartData.dateArray,
					datasets: [
						{
							data: self.chartData.valueArray,
							backgroundColor: '#F4C544',
						}
					]
				},
				options: this.chartOptions()
			});
		},
		chartOptions: function(){
			return {
				responsive: true,
				legend: {
					display: false
				},
				tooltips: {
					mode: 'index',
					callbacks: {
						label: function(){
							return '';
						},
						beforeTitle: function( item ){
							return Moment( item.xLabel ).format( 'MMM D, YYYY' );
						},
						title: function( item ){
							return "Amazon Temperature: " + item[0].yLabel + '\xB0';
						}
					}
				},
				scales: {
					xAxes: [{
						barPercentage: 1.0,
						gridLines: {
							display: false,
						},
						ticks: {
							display: false
						}
					}],
					yAxes: [{
						ticks: {
							min: 40
						}
					}]
				}
			};
		},
		renderWeek: function( data ){
			$( '.home__past-week' ).html( Templates.week({ Day: data }) );
		},
		renderCurrent: function( data ){
			$( '.home__current-temperature' ).html( Templates.day({ Day: data }) );
		}
	});
	Module.init();
}());
