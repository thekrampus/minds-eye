var database;
var horses;
var weeds;
var minds_eye;

var current_guess = {
	horse: '',
	weed: '',
	mind: '',
	remaining: 3
}

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

$(document).ready(function() {
	// $.ajax({
	//     type: "GET",
	//     url:"database.csv",
	//     dataType: "text",
	//     success: function(raw_database) {initialize(raw_database);}
	// });

	initialize(uglyHardcodedDatabase());
});

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
	
	$('#restart').on('click', function() {
		window.location.reload(false);
	    });
    } else {
	dbErrorFallback();
    }
}

function dbErrorFallback() {
    $('#wrapper').append("Looks like the database is busy. Hold on, let me try something...");
    setTimeout(function() {
	    window.location.reload(false);
	}, 3000);
}

function presentOptions() {
	var triple = shuffle(getTriple());
	
	triple.forEach(function(item) {
		$('#choices').prepend("<tr height=100 hidden><td class='candidate' width=200 align=center>" + item + "</td></tr>");
	});
	
	$('tr').append("<td align=center hidden><button class='horse guess'></button><div class='guesshelp' hidden>HORSE</div></td>");
	$('tr').append("<td align=center hidden><button class='weed guess'></button><div class='guesshelp' hidden>WEED</div></td>");
	$('tr').append("<td align=center hidden><button class='mind guess'></button><div class='guesshelp' hidden>MIND'S EYE</div></td>");


	$('.guess').on('click', function() {
		makeGuess($(this));
	}).on('mouseenter', function() {
		$(this).siblings('.guesshelp:hidden').slideDown(100);
	}).on('mouseleave', function() {
		$(this).siblings('.guesshelp:visible').slideUp(500);
	});

	function fadeCandidates() {
		// var last = $('tr:visible:last');
		// if(last.length > 0)
		// 	fadeGuesses(last);
		var next = $('tr:hidden:first');
		if(next.length > 0)
			next.fadeIn(1000, fadeCandidates);
		else
			fadeGuesses();
	}

	function fadeGuesses() {
		$('td:hidden').fadeIn(800).promise().done(function() {
			$(this).animate({width: '66px'}, 800);
			$('#choices').animate({left: '-=15%'}, 800, fadeTagline);
		});
	}

	function fadeTagline() {
		var tagline = $('#tagline');
		tagline.append(randElement(minds_eye_messages));
		tagline.append(" Take your pick.");
		tagline.fadeIn(2000, fadeFootnote);
	}

	function fadeFootnote() {
		$('#footnote').fadeIn(2000);
	}

	fadeCandidates();
}

function makeGuess(button) {
	var candidate = button.parent().siblings('.candidate').text();
	var guess = '';

	button.parent().siblings(':not(.candidate)').fadeOut(200);
	$('.guesshelp').slideUp(200);

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
	} else {
		alert("Go email the developer that you encountered a malformed guess class");
	}

	$('.guess').promise().done(function() {
		current_guess.remaining--;
		
		if(current_guess.remaining == 1)
			makeGuess($('.guess:visible:not(:animated):first'));
		else if(current_guess.remaining == 0)
			validateGuesses();
	});

	console.log("Guess: " + candidate + ", " + guess + ". Remaining: " + current_guess.remaining);
}

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

	postGuess();

	$('#restartwrapper').fadeIn(3000);
}

function correctGuess(guess) {
	var row, message;

	switch(guess) {
	case 'horse':
		row = $('tr:contains(' + current_guess.horse + ')');
		message = "was of course a horse.";
		break;
	case 'weed':
		row = $('tr:contains(' + current_guess.weed + ')');
		message = "was indeed a weed.";
		break;
	case 'mind':
		row = $('tr:contains(' + current_guess.mind + ')');
		message = randElement(minds_eye_messages);
		break;
	}
	
	row.append("<td class='correct' align=left hidden> " + message + "</td>");
	row.children('.correct').fadeIn(2000);
}

function wrongGuess(guess) {
	var item, message, offset;
	
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
	var index, statIndex;

	switch(actual) {
	case 'horse':
		message += " it was actually a horse.";
		index = $.inArray(item, horses);
		statIndex = 0;
		break;
	case 'weed':
		message += " it was in fact a weed.";
		index = $.inArray(item, weeds);
		statIndex = 4;
		break;
	case 'mind':
		message += " it was in reality engineered by my mind's eye.";
		index = $.inArray(item, minds_eye);
		statIndex = 8;
		break;
	}
	row.append("<td class='wrong' align=left hidden> " + message + "</td>");
	row.children('.wrong').fadeIn(2000);
}

function getCategory(item) {
	if($.inArray(item, horses) != -1)
		return "horse";
	else if($.inArray(item, weeds) != -1)
		return "weed";
	else if($.inArray(item, minds_eye) != -1)
		return "mind";
}

function getTriple() {
	triple = [randElement(horses), randElement(weeds), randElement(minds_eye)];
	return triple;
}

function parseCSV(raw_database) {
	arrays = $.csv.toArrays(raw_database);
	return arrays;
}

function postGuess() {
	// $.ajax({
	// 	type: 'POST',
	// 	    url: 'dbmod.py',
	// 	    data: current_guess,
	// 	    //contentType: "application/json; charset=utf-8",
	// 	    //dataType: "json",
	// 	    success: function(data) { console.log(data); },
	// 	    error: function(data) { console.log("failure!"); console.log(data); }		
	// });
}

function randElement(array) {
	var element = '';
	while(element == '') {
		element = array[Math.floor(Math.random() * array.length)];
	}
	return element;
}

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

function uglyHardcodedDatabase() {
	return "Horse Names,Admiral's Voyage,Alpha,American Flag,Atomic Rain,Backtalk,Best Present Ever,Bodemeister,Cajun Beat,California Chrome,Celtic Ash,Chocolate Candy,Colorado King,Commando,Creative Cause,Daddy Long Legs,Daddy Nose Best,Dance With Fate,Danza,Delhi,Discreet Marq,Done Talking,Dunkirk,Eight Thirty,El Padrino,Falling Sky,Flying Private,Frac Daddy,Freesian Fire,Genie,Gentle Savage,Ghost Zapper,Gold Coin,Golden Soul,Greek Money,Harry's Holiday,Highest Honors,Ice Box,Indian Blessing,Intense Holiday,June Cleaver,Kauai King,Kid Cruz,Kiss Moon,Kona Gold,Lady Secret,Lemon Punch,Liaison,Luv Gov,Magical Band,Magic Hour,Matterhorn,Midnight Hawk,Midnight Interlude,Midnight Taboo,Mind Bender,Mind's Eyes,Mister Hot Stuff,Misty Morn,Moccasin,Mucho Macho Man,Optimizer,Orb,Papa Clem,Papa Jerry,Peter Pan,Please Explain,Prime Directive,Rachel Alexandra,Rousing Sermon,Sabercat,Sacred Light,Samraat,Scottish Chieftan,Scrimshaw,Sizzling Gold,Somali Lemonade,Star Shoot,Stay Thirsty,St. Liam,Stop Time,Sugar Shock,Summer Bird,Summer Tan,Sunshine Forever,Sweet Vendetta,Take The Points,Terrain,The Bard,The Green Monkey,Thor's Echo,Thunder Gulch,Token Special,Twenty Grand,Twilight Ridge,Twinspired,Union Rags,Westside Bernie,Wicked Strong,Wildcat Red,Wild Rush\nH-Guess,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0,1,1,2,3,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,1,1,1,1,0,2,0,0,0,0,0,0,0,1,0,0,2,0,0,1,0,0,0,0,1,0,1,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,1\nW-Guess,1,0,1,0,0,1,0,0,0,1,0,1,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0\nME-Guess,0,1,1,1,0,0,1,0,0,0,1,1,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,2,0,0,1,1,0,1,1,1,0,0,0,0,0,0,1,1,1,1,0,1,1,0,0,2,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,2,1,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1,0,0,0,0\nWeed Names,Accidental Tourist,Ace of Spades,Air Force One,Allen Wrench,American Dream,Armageddon,Aruel,Asteroid,Atmosphere,Beehive,Big Bud,Bio-Jesus,Black Domina,Blue Bayou,Blue Moon,Brain Child,Buddha's Sister,Cherry Pie,Chocolope,Cracker Jack,Dairy Queen,Don Cristo,Double Dream,Dr. Grinspoon,Dutch Treat,Early Garage,Early Girl,Edelweiss,El Jeffe,Emperor's Cut,Galactic Jack,Glass Slipper,God's Gift,Godzilla,Grand Hustle,Grand Platinum,Gun,Hawaiian Fire,Holy Grail,Hubba Bubba,Incredible Hulk,Jack's Cleaner,Jane Doe,Jilly Bean,Johnnie Walker,Johnny's Tonic,Joker's Revenge,King Henry,King Louis,King's Bread,L.A. Confidential,Life Saver,Liquid Butter,Little Devil,Loud Dream,Louis XIII,Low Rider,Lucky Charms,Medicine Man,MK Ultra,Morning Glory,Morning Star,Motorcity Whip,Mr. Nice Guy,Muchacho Man,Neville's Maze,Nevil's Wreck,Orange Moon,Outlaw,Pennies From Heaven,Pennywise,Polite With a Punch,Private Reserve,Professor Chaos,Purple Arrow,Qrazy Train,Rare Darkness,Rated R,Red Bull,Richie Rich,Rocklock,Royal Dwarf,Sapphire Star,Shark Shock,Shipwreck,Smoke on the Water,Soul Shine,Sour Grapes,Sunny Side Up,Sunset Sherbert,Sweet Tooth,Tasmanian Devil,Uncle Pete,Watermelon Tormaline,Whitaker Blues,White Gold,White Rhino,White Russian,Willies Wonder,Yumboldt\nH-Guess,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,0,0,0,0,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,2,0,0,0,1,0,0,1,1,0,0,1,0,0,0,2\nW-Guess,1,1,0,0,1,1,0,0,1,0,0,1,0,0,0,2,0,1,1,2,0,0,2,2,1,0,0,1,1,1,2,1,1,1,1,1,0,0,0,0,1,0,1,3,1,0,1,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,1,0,0,1,1,1,0,0,0,1,0,0,0,0,0,1,1,0,1,0,0,1,0,0,1,0,0,0,0,0,0\nME-Guess,0,0,0,0,0,0,0,0,0,0,3,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,3,0,0,0,0,0,0,0,0,0,0,0,0\nMind's Eye,Accho,Adios Amigos,Albany New York,Apples and Oranges,Apricot,Autumn Haze,Avalanche,Backlot Tour,Ballyhoo,Beethoven's Bust,Bob's Your Uncle,Boogeyman,Buried Treasure,Burnt Toast,Cannery Row,Captain America,Chardonnay,Charm Bracelet,Cliff's Surprise,Court Jester,Crystal Ship,Detour,Dollar Bill,Dolphin's Fin,Double Barrel,Double Jeopardy,Dust-up,Earth Worm,Executive Suite,Fog,Fortunate Son,Galaxy,General Patton,Ghost Town,Giddy Up and Go,Grape Nuts,Grey Flannel,Gupta,High Tide,Hummer,Irish Eyes,Jazz Age,Joni Mitchell,Lemonade,Let's Hear It for the Boy,Lieutenant Dan,Long Tall Sally,Low Tide,Macho Nacho,Milk & Cookies,Miranda's Miracle,Monkey Wrench,Muldoon,Par Excellence,Pepper,Poseidon's Trident,Quote-Unquote,Sacrificial Lamb,Sealed With a Kiss,Space Needle,Stealth Bomber,Strange Dawn,Ukulele,Uncle Ben,Undeterred Goon,Unlawful Entry,Upstart,Up Up and Away,Waikiki Wave,Weekender,Holy Roller,Inclement Weather,Pop Rox,Masquerade,Monkey's Uncle,Bible Thumper,Shazam,Photon Torpedo,Devil's Workshop,Frankenbutter,Dung Beetle,Black Astronaut,Bowtie Rasta,Carbon Credit,High Fructose Porn Syrup,Tiny Tim,Free Raisin,Chrysalis,Porkchop Parody,White Man's Burden,Red Menace,Bletchley Park,High as Balls,What a Crowd,Boob Glue,Culture Shock,Marriage Sow,Ka-ching!,Alien Visitation,Police Brutality\nH-Guess,1,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,2,0,0,0,1,1,0,0,0,3,0,0,0,0,0,1,1,0,0,0,0,1,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,1,0,2,0,0,0,0,3,0,0,0,1,0,0,0,1,1,0,0,0,0,1,0,2,0,0,0,0,2,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0\nW-Guess,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,2,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0\nME-Guess,0,0,0,1,1,0,0,0,0,0,0,1,0,0,0,3,0,0,0,0,0,0,1,0,0,0,1,1,0,1,0,0,0,1,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,1,1,0,1,0,0,0,0,1,0,0,0,0,0,1,1,1,2,0,0,0,0,0,1,1,0,1,0,0,1,1,0,0,0,0,2,2";
}
