var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d"),
	win = {
		width: 0,
		height: 0
	},
	cursor = {
		x: 0,
		y: 0,
		down: false,
		start: 0
	},
	data = {},
	tiles = {
		wide: 50,
		high: 28,
		size: 10
	},
	time = 0,
	speed = 1,
	pause = 0,
	mode = 1,
	blendmode = "overlay";

function resize() {
	win = {
		width: window.innerWidth,
		height: window.innerHeight
	}
	canvas.width  = win.width;
	canvas.height = win.height;
}
function seedRandom(seed) { // Mostly for testing, produces predictable randomness
	var x = Math.sin(seed) * 10000;
	return x - Math.floor(x);
}
function map(input, sMin, sMax, tMin, tMax) {
	return (input - sMin) * (tMax - tMin) / (sMax - sMin) + tMin;
}
function loadDataset(name, callback) {
	var getJSONreq = new XMLHttpRequest();
	getJSONreq.open("GET", "datasets/" + name + ".json");
	getJSONreq.responseType = "json";
	getJSONreq.send();
	document.getElementById("loading").style.display = "";

	getJSONreq.onload = function() {
		data = getJSONreq.response;
		document.getElementById("loading").style.display = "none";
		if (callback) callback();
	}
}

function drawCircles() {
	var width = win.width * 1,
		height = win.height * 1;

	ctx.save();
	ctx.translate(win.width / 2 - (tiles.wide * tiles.size * 2) / 2, win.height / 2 - (tiles.high * tiles.size * 2) / 2); // Calculate tile block size and center using window width and height
	ctx.translate(tiles.size, tiles.size); // Offset circle to correct coordinates to be from top left
	ctx.globalAlpha = 0.7;

	var count = 0;
	for (var i = 0; i < tiles.high; i++) {
		for (var j = 0; j < tiles.wide; j++) {
			ctx.beginPath();
			ctx.arc(j * tiles.size * 2, i * tiles.size * 2, tiles.size + Math.abs(data[mode == 3 ? time : time + count][mode == 1 ? "1" : mode == 2 ? i : count % 78] % 60) / 2, 0, 2 * Math.PI);

			ctx.fillStyle = "hsl("+ (data[time + count][mode == 2 ? i : "2"]) +", "+ Math.abs(data[time + count][mode == 2 ? i : "3"] % 100) +"%, "+ (seedRandom(count) * 80 + 10) +"%)";
			ctx.fill();

			count++;
		}
	}
	ctx.restore();
}
function drawLines() {
	ctx.save();
	ctx.globalAlpha = 0.6;
	ctx.lineWidth = 1.4;

	for (var j = 0; j < 10; j++) {
		ctx.beginPath();
		for (var i = 0; i < win.width / 4; i++) {
			ctx.lineTo(i * 4, data[i + time][j] % 80);
			//ctx.moveTo(i * 4, data[i + time][j] % 80);
			//ctx.quadraticCurveTo((i + 1) * 4, data[i + time + 1][j] % 80, (i + 2) * 4, data[i + time + 2][j] % 80); // Draw curve between every 1st and 3rd datapoint using 2nd as handle
		}
		ctx.stroke();
		ctx.translate(0, win.height / 10);
	}
	ctx.restore();

/*			ctx.beginPath();
	ctx.lineTo(time, 0);
	ctx.lineTo(time, win.height);
	ctx.stroke();*/
}
function updateTimeElements() {
	document.getElementById("display").innerHTML = data[time]["Time"];
	document.getElementById("progress").style.width = (time / (10000 - tiles.wide * tiles.high)) * 100 + "%";
}
function loop() {
	ctx.restore();
	ctx.save();
	ctx.clearRect(0, 0, win.width, win.height);
	ctx.globalCompositeOperation = blendmode;

	// Manage time
	if (cursor.down) {
		time += (cursor.start - cursor.x);
		cursor.start = cursor.x;
	}
	if (!pause) time += speed;
	time %= 10000 - tiles.wide * tiles.high; // Calculate tile lookahead
	time = Math.max(time, 0);

	drawCircles();
	if (cursor.down) drawLines();
	updateTimeElements();

	requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("mousemove", function(event) {
	cursor.x = event.pageX;
	cursor.y = event.pageY;
});
window.addEventListener("mousedown", function(event) {
	cursor.down = true;
	cursor.start = cursor.x;

	pause = 1;
});
window.addEventListener("mouseup", function(event) {
	cursor.down = false;
	pause = 0;
});

// UI
document.getElementById("sidebar").addEventListener("mousedown", function(event) {
	event.stopPropagation();
});

// Modes
var modeButtons = document.getElementsByClassName("mode");
for (var i = 0; i < modeButtons.length; i++) {
    modeButtons[i].addEventListener("click", function(event) {
    	// Remove active class from other buttons
    	for (var j = 0; j < modeButtons.length; j++) {
    		modeButtons[j].classList.remove("active");
    	}
    	// Add active class to button
    	this.classList.add("active");

		mode = Number(event.target.id.substring(4));
	});
}

// Blend mode
document.getElementById("selectBlendMode").addEventListener("change", function(event) {
	blendmode = this.value;
});

// Dataset
document.getElementById("selectDataset").addEventListener("change", function(event) {
	loadDataset(this.value);
});

// Time manipulation
var timeButtons = document.getElementsByClassName("btn timeElement");
for (var i = 0; i < timeButtons.length; i++) {
    timeButtons[i].addEventListener("click", function(event) {
    	// Remove active class from other buttons
    	for (var j = 0; j < timeButtons.length; j++) {
    		timeButtons[j].classList.remove("active");
    	}
    	// Add active class to button
    	this.classList.add("active");

		switch(event.target.id) {
			case "fastReverse":
				speed = -20;
				break;
			case "reverse":
				speed = -1;
				break;
			case "pause":
				speed = 0;
				break;
			case "forward":
				speed = 1;
				break;
			case "fastForward":
				speed = 20;
				break;

		}

		if (event.target.id == "pause") {
			document.getElementById("pause").style.display = "none";
			document.getElementById("forward").style.display = "";
		}
		else {
			document.getElementById("forward").style.display = "none";
			document.getElementById("pause").style.display = "";
		}
	});
}

// Load default JSON dataset
loadDataset("eeg_data_a_x1", loop);

resize();
