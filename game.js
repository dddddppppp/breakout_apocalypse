/////////////////////////////////
// Breakout Apocalypse! The goal of the game is to improve the score (of course!),
// while avoiding to die (ball going beyond the lower part of the screen), delaying
// the end of the world (hitting all the bricks) and grabbing as much
// prophecies as possible.
//

// NOTES:
// 1. All the variables should be declared here on top
//    in order to have everything clean and avoid madness.
// 2. All the elements are placeholder for now: instead of boring rectangles 
//    there's gonna be a lot of cool animations. (I hope.)
// 3. EventListeners should be removed when not needed anymore.
// 4. There's some confusion about using 'var', 'let' and 'const', I guess.
// 5. Too much "modular" style of writing? I wrote a lot of different 
//    little functions, and some of them with the same loops. Maybe it would 
//    be good to clean everything for better performance? Anyway, it's working.
// 6. The biggest doubt I have is about removing elements from an array while looping in it
//    (see comments on "prophecyCollision")
// 7. I think this is the longest script I've ever wrote. Any suggestion to keep 
//    things more tidy are well accepted :)


let textProphecies = [];    
fetch('/prophecies.json').then(  			// this should be somewhere else, when I'm
        function(u){ return u.json();}		// gonna load all the elements and images using 
      ).then(								// some promises
        function(json){
          textProphecies = json;			// for now the json it's still a placeholder with a bunch of lorem ipsums
          console.log('prophecies loaded');
          console.log(textProphecies.length)
        }
      )

function startGame() {
	const canvas = document.getElementById("gameCanvas"); 	// not sure if this is necessary, but maybe I can load 
	const ctx = canvas.getContext("2d");					// everything here before going to the menu

	menuGame();
}

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
/// MENU
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

function menuGame() {
	const canvas = document.getElementById("gameCanvas");	
	const ctx = canvas.getContext("2d");

	let activeText = 0;
	const textSize = 20;

	let myReq; // request animation

	class Text {
		constructor(text, index) {
			this.text = text;
			this.index = index;
			this.color = 'white';
			this.size = textSize;
			this.active = false;
		}

		draw() {
			if (activeText == this.index) {
				this.color = 'green';
			} else {
				this.color = 'white';
			}

			ctx.font = this.size + 'px "Lucida Console"'
			ctx.fillStyle = this.color;
			ctx.fillText(this.text, canvas.width/2, 250 + this.index * 50);		
		}
	}

	let start = new Text('Start game', 0);
	let dataBase = new Text('DataBase', 1); // still not sure if I want other stuff in the menu
	let questionMark = new Text('?', 2);


	document.addEventListener("keydown", keyDownHandlerMenu, false); 

	function keyDownHandlerMenu(e) {
		if (e.key == "Up" || e.key == "ArrowUp") {
			if (activeText != 0) activeText--;
		}
		else if (e.key == "Down" || e.key == "ArrowDown") {
			if (activeText < 2) activeText++;
		}

		if (e.key == "Enter" || e.key == "") {
			if (activeText == 0) {
				cancelAnimationFrame(myReq);
				playGame();
			}
		}
	}



	function drawMenu() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.textAlign = 'center';
		start.draw();
		dataBase.draw();
		questionMark.draw();

		myReq = requestAnimationFrame(drawMenu);
	}

	drawMenu();
}



///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
/// PLAY GAME
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

function playGame() {

	let myReq; // request animation

	const canvas = document.getElementById("gameCanvas"); 
	const ctx = canvas.getContext("2d");


	// SCORE

	let score = 0;

	function drawScore() {
		ctx.textAlign = 'left';
		ctx.font = '14px "Lucida Console"'
		ctx.fillStyle = 'white';
		ctx.fillText('score: ' + score, 20, 20)
	}

	// PADDLE & CONTROLS

	let rightPressed = false;
	let leftPressed = false;

	document.addEventListener("keydown", keyDownHandlerGame, false);
	document.addEventListener("keyup", keyUpHandlerGame, false);

	function keyDownHandlerGame(e) {
		if (e.key == "Right" || e.key == "ArrowRight") {
			rightPressed = true;
		}
		else if (e.key == "Left" || e.key == "ArrowLeft") {
			leftPressed = true;
		}
	}

	function keyUpHandlerGame(e) {
		if (e.key == "Right" || e.key == "ArrowRight") {
			rightPressed = false;
		}
		else if (e.key == "Left" || e.key == "ArrowLeft") {
			leftPressed = false;
		}
	}

	const paddle = {
		height: 15,
		width: 200,
		xPos: (canvas.width - 200) / 2,
		yPos: canvas.height - 30,

		// cheat: uncomment those lines, comment the other width and xPos
		// width: canvas.width,
		// xPos: 0,

		update() { 
			if (rightPressed && this.xPos + this.width < canvas.width) { // add horizontal acceleration
				this.xPos += 7;
			}
			if (leftPressed && this.xPos > 0) {
				this.xPos -= 7;
			}
		},

		draw() {
			ctx.beginPath();
			ctx.rect(this.xPos, this.yPos, this.width, this.height);
			ctx.fillStyle = "red";
			ctx.fill();
			ctx.closePath();
		}
	}


	// BALL

	const ball = {
		radius: 10,
		xPos: (canvas.width - 10) / 2,
		yPos: canvas.height - 100,
		dx: 4,
		dy: -4, 

		update() {  // speed of the ball should increase towards the end of the game
			// x bounce
			if (this.xPos + this.dx > canvas.width - this.radius || this.xPos + this.dx < this.radius) {
				this.dx = -this.dx
			}
			// y bounce (to improve. change angle when paddle is moving)
			if (this.yPos + this.dy < this.radius) {
				this.dy = -this.dy
			} else if (this.yPos + this.dy > paddle.yPos - this.radius && this.xPos > paddle.xPos && this.xPos < paddle.xPos + paddle.width) {
				this.dy = -this.dy
			} else if (this.yPos + this.dy > canvas.height - this.radius) { 
				gameOver();
			}

			this.xPos += this.dx;
			this.yPos += this.dy;
		},

		draw() {
			ctx.beginPath();
			ctx.arc(this.xPos, this.yPos, this.radius, 0, Math.PI*2);
			ctx.fillStyle = "green";
			ctx.fill();
			ctx.closePath();
		}
	}


	// BRICKS

	const brickRowCount = 10; // move all those variables on top
	const brickColumnCount = 10;
	const brickWidth = 70;
	const brickHeight = 20;
	const bricksOffsetX = (canvas.width - (brickColumnCount * brickWidth)) / 2;
	const bricksOffsetY = 100;

	class Brick {
		constructor(c, r, img) {
			this.c = c;
			this.r = r;
			this.img = img;

			this.status = "active"; // I didn't came up of a better method to have three toggling variables.
									// For now it's three strings: "active", "falling", and "false"

			// I think I can clean up a bit here (there's some redundancy). Anyway, it's working
			this.sx = (img.width / brickColumnCount) * this.c; 
			this.sy = (img.height / brickRowCount) * this.r;
			this.sWidth = img.width / brickColumnCount
			this.sHeight = img.height / brickRowCount;
			this.xPos = c * brickWidth + bricksOffsetX;
			this.yPos = r * brickHeight + bricksOffsetY;
		}

		update() { 
			if (this.status == "falling") { // add gravity and maybe rotation
				this.yPos += 4
				if (this.yPos > canvas.height) {
					this.status = false
				}
			}
		}


		draw() {
			ctx.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, this.xPos, this.yPos, brickWidth, brickHeight);
			ctx.strokeStyle = 'white';
			ctx.strokeRect(this.xPos, this.yPos, brickWidth, brickHeight);
		}
	}


	function drawBricks(){
		for (let c = 0; c < brickColumnCount; c++) {
			for (let r = 0; r < brickRowCount; r++) {
				let b = brickWall[c][r];
				if (b.status != false) {
					b.update();
					b.draw();
				}
			}
		}
	}


	// THE BOOK OF PROPHECIES

	const book = {
		img: '',
		xPos: (canvas.width - 200) / 2,
		yPos: 20,
		width: 200,
		height: 50,

		prophecies: [], // should this be in the upper scope?

		spitProphecy() {
			let random = Math.random() * 1000; // improve randomness
			if (random > 990) {
				let dx = Math.random() * 12 - 6;
				let dy = -(Math.random() * 4);
				this.prophecies.push(new Prophecy(dx, dy))
			}
		},

		update() {
			this.spitProphecy(); // add animation, etc.
		},

		draw() {
			ctx.beginPath();
			ctx.rect(this.xPos, this.yPos, this.width, this.height);
			ctx.fillStyle = "blue";
			ctx.fill();
			ctx.closePath();
		}

	}

	// FLYING PROPHECIES

	class Prophecy {
		constructor(dx, dy) {
			
			this.dx = dx;
			this.dy = dy;

			this.xPos = book.xPos + book.width / 2;
			this.yPos = book.yPos + book.height / 2;

			this.gravity = 0.1

			this.width = 30;
			this.height = 30;

			this.status = true; // not sure about that (see comments on prophecyCollision)

		}

		update() {
			this.xPos += this.dx;
			this.dy += this.gravity;
			this.yPos += this.dy;
		}

		draw() {
			ctx.beginPath();
			ctx.rect(this.xPos, this.yPos, this.width, this.height);
			ctx.fillStyle = "yellow";
			ctx.fill();
			ctx.closePath();
		}
	}


	function prophecyCollision() {
		for (let i = 0; i < book.prophecies.length; i++) {

			let p = book.prophecies[i];
			if (p.status == true) {
				p.update();
				if (p.xPos < paddle.xPos + paddle.width && p.xPos + p.width > paddle.xPos && p.yPos < paddle.yPos + paddle.height && p.yPos + p.height > paddle.yPos) {
					grabProphecy();
					p.status = false;	// Instead of changing status, I should remove the element from the array,
					score += 100;		// but doing that while iterating on the same array gave me weird results.
					continue;		// For now this is working, but basically I'm looping through an evergrowing
				}				// array full of useless elements.
				if (p.yPos > canvas.height + 5) {
					p.status = false;
				}

			}
		}
	}


	function grabProphecy() {  
		let i = Math.floor(Math.random() * textProphecies.length);
		let text = textProphecies[i].text;
		prophecyOnScreen.content = text;
		prophecyOnScreen.status = true;
		prophecyOnScreen.f = 0;

		textProphecies.splice(i, 1);
		console.log(textProphecies.length)

		if (textProphecies.length == 0) {
			youWonEverything();
		}
	}


	function drawProphecies() {
		for (let i = 0; i < book.prophecies.length; i++) {
			let p = book.prophecies[i];
			if (p.status == true) {
				p.draw();
			}
		}
	}

	
	// ANNOYING PRINTED PROPHECY IN THE MIDDLE OF THE SCREEN

	const prophecyOnScreen = {
		status: false,
		content: '',
		f: 0,

		xPos: 50,
		yPos: 350,
		width: 1100,
		height: 150,


		update() {
			if (this.status == true) {
				this.f += 1;
				if (this.f > 200) {
					this.f = 0;
					this.status = false;
				}
			}
		},


		// I hadn't a better idea to use the text of the prophecies in the game's mechanics. 
		// But for sure it's annoying to not see the ball.
		draw() {
			if (this.status == true) {

				ctx.beginPath();
				ctx.rect(this.xPos, this.yPos, this.width, this.height);
				ctx.fillStyle = "grey";
				ctx.fill();
				ctx.strokeStyle = "white";
				ctx.stroke();
				ctx.closePath();


				ctx.textAlign = 'left';
				ctx.font = '24px "Lucida Console"'
				ctx.fillStyle = 'white';
				wrapText(ctx, this.content, this.xPos + 50, this.yPos + 30, this.width - 50, 30)
			}
		}
	}

	function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = context.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        context.fillText(line, x, y);
      }


	function collisionDetection() {   // to improve a lot. change angle when the ball hits close to the bricks' corners
		for (let c = 0; c < brickColumnCount; c++) {
			for (let r = 0; r < brickRowCount; r++) {
				let b = brickWall[c][r];
				if (b.status == "active") {

					let distX = Math.abs(ball.xPos - (b.xPos + brickWidth / 2));
					let distY = Math.abs(ball.yPos - (b.yPos + brickHeight / 2));

					if (distX > (ball.radius + brickWidth / 2) || distY > (ball.radius + brickHeight / 2)) {
						continue
					} 

					if (distX <= brickWidth / 2) {
						b.status = "falling";
						ball.dy = -ball.dy;
					}

					if (distY <= brickHeight / 2) {
						b.status = "falling";
						ball.dx = -ball.dx
					}

					score += 10;

				}
			}
		}
	}


	// GAME OVERS
	// still to do

	function gameOver() {
		console.log('HA HA GAME OVER')
	}

	function youWonEverything() {
		console.log('You predicted everything!')
	}


	// functions to wrap in promises

	let brickWall = [];

	function buildWall(img) {
		for (let c = 0; c < brickColumnCount; c++) {
			brickWall[c] = [];
			for (let r = 0; r < brickRowCount; r++) {
				brickWall[c][r] = new Brick(c, r, img)
			}
		}
	}


	let brickWallImage = new Image();
	brickWallImage.src = '/placeholder.jpg';

	brickWallImage.onload = function() {
		buildWall(brickWallImage);
		drawGame();
	}


	// UPDATE ELEMENTS AND DRAW ON CANVAS
	// still not sure about the order of the functions to call

	function drawGame() {

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		///////		

		book.update();


		collisionDetection();
		prophecyCollision();

		paddle.update();
		ball.update();

		prophecyOnScreen.update();


		///////

		book.draw();

		drawBricks();
		drawProphecies();

		ball.draw();
		paddle.draw();

		prophecyOnScreen.draw();

		drawScore();

		///////

		myReq = requestAnimationFrame(drawGame);

	}

}

// the end
