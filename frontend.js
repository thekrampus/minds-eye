var database;
var horses;
var weeds;
var minds_eye;

/* Tracks the player's guess as it's made */
var current_guess = {
	horse: '',
	weed: '',
	mind: '',
	remaining: 3
}

/* Descriptive strings relating to my mind's eye. */
/* As quixotic as it is mysterious */
var minds_eye_messages = ["was fabricated within my mind's eye.",
						  "was found deep within my mind's eye.",
						  "was brought to you by my mind's eye.",
						  "was produced entirely by my mind's eye.",
						  "was neither, it was my mind's eye.",
						  "exists only within my mind's eye.",
						  "was a vision seen only by my mind's eye.",
						  "was constructed in the foundry of my mind's eye.",
						  "was all in my mind's eye, dawg.",
						  "can only be found inside my mind's eye.",
						  "was a forgery by my mind's eye."];

$(window).bind('pagecreate', function() {
	$.ajax({
	    type: "GET",
	    url:"database.csv",
	    dataType: "text",
	    success: function(raw_database) {initialize(raw_database);}
	});
    
    $.mobile.loading().hide();
});

/*
 * Pre-game initialization. Loads databases, starts page content generation.
 *
 * @param {string} raw_database - Raw string-format CSV database.
 */
function initialize(raw_database) {
    database = parseCSV(raw_database);
    if(database.length > 0) {
		horses = database[0];
		horses.shift();
		weeds = database[4];
		weeds.shift();
		minds_eye = database[8];
		minds_eye.shift();
		
		presentOptions();
		
		$('#restart').on('tap', function() {
			window.location.reload(false);
	    });
    } else {
		dbErrorFallback();
    }
}

/*
 * Fallback routine if database loading fails.
 * (i.e. if database is busy or can't be found)
 * Current strategy: Wait a little and reload the page.
 */
function dbErrorFallback() {
    $('#wrapper').append("Looks like the database is busy. Hold on, let me try something...");
    setTimeout(function() {
	    window.location.reload(false);
	}, 3000);
}

/*
 * Animate the player's three choices onto the page,
 * along with relevant controls.
 */
function presentOptions() {

	/* Get random candidates and insert in the DOM */
	var triple = shuffle(getTriple());
	triple.forEach(function(item) {
		$('#choices').prepend("<tr height=100 hidden><td class='candidate' width=200 align=center>" + item + "</td></tr>");
	});
	$('tr').append("<td align=center hidden><button class='horse guess'></button><div class='guesshelp' hidden>HORSE</div></td>");
	$('tr').append("<td align=center hidden><button class='weed guess'></button><div class='guesshelp' hidden>WEED</div></td>");
	$('tr').append("<td align=center hidden><button class='mind guess'></button><div class='guesshelp' hidden>MIND'S EYE</div></td>");

	/* Guess-button functionality. */
	$('.guess').on('tap', function() {
		makeGuess($(this));
	}).on('mouseenter', function() {
		$(this).siblings('.guesshelp').finish().slideDown(100);
	}).on('mouseleave', function() {
		$(this).siblings('.guesshelp').slideUp(500);
	});

	/* Fade the three candidates in recursively */
	function fadeCandidates() {
		var next = $('tr:hidden:first');
		if(next.length > 0)
			next.fadeIn(1000, fadeCandidates);
		else
			fadeGuesses();
	}

	/* Fade in and expand the guess controls */
	function fadeGuesses() {
		$('.guess').parent(':hidden').fadeIn(800).promise().done(function() {
			$(this).animate({width: '66px'}, 800);
			$('#choices').animate({left: '-=15%'}, 800, fadeTagline);
		});
	}

	/* Build and fade in tagline */
	function fadeTagline() {
		var tagline = $('#tagline');
		tagline.append(randElement(minds_eye_messages));
		tagline.append(" Take your pick.");
		tagline.fadeIn(2000, fadeFootnote);
	}

	/* Finally, fade in the footnote */
	function fadeFootnote() {
		$('#footnote').fadeIn(2000);
	}

	/* Start animation process */
	/* Each phase is called as a collback from the previous phase */
	fadeCandidates();
}

/*
 * Handle player's guess action. Called on guess-button presses.
 * 
 * Removes any invalidated guess controls and logs the players guess.
 * Additionally, if only one guess remains, that guess is made for the player.
 *
 * @param {selector} button - jQuery selector of the button that's been pressed.
 */
function makeGuess(button) {
	var candidate = button.parent().siblings('.candidate').text();
	var guess = '';

	/* Fade out guess tooltips and any irrelevant guess controls */
	$('.guesshelp').slideUp(200);
	button.parent().siblings(':not(.candidate)').fadeOut(200);

	if(button.hasClass('horse')) {
		guess = 'horse';
		current_guess.horse = candidate;
		$('.horse').fadeOut(200);
	} else if(button.hasClass('weed')) {
		guess = 'weed';
		current_guess.weed = candidate;
		$('.weed').fadeOut(200);
	} else if(button.hasClass('mind')) {
		guess = 'mind';
		current_guess.mind = candidate;
		$('.mind').fadeOut(200);
	}

	/* Decrement guess counter after animations are done */
	$('.guess').promise().done(function() {
		current_guess.remaining--;
		
		/* If only one guess remains, make it automatically */
		/* If no guesses remain, go to validation phase */
		if(current_guess.remaining == 1)
			makeGuess($('.guess:visible:not(:animated):first'));
		else if(current_guess.remaining == 0)
			validateGuesses();
	});
}

/*
 * Once the player has made their guesses, check each against the database.
 */
function validateGuesses() {

	if($.inArray(current_guess.horse, horses) != -1)
		correctGuess('horse');
	else
		wrongGuess('horse');

	if($.inArray(current_guess.weed, weeds) != -1)
		correctGuess('weed');
	else
		wrongGuess('weed');

	if($.inArray(current_guess.mind, minds_eye) != -1)
		correctGuess('mind');
	else
		wrongGuess('mind');

	/* Post player's guesses back to the server, for stats */
	postGuess();

	/* Fade in restart button */
	$('#restartwrapper').fadeIn(3000);
}

/*
 * The player has guessed correctly on one of the items. Good job!
 * Updates page to reflect this turn of events.
 *
 * @param {string} guess - Guess category (horse, weed, mind)
 */
function correctGuess(guess) {
	var item, message;

	/* Get corresponding update info based on the guess category */
	switch(guess) {
	case 'horse':
		item = current_guess.horse;
		message = "was of course a horse.";
		break;
	case 'weed':
		item = current_guess.weed;
		message = "was indeed a weed.";
		break;
	case 'mind':
		item = current_guess.mind;
		message = randElement(minds_eye_messages);
		break;
	}

	var row = $('tr:contains(' + item + ')');
	
	/* Insert into DOM */
	row.append("<td class='correct' align=left hidden> " + message + "</td>");
	row.children('.correct').fadeIn(2000);

	buildChart(row, item);
}

/*
 * The player has guessed incorrectly on one of the items. Dag, yo!
 * Updates page to reflect this tragedy.
 *
 * @param {string} guess - Guess category (horse, weed, mind)
 */
function wrongGuess(guess) {
	var item, message, offset;
	
	/* Get update info based on guess category */
	switch(guess) {
	case 'horse':
		item = current_guess.horse;
		message = "was not a horse,";
		offset = 1;
		break;
	case 'weed':
		item = current_guess.weed;
		message = "was not a weed,";
		offset = 2;
		break;
	case 'mind':
		item = current_guess.mind;
		message = "was not from my mind's eye,";
		offset = 3;
		break;
	}

	var row = $('tr:contains(' + item + ')');
	var actual = getCategory(item);

	/* Get update info based on actual category */
	switch(actual) {
	case 'horse':
		message += " it was actually a horse.";
		break;
	case 'weed':
		message += " it was in fact a weed.";
		break;
	case 'mind':
		message += " it was in reality engineered by my mind's eye.";
		break;
	}

	/* Insert into DOM */
	row.append("<td class='wrong' align=left hidden> " + message + "</td>");
	row.children('.wrong').fadeIn(2000);

	buildChart(row, item);
}

/*
 * Builds a pie chart displaying the guessing statistics for a candidate
 * and inserts it into the DOM.
 *
 * @param {selector} row - Table row containing the candidate.
 * @param {string} candidate - Candidate to get stats for.
 */
function buildChart(row, candidate) {
	var width = 400;
	var height = 150;
	var radius = 40;
	var colors = [ '#0072aa', '#c7990b', '#960570'];
	var textOffset = 7;

	var index, offset;

	var category = getCategory(candidate);

    switch(category) {
		    case 'horse':
		index = $.inArray(candidate, horses) + 1;
		offset = 0;
		break;
    case 'weed':
		index = $.inArray(candidate, weeds) + 1;
		offset = 4;
		break;
    case 'mind':
		index = $.inArray(candidate, minds_eye) + 1;
		offset = 8;
		break;
    }

	var statVals = [ +database[offset+1][index],
					   +database[offset+2][index],
					   +database[offset+3][index]];

	var totalVal = statVals[0] + statVals[1] + statVals[2];

	if(totalVal == 0) {
		return;
	}

    var stats = [{"label": "HORSE", "value": statVals[0], "percent": statVals[0]/totalVal},
				 {"label": "WEED", "value": statVals[1], "percent": statVals[1]/totalVal},
				 {"label": "MIND'S EYE", "value": statVals[2], "percent": statVals[2]/totalVal}];

	var cell = row.children('.candidate');

	var arc = d3.svg.arc()
		.outerRadius(radius)
		.innerRadius(0);

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
			return d.value;
		});

	var svg = d3.selectAll(cell.toArray())
		.append('svg:svg')
		.data([stats])
		.attr('width', width)
		.attr('height', height)
		.append('svg:g')
		.attr('transform', 'translate(' + width/2 + ', ' + height/2 + ')');

	var slices = svg.selectAll('g.slice')
		.data(pie)
		.enter()
		.append('svg:g')
		.attr('class', 'slice');

	slices.append('svg:path')
		.attr('fill', function(d, i) { return colors[i]; })
		.attr('d', arc);

	slices.append('svg:text')
		.attr('transform', function(d) {
			var x, y, r;
			
			r = radius + textOffset;
			
			x = r * Math.cos((d.startAngle + d.endAngle - Math.PI) / 2);
			y = r * Math.sin((d.startAngle + d.endAngle - Math.PI) / 2);

			return 'translate(' + x + ', ' + y + ')';
		})
		.attr('text-anchor', function(d) {
			return ((d.startAngle + d.endAngle)/2 < Math.PI ? 'beginning' : 'end');
		})
		.text(function(d, i) {
			var label = stats[i].label + " - " + Math.round(stats[i].percent * 100) + "%";
			return (stats[i].value > 0 ? label : '');
		})
		.attr('class', 'slicelabel');

	$('.slicelabel').hide();

	$('.slice').children('path').on('mouseenter', function() {
		$(this).siblings('.slicelabel').finish().fadeIn(100);
	}).on('mouseleave', function() {
		$(this).siblings('.slicelabel').fadeOut(500);
	});

	cell.children('svg').css({
		'top': cell.position().top - (radius/2),
		'left': cell.position().left - (3*width/4)
	}).hide().fadeIn(2000);
}

/*
 * Get the actual category of a candidate item.
 *
 * @param {string} candidate - Name of a candidate.
 *
 * @return {string} - Category of the candidate.
 */
function getCategory(candidate) {
	if($.inArray(candidate, horses) != -1)
		return "horse";
	else if($.inArray(candidate, weeds) != -1)
		return "weed";
	else if($.inArray(candidate, minds_eye) != -1)
		return "mind";
}

/*
 * Randomly selects three candidates to present to the player - a horse, a weed,
 * and something out of my mind's eye, as mysterious as it is enigmatic.
 *
 * @return {string array} - An array of three strings, one of each category.
 */
function getTriple() {
	triple = [randElement(horses), randElement(weeds), randElement(minds_eye)];
	return triple;
}

/*
 * Parse a raw CSV database string into a two-dimensional array.
 *
 * @param {string} raw_database - CSV database, in string format.
 *
 * @return {array} - CSV database, in array format.
 */
function parseCSV(raw_database) {
	arrays = $.csv.toArrays(raw_database);
	return arrays;
}

/*
 * Post the player's guess to the server, for use in later statistical analysis.
 */
function postGuess() {
	$.ajax({
		type: 'POST',
		url: 'dbmod.py',
		data: current_guess,
		success: function(data) { console.log(data); },
		error: function(data) { console.log("failure!"); console.log(data); }		
	});
}

/*
 * Pick a random element out of an array.
 *
 * @param {array} array - An array.
 *
 * @return - An element of the array.
 *
 * Sometimes I wonder if comprehensive documentation is really worth it, y'know?
 */
function randElement(array) {
	var element = '';
	while(element == '') {
		element = array[Math.floor(Math.random() * array.length)];
	}
	return element;
}

/*
 * Shuffle an array.
 *
 * @param {array} array - An array.
 *
 * @return {array} - The input array, with elements in random order.
 */
function shuffle(array) {
	var counter = array.length;
	var t, i;

	while(counter > 0) {
		i = Math.floor(Math.random() * counter--);
		
		t = array[counter];
		array[counter] = array[i];
		array[i] = t;
	}

	return array;
}
