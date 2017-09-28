/*global require*/
(function () {
	'use strict';

	var Module = {};

	$.extend( Module, {
		init: function(){
			$( document ).click( '.toggle--menu', this.showMenu );
			$( document ).click( this.closeMenu );
			var self = this;

			$.ajax({ url: "https://amzcast.com/temps?website=us" })
				.done(function( data ) {
					var newData = [];
					_.each( data, function( value, key ){
						newData.push( self.parseData( value, key ) );
					});
					newData = newData.reverse();
					self.chartData = self.createChartArrays( newData );
					self.data = newData;
					self.render( self.data, self.chartData );
				})
				.fail( function( x,y,z ){
					alert( 'Cross-origin requests have been blocked. Using fake data.' );
					var fakeData = [78,71,66,64,57,60,71,71,81,81,91,93,96,96,96,97,98,95,97,96,99,91,93,91,77,82];
					var newData = [];
					_.each( fakeData, function( item, idx ){
						newData.push( self.parseData( item, moment().subtract( idx, 'days' ).format( 'YYYY-MM-DD' ) ) );
					});
					self.chartData = self.createChartArrays( newData );
					self.data = newData;
					self.render( self.data, self.chartData );
				});
		},
		parseData: function( value, key ){
			var item = {};
			item.date = key;
			item.value = value;
			item.dayOfWeek = moment( item.date ).format( 'dddd' );
			item.dayOfMonth = moment( item.date ).format( 'MMMM Do' );
			item.dateString = moment( item.date ).format( 'dddd MMM D, YYYY' );
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
			return item;
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
							return moment( item.xLabel ).format( 'MMM D, YYYY' );
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
		renderChart: function( data ){
			var ctx, historicChart;
			ctx = $( '#historic-chart' )[0].getContext('2d');
			historicChart = new Chart(ctx, {
			    type: 'bar',
				data: {
					labels: data.dateArray,
					datasets: [
						{
							data: data.valueArray,
							backgroundColor: '#F4C544',
						}
					]
				},
				options: this.chartOptions()
			});
		},
		renderWeek: function( data ){
			var template, compiler;
			template = $( '#weekTemplate' ).html();
			compiler = Handlebars.compile( template );
			$( '.home__past-week' ).html( compiler({ Day: data }) );
		},
		renderCurrent: function( data ){
			var template, compiler;
			template = $( '#dayTemplate' ).html();
			compiler = Handlebars.compile( template );
			$( '.home__current-temperature' ).html( compiler({ Day: data }) );
		},
		isLoaded: function(){
			$( '.content' ).whiteout( 'clear' );
		},
		render: function( data, chartData ){
			var self = this;
			setTimeout( function(){
				self.renderCurrent( data[0] );
				self.renderWeek( data.slice( 0, 7 ) );
				self.renderChart( chartData );
				_.defer( self.isLoaded );
			}, 600 );
		}
	});
	Module.init();
}());
