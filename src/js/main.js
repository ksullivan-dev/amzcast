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
		},
		parseData: function( data ){
			_.each( data, function( item ){
				item.dayOfWeek = Moment( item.date ).format( 'dddd' );
				item.dayOfMonth = Moment( item.date ).format( 'MMMM Do' );
				item.dateString = Moment( item.date ).format( 'dddd MMM d, YYYY' );
				item.displayTemp = item.value + '\xB0';
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
				data.push({ date: Moment().subtract( data.length, 'days' ), value: Math.floor( Math.random() * 40 ) + 60 });
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
							backgroundColor: 'rgba( 200, 200, 0, 0.5 )',
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
						label: function( item ){
							return item.yLabel + '\xB0';
						},
						title: function( item ){
							return "Amazon Temperature for " + Moment( item.xLabel ).format( 'MMM D, YYYY' );
						}
					}
				},
				scales: {
					xAxes: [{
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
						},
						scaleLabel: {
							display: true,
							labelString: 'Average Temperature'
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
