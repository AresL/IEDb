
// The star-rating used when the Exercise is unsolved. Rating is disabled
$("#inactive_rating").rating({
	stars: 4,
	min: 0,
	max: 4,
	step: 1,
	disabled: true,
	clearCaption: 'Rate after solving',
	starCaptions: {
		1: 'Very Easy ',
		2: 'Easy      ',
		3: 'Hard      ',
		4: 'Very Hard '
	},
	starCaptionClasses: {
		1: 'label label-success',
		2: 'label label-primary',
		3: 'label label-warning',
		4: 'label label-danger'
	}
});
	
// The star-rating used when the Exercise is solved but unrated yet
$("#active_rating").rating({
	stars: 4,
	min: 0,
	max: 4,
	step: 1,
	clearCaption: 'Rate this Exercise',
	starCaptions: {
		1: 'Very Easy ',
		2: 'Easy      ',
		3: 'Hard      ',
		4: 'Very Hard '
		},
	starCaptionClasses: {
			1: 'label label-success',
			2: 'label label-primary',
			3: 'label label-warning',
			4: 'label label-danger'
		}
});
	
// The star-rating used after the Exercise is rated, to show the given rating
$("#display_rating").rating({
	stars: 4,
	min: 0,
	max: 4,
	step: 1,
	displayOnly: true,
	clearCaption: 'Your Rating:',
	starCaptions: {
			1: 'Very Easy',
			2: 'Easy',
			3: 'Hard',
			4: 'Very Hard'
		},
	starCaptionClasses: {
			1: 'label label-success',
			2: 'label label-primary',
			3: 'label label-warning',
			4: 'label label-danger'
		}
});// The star-rating used after the Exercise is rated, to show the given rating
$("#display_rating").rating({
	stars: 4,
	min: 0,
	max: 4,
	step: 1,
	displayOnly: true
});

//This method is being used to submit the given rating
$('#active_rating').on('rating.change', function(event, value, caption) {
	document.getElementById('rate_form').submit();
});
