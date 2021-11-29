var mapManager = {
    mapData: null,
    tLayer: null,
    xCount: 10,
    yCount: 10,
    tSize: {x: 40, y: 40},
    mapSize: {x: 400, y: 400},
    tilesets: new Array(),
    imgLoadCount: 0,
    imgLoaded: false,
    jsonLoaded: false,

    reset: function (){
        this.mapData = null;
        this.tLayer = null;
        this.xCount = 10;
        this.yCount = 10;
        this.tSize = {x: 40, y: 40};
        this.mapSize = {x: 400, y: 400};
        this.tilesets = new Array();
        this.imgLoadCount = 0;
        this.imgLoaded = false;
        this.jsonLoaded = false;
    },

    getTileset: function (tileIndex) {
        for (var i = mapManager.tilesets.length - 1; i >= 0; i--) {
            if (mapManager.tilesets[i].firstid <= tileIndex) {
                return mapManager.tilesets[i];
            }
        }
        return null;
    },
    getTile: function (tileIndex) {
        var tile = {
            img: null,
            px: 0, py: 0
        };
        var tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        var id = tileIndex - tileset.firstid;
        var x = id % tileset.xCount;
        var y = Math.floor(id / tileset.xCount);
        tile.px = x * mapManager.tSize.x;
        tile.py = y * mapManager.tSize.y;
        return tile;
    },
    parseMap: function (tilesJSON) {
        this.mapData = JSON.parse(tilesJSON);
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;
        for (var i = 0; i < this.mapData.tilesets.length; i++) {
            var img = new Image();
            img.onload = function () {
                mapManager.imgLoadCount++;
                if (mapManager.imgLoadCount === mapManager.mapData.tilesets.length) {
                    mapManager.imgLoaded = true;
                }
            }
            img.src = this.mapData.tilesets[i].image;
            var t = this.mapData.tilesets[i];
            var ts = {
                firstid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor(t.imagewidth / mapManager.tSize.x),
                yCount: Math.floor(t.imageheight / mapManager.tSize.y)
            }

            this.tilesets.push(ts);
        }
        this.jsonLoaded = true;
    },

    draw: function (ctx) {
        if (!mapManager.imgLoaded || !mapManager.jsonLoaded) {
            setTimeout(function () {mapManager.draw(ctx);}, 100);
        } else {
            if (this.tLayer === null) {
                for (var id = 0; id < this.mapData.layers.length; id++) {
                    var layer = this.mapData.layers[id];
                    if (layer.type === "tilelayer") {
                        this.tLayer = layer;
                        break;
                    }
                }
            }

            for (var i = 0; i < this.tLayer.data.length; i++) {
                if (this.tLayer.data[i] !== 0) {
                    var tile = this.getTile(this.tLayer.data[i]);
                    var pX = (i % this.xCount) * this.tSize.x;
                    var pY = Math.floor((i / this.xCount)) * this.tSize.y;
                    ctx.drawImage(tile.img, tile.px, tile.py, this.tSize.x, this.tSize.y, pX, pY, this.tSize.x, this.tSize.y);
                }
            }
        }
    },
    loadMap: function (path) {
        var requset = new XMLHttpRequest();
        requset.onreadystatechange = function () {
            if (requset.readyState === 4 && requset.status === 200) {
                mapManager.parseMap(requset.responseText);
            }
        }
        requset.open("GET", path, true);
        requset.send();
    },

    parseEntities: function () {
        if (!mapManager.imgLoaded || !mapManager.jsonLoaded) {
            setTimeout(function () {mapManager.parseEntities();}, 100);
        } else {
            for (var j = 0; j < this.mapData.layers.length; j++) {
                if (this.mapData.layers[j].type === 'objectgroup') {
                    var entities = this.mapData.layers[j];
                    for (var i = 0; i < entities.objects.length; i++) {
                        var e = entities.objects[i];
                        try {
                            var obj = Object.create(gameManager.factory[e.type]);
                            obj.name = e.name;
                            obj.posX = e.x;
                            obj.posY = e.y;
                            obj.sizeX = e.width;
                            obj.sizeY = e.height;
                            gameManager.entities.push(obj);

                            if (obj.name === "Snake") {
                                gameManager.initPlayer(obj);
                            }

                            if (obj.name === "Owl") {
                                gameManager.initEnemy(obj);
                            }
                        } catch (ex) {

                        }
                    }
                }
            }
        }
    },

    getTilesetIdx: function (x, y) {
        var wX = x;
        var wY = y;
        var idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);
        return this.tLayer.data[idx];
    }
}

var soundManager = {
    dead: null,
    appleEat: null,
    coinCollect: null,
    init: function () {
        this.dead = new Audio("./resources/deadSound.wav");
        this.dead.volume = 0.5;
        this.appleEat = new Audio("./resources/appleSound.wav");
        this.appleEat.volume = 0.5;
        this.coinCollect = new Audio("./resources/coinSound.wav");
        this.coinCollect.volume = 0.5;
    },

    playAppleEat: function () {
        this.appleEat.play();
    },

    playDead: function () {
        this.dead.play();
    },

    playCoinCollect() {
        this.coinCollect.play();
    }
}

var Entity = {
    posX: 0, posY: 0,
    sizeX: 0, sizeY: 0,
    extend: function (extendProto) {
        var object = Object.create(this);
        for (var proprety in extendProto) {
            if (this.hasOwnProperty(proprety) || typeof object[proprety] === 'undefined') {
                object[proprety] = extendProto[proprety];
            }
        }
        return object;
    }
}

var Apple = Entity.extend({
   type: 'Apple',
    draw: function (ctx) {
       spriteManager.drawSprite(ctx, "apple", this.posX, this.posY);
    }
});

var Coin = Entity.extend({
   type: 'Coin',
   draw: function (ctx) {
       spriteManager.drawSprite(ctx, "coin", this.posX, this.posY);
   }
});

var Owl = Entity.extend({
    moveX: 1,
    moveY: 0,
    direction: 'Right',
    draw: function (ctx) {
        if (this.direction === 'Right') {
            spriteManager.drawSprite(ctx, 'owlRight', this.posX, this.posY);
        } else if (this.direction === 'Left') {
            spriteManager.drawSprite(ctx, 'owlLeft', this.posX, this.posY);
        }
    },
    update: function () {
        physicsManager.update(this);
    },

    onTouchMap: function () {
        if (this.direction === 'Right') {
            this.direction = 'Left';
            this.moveX = -1;
        } else if (this.direction === 'Left') {
            this.direction = 'Right';
            this.moveX = 1;
        }
    },

    onTouchEntity: function (obj) {
        if (obj.name.includes("Coin")) {
            let oldPosition = {x: obj.posX, y: obj.posY};
            gameManager.kill(obj);
            let emptyCells = [];
            for (var i = 0; i < 800; i += 40) {
                for (var j = 0; j < 600; j += 40) {
                    let ts = mapManager.getTilesetIdx(j, i);
                    let e = physicsManager.entityAtXY(obj, j, i);
                    let isSnake = false;
                    if ((ts === 1 || ts === 2 || ts === 3 || ts === 4) && !e) {
                        gameManager.player.location.forEach(function (tile) {
                            if (tile.posX === j && tile.posY === i) {
                                isSnake = true;
                            }
                        });
                        if (!isSnake && Math.abs(oldPosition.x - j) / 40 > 5 && Math.abs(oldPosition.y - i) / 40 > 5)
                            emptyCells.push({x: j, y: i});
                    }
                }
            }
            let idx = Math.floor(Math.random() * (emptyCells.length + 1));

            try {
                let newCoin = Object.create(gameManager.factory['Coin']);
                newCoin.name = 'Coin';
                newCoin.posX = emptyCells[idx].x;
                newCoin.posY = emptyCells[idx].y;
                newCoin.sizeX = 40;
                newCoin.sizeY = 40;
                gameManager.entities.push(newCoin);
            } catch (e) {
                let newCoin = Object.create(gameManager.factory['Coin']);
                newCoin.name = 'Coin';
                newCoin.posX = 80;
                newCoin.posY = 80;
                newCoin.sizeX = 40;
                newCoin.sizeY = 40;
                gameManager.entities.push(newCoin);
            }

        }
    },

    onTouchSnake: function () {
        gameManager.stop();
    }



});

var Player = Entity.extend({
    lifetime: 100,
    moveX: 0,
    moveY: -1,
    speed: 0.5,
    isDead: false,
    numberApplesEaten: 0,
    numberCoinsCollect: 0,
    location:  [{posX: 360, posY: 360, isTail: true, isBody: false, isHead: false, isTurn: false, direction: 'Up', turnDirection: null, sizeX: 40, sizeY: 40},
        {posX: 360, posY: 320, isTail: false, isBody: true, isHead: false, isTurn: false, direction: 'Up', turnDirection: null, sizeX: 40, sizeY: 40},
        {posX: 360, posY: 280, isTail: false, isBody: false, isHead: true, isTurn: false, direction: 'Up', turnDirection: null, sizeX: 40, sizeY: 40}
    ],

    draw: function (ctx) {
        this.location.forEach(function (tile) {
            if (tile.isTail) {
                let tileName = 'tail' + tile.direction;
                spriteManager.drawSprite(ctx, tileName, tile.posX, tile.posY);
            }

            if (tile.isBody) {
                let tileName;
                if (tile.direction === "Right" || tile.direction === "Left")
                {
                    tileName = 'bodyHorizontal';
                    spriteManager.drawSprite(ctx, tileName, tile.posX, tile.posY);
                } else if (tile.direction === "Up" || tile.direction === "Down") {
                    tileName = 'bodyVertical';
                    spriteManager.drawSprite(ctx, tileName, tile.posX, tile.posY);
                }
            }

            if (tile.isHead && !gameManager.player.isDead) {
                let tileName = 'head' + tile.direction;
                spriteManager.drawSprite(ctx, tileName, tile.posX, tile.posY);
            } else if (tile.isHead && gameManager.player.isDead) {
                let tileName = 'deadHead' + tile.direction;
                spriteManager.drawSprite(ctx, tileName, tile.posX, tile.posY);
            }

            if (tile.isTurn) {
                let tileName = tile.direction;
                spriteManager.drawSprite(ctx, tileName, tile.posX, tile.posY);
            }
        });
    },
    update: function () {
        physicsManager.update(this);
        this.checkTouchSelf();
    },
    onTouchEntity: function (obj) {
        if (obj.name.includes("Apple")) {
            soundManager.playAppleEat();
            this.numberApplesEaten += 1;
            gameManager.kill(obj);
            let tail = this.location[0];
            tail.isTail = false;
            tail.isBody = true;

            let newPosX;
            let newPosY;

            if (tail.direction === 'Right') {
                newPosX = tail.posX - tail.sizeX;
                newPosY = tail.posY;
            }

            if (tail.direction === 'Left') {
                newPosX = tail.posX + tail.sizeX;
                newPosY = tail.posY;
            }

            if (tail.direction === 'Up') {
                newPosX = tail.posX;
                newPosY = tail.posY + tail.sizeY;
            }

            if (tail.direction === 'Down') {
                newPosX = tail.posX;
                newPosY = tail.posY - tail.sizeY;
            }

            let newTail = {posX: newPosX, posY: newPosY, isTail: true, isBody: false, isHead: false, isTurn: false, direction: tail.direction, sizeX: 40, sizeY: 40};
            this.location.unshift(newTail);

        }

        if (obj.name.includes("Coin")) {
            let oldPosition = {x: obj.posX, y: obj.posY};
            soundManager.playCoinCollect();
            this.numberCoinsCollect += 1;
            gameManager.kill(obj);
            let emptyCells = [];
            for (var i = 0; i < 800; i += 40) {
                for (var j = 0; j < 600; j += 40) {
                    let ts = mapManager.getTilesetIdx(j, i);
                    let e = physicsManager.entityAtXY(obj, j, i);
                    let isSnake = false;
                    if ((ts === 1 || ts === 2 || ts === 3 || ts === 4) && !e) {
                        gameManager.player.location.forEach(function (tile) {
                            if (tile.posX === j && tile.posY === i) {
                                isSnake = true;
                            }
                        });
                        if (!isSnake && Math.abs(oldPosition.x - j) / 40 > 5 && Math.abs(oldPosition.y - i) / 40 > 5)
                            emptyCells.push({x: j, y: i});
                    }
                }
            }
            let idx = Math.floor(Math.random() * (emptyCells.length + 1));

            try {
                let newCoin = Object.create(gameManager.factory['Coin']);
                newCoin.name = 'Coin';
                newCoin.posX = emptyCells[idx].x;
                newCoin.posY = emptyCells[idx].y;
                newCoin.sizeX = 40;
                newCoin.sizeY = 40;
                gameManager.entities.push(newCoin);
            } catch (e) {
                let newCoin = Object.create(gameManager.factory['Coin']);
                newCoin.name = 'Coin';
                newCoin.posX = 80;
                newCoin.posY = 80;
                newCoin.sizeX = 40;
                newCoin.sizeY = 40;
                gameManager.entities.push(newCoin);
            }

            console.log("Coins: " + gameManager.player.numberCoinsCollect);
        }
    },
    onTouchMap: function (ts) {
        gameManager.stop();
    },

    onTouchOwl: function () {
        gameManager.stop();
    },
    checkTouchSelf: function () {
        let head = this.location[this.location.length - 1];

        this.location.forEach(function (tile) {
           if (!tile.isHead && head.posX === tile.posX && head.posY === tile.posY) {
               gameManager.stop();
           }
        });
    }
});


var physicsManager = {
    playerMoveVertical: function(obj, direction, turnRigth, turnLeft) {
        for (let i = 0; i < obj.location.length; i++) {
            let head = obj.location[obj.location.length - 1];
            let tail = obj.location[0];
            let postTail = obj.location[1];

            if (head.direction === 'Right') {
                if (postTail.isTurn)
                    postTail.direction = postTail.turnDirection;
                else if (postTail.isBody)
                    postTail.direction = tail.direction;

                postTail.isTail = true;
                postTail.isTurn = false;
                postTail.isBody = false;
                obj.location.splice(obj.location.indexOf(tail), 1);

                head.isHead = false;
                head.isTurn = true;
                head.direction = turnRigth;
                head.turnDirection = direction;

                let newPosY;
                if (direction === 'Up')
                    newPosY = head.posY - 1 * head.sizeY;
                else
                    newPosY = head.posY + 1 * head.sizeY;
                let newHead = {posX: head.posX, posY: newPosY, isTail: false, isBody: false, isHead: true, isTurn: false, direction: direction, sizeX: 40, sizeY: 40};
                obj.location.push(newHead);
                return;
            }


            if (head.direction === 'Left') {
                if (postTail.isTurn)
                    postTail.direction = postTail.turnDirection;
                else if (postTail.isBody)
                    postTail.direction = tail.direction;

                postTail.isTail = true;
                postTail.isTurn = false;
                postTail.isBody = false;
                obj.location.splice(obj.location.indexOf(tail), 1);

                head.isHead = false;
                head.isTurn = true;
                head.direction = turnLeft;
                head.turnDirection = direction;

                let newPosY;
                if (direction === 'Up')
                    newPosY = head.posY - 1 * head.sizeY;
                else
                    newPosY = head.posY + 1 * head.sizeY;
                let newHead = {posX: head.posX, posY: newPosY, isTail: false, isBody: false, isHead: true, isTurn: false, direction: direction, sizeX: 40, sizeY: 40};
                obj.location.push(newHead);
                return;
            }

            if (head.direction === direction) {
                if (postTail.isTurn)
                    postTail.direction = postTail.turnDirection;
                else if (postTail.isBody)
                    postTail.direction = tail.direction;

                postTail.isTail = true;
                postTail.isTurn = false;
                postTail.isBody = false;
                obj.location.splice(obj.location.indexOf(tail), 1);

                head.isHead = false;
                head.isBody = true;
                head.direction = direction;

                let newPosY;
                if (direction === 'Up') {
                    newPosY = head.posY - 1 * head.sizeY;
                }
                else
                    newPosY = head.posY + 1 * head.sizeY;
                let newHead = {posX: head.posX, posY: newPosY, isTail: false, isBody: false, isHead: true, isTurn: false, direction: direction, sizeX: 40, sizeY: 40};
                obj.location.push(newHead);
                return;
            }
        }
    },

    playerMoveHorizontal: function(obj, direction, turnUp, turnDown) {
        for (let i = 0; i < obj.location.length; i++) {
            let head = obj.location[obj.location.length - 1];
            let tail = obj.location[0];
            let postTail = obj.location[1];

            if (head.direction === 'Up') {
                if (postTail.isTurn)
                    postTail.direction = postTail.turnDirection;
                else if (postTail.isBody)
                    postTail.direction = tail.direction;

                postTail.isTail = true;
                postTail.isTurn = false;
                postTail.isBody = false;
                obj.location.splice(obj.location.indexOf(tail), 1);

                head.isHead = false;
                head.isTurn = true;
                head.direction = turnUp;
                head.turnDirection = direction;

                let newPosX;
                if (direction === 'Left')
                    newPosX = head.posX - 1 * head.sizeX;
                else
                    newPosX = head.posX + 1 * head.sizeX;
                let newHead = {posX: newPosX, posY: head.posY, isTail: false, isBody: false, isHead: true, isTurn: false, direction: direction, sizeX: 40, sizeY: 40};
                obj.location.push(newHead);
                return;
            }


            if (head.direction === 'Down') {
                if (postTail.isTurn)
                    postTail.direction = postTail.turnDirection;
                else if (postTail.isBody)
                    postTail.direction = tail.direction;

                postTail.isTail = true;
                postTail.isTurn = false;
                postTail.isBody = false;
                obj.location.splice(obj.location.indexOf(tail), 1);

                head.isHead = false;
                head.isTurn = true;
                head.direction = turnDown;
                head.turnDirection = direction;

                let newPosX;
                if (direction === 'Left')
                    newPosX = head.posX - 1 * head.sizeX;
                else
                    newPosX = head.posX + 1 * head.sizeX;
                let newHead = {posX: newPosX, posY: head.posY, isTail: false, isBody: false, isHead: true, isTurn: false, direction: direction, sizeX: 40, sizeY: 40};
                obj.location.push(newHead);
                return;
            }

            if (head.direction === direction) {
                if (postTail.isTurn)
                    postTail.direction = postTail.turnDirection;
                else if (postTail.isBody)
                    postTail.direction = tail.direction;

                postTail.isTail = true;
                postTail.isTurn = false;
                postTail.isBody = false;
                obj.location.splice(obj.location.indexOf(tail), 1);

                head.isHead = false;
                head.isBody = true;
                head.direction = direction;

                let newPosX;
                if (direction === 'Left')
                    newPosX = head.posX - 1 * head.sizeX;
                else
                    newPosX = head.posX + 1 * head.sizeX;
                let newHead = {posX: newPosX, posY: head.posY, isTail: false, isBody: false, isHead: true, isTurn: false, direction: direction, sizeX: 40, sizeY: 40};
                obj.location.push(newHead);
                return;
            }
        }
    },

    entityAtXY: function (obj, x, y) {
        for (var i = 0; i < gameManager.entities.length; i++) {
            var e = gameManager.entities[i];
            if (e.name !== obj.name) {
                if (e.posX === x && e.posY === y) {
                    return e;
                }
            }
        }
        return null;
    },

    snakeAtXY: function (x, y) {
        for (var i = 0; i < gameManager.player.location.length; i++) {
            if (gameManager.player.location[i].posX === x && gameManager.player.location[i].posY === y) {
                return true;
            }
        }
        return false;
    },

    update: function (obj) {
        if (obj.name === 'Snake') {
            if (obj.moveX === 0 && obj.moveY === 0) {
                return "stop";
            }

            let head = obj.location[obj.location.length - 1];

            if (obj.moveY === 1 && head.direction === 'Up') {
                obj.moveY = -1;
            }
            if (obj.moveY === -1 && head.direction === 'Down') {
                obj.moveY = 1;
            }
            if (obj.moveX === 1 && head.direction === 'Left') {
                obj.moveX = -1;
            }
            if (obj.moveX === -1 && head.direction === 'Right') {
                obj.moveX = 1;
            }

            let newX = obj.location[obj.location.length - 1].posX + obj.moveX * obj.location[obj.location.length - 1].sizeX;
            let newY = obj.location[obj.location.length - 1].posY + obj.moveY * obj.location[obj.location.length - 1].sizeY;
            let ts = mapManager.getTilesetIdx(newX, newY);
            let e = this.entityAtXY(obj, newX, newY);

            if (e !== null && obj.onTouchEntity) {
                obj.onTouchEntity(e);
            }

            if (obj.moveY === 1) {
                this.playerMoveVertical(obj, 'Down', 'topLeftAndRightDown', 'topRightAndLeftDown');
            }

            if (obj.moveY === -1) {
                this.playerMoveVertical(obj, 'Up', 'bottomLeftAndRightUp', 'bottomRightAndLeftUp');
            }

            if (obj.moveX === 1) {
                this.playerMoveHorizontal(obj, 'Right', 'topRightAndLeftDown', 'bottomRightAndLeftUp');
            }

            if (obj.moveX === -1) {
                this.playerMoveHorizontal(obj, 'Left', 'topLeftAndRightDown', 'bottomLeftAndRightUp');
            }

            if (e !== null) {
                if (e.name === 'Owl')
                    obj.onTouchOwl();
            }



            if (ts === 5 && obj.onTouchMap) {
                obj.onTouchMap();
            }
        }

        if (obj.name === 'Owl') {
            let newX = obj.posX + obj.moveX * obj.sizeX;
            let newY = obj.posY + obj.moveY * obj.sizeY;
            let ts = mapManager.getTilesetIdx(newX, newY);
            let e = this.entityAtXY(obj, newX, newY);

            if (ts === 5 && obj.onTouchMap) {
                obj.onTouchMap();
                newX = obj.posX + obj.moveX * obj.sizeX;
                newY = obj.posY + obj.moveY * obj.sizeY;
            }


            if (e !== null && obj.onTouchEntity) {
                obj.onTouchEntity(e);
            }



            obj.posX = newX;
            obj.posY = newY;

            if (this.snakeAtXY(newX, newY)) {
                obj.onTouchSnake();
            }
        }
    }
}


var eventsManager = {
    bind: [],
    action: [],
    setup: function (canvas) {
        this.bind[87] = 'up';
        this.bind[65] = 'left';
        this.bind[83] = 'down';
        this.bind[68] = 'right';
        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);
    },

    onKeyDown: function (event) {
        var action = eventsManager.bind[event.keyCode];
        if (action) {
            eventsManager.action[action] = true;
        }
    },

    onKeyUp: function (event) {
        var action = eventsManager.bind[event.keyCode];
        if (action) {
            eventsManager.action[action] = false;
        }
    }
}

var spriteManager = {
    image: new Image(),
    sprites: new Array(),
    imgLoaded: false,
    jsonLoaded: false,

    reset: function () {
      this.image = new Image();
      this.sprites = new Array();
      this.imgLoaded = false;
      this.jsonLoaded = false;
    },
    loadImg: function (imgName) {
        this.image.onload = function () {
            spriteManager.imgLoaded = true;
        }
        this.image.src = imgName;
    },
    parseAtlas: function (atlasJSON) {
        var atlas = JSON.parse(atlasJSON);

        for (var name in atlas.frames) {
            var frame = atlas.frames[name].frame;
            this.sprites.push({name: name, x: frame.x, y: frame.y, w: frame.w, h: frame.h});
        }
        this.jsonLoaded = true;
    },
    loadAtlas: function (atlasJson, atlasImg) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                spriteManager.parseAtlas(request.responseText);
            }

        }

        request.open("GET", atlasJson, true);
        request.send();
        this.loadImg(atlasImg);
    },

    getSprite: function (name) {
        for (var i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];
            if (s.name === name) {
                return s;
            }
        }

        return null;
    },

    drawSprite: function (ctx, name, x, y) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(function () {
                spriteManager.drawSprite(ctx, name, x, y);
            })
        } else {
            var sprite = this.getSprite(name);
            ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
        }
    }
}

var gameManager = {
    factory: {},
    entities: [],
    player: null,
    laterKill: [],
    snakeUpdateInterval: null,
    owlUpdateIntervals: [],
    stackDirection: [],
    lastDirection: null,
    currentLvl: 1,
    scoreOnFirstLvl: 0,

    initPlayer: function (obj) {
        this.player = obj;
        if (this.currentLvl === 2) {
            this.player.moveX = 0;
            this.player.moveY = -1;
            this.player.numberApplesEaten = 0;
            this.player.numberCoinsCollect = this.scoreOnFirstLvl;
            this.player.location =  [{posX: 360, posY: 360, isTail: true, isBody: false, isHead: false, isTurn: false, direction: 'Up', turnDirection: null, sizeX: 40, sizeY: 40},
                {posX: 360, posY: 320, isTail: false, isBody: true, isHead: false, isTurn: false, direction: 'Up', turnDirection: null, sizeX: 40, sizeY: 40},
                {posX: 360, posY: 280, isTail: false, isBody: false, isHead: true, isTurn: false, direction: 'Up', turnDirection: null, sizeX: 40, sizeY: 40}
            ];
        }
        this.snakeUpdateInterval = setInterval(() => {
            if (this.stackDirection.length > 0) {
                if (this.stackDirection[0] === 'Up') {
                    this.player.moveX = 0;
                    this.player.moveY = -1;
                } else if (this.stackDirection[0] === 'Down') {
                    this.player.moveX = 0;
                    this.player.moveY = 1;
                } else if (this.stackDirection[0] === 'Left') {
                    this.player.moveX = -1;
                    this.player.moveY = 0;
                } else if (this.stackDirection[0] === 'Right') {
                    this.player.moveX = 1;
                    this.player.moveY = 0;
                }
            }
            this.player.update();
            this.stackDirection.splice(0, 1);

        }, 250);
    },

    initEnemy: function (enemy) {
        let interval = setInterval(function () {
            enemy.update();
        }, 800);
        this.owlUpdateIntervals.push(interval);
    },

    kill: function (obj) {
        this.laterKill.push(obj);
    },
    update: function () {
        if (this.player === null) {
            return;
        }

        //this.player.moveX = 0;
        //this.player.moveY = 0;

        if (eventsManager.action["up"]) {
            //this.player.moveX = 0;
            //this.player.moveY = -1;
            if (this.stackDirection[this.stackDirection.length - 1] !== 'Up' && this.stackDirection[this.stackDirection.length - 1] !== 'Down'
                && this.lastDirection !== 'Up' && this.lastDirection !== 'Down'/*&& head.direction !== 'Up' && head.direction !== 'Down'*/) {
                this.lastDirection = 'Up';
                this.stackDirection.push('Up');
                //this.player.update();
                //this.resetSnakeUpdateInterval();
            }
        } else if (eventsManager.action["down"]) {
            //this.player.moveX = 0;
            //this.player.moveY = 1;
            if (this.stackDirection[this.stackDirection.length - 1] !== 'Up' && this.stackDirection[this.stackDirection.length - 1] !== 'Down'
                && this.lastDirection !== 'Up' && this.lastDirection !== 'Down'/*&& head.direction !== 'Up' && head.direction !== 'Down'*/) {
                this.lastDirection = 'Down';
                this.stackDirection.push('Down');
                //this.player.update();
                //this.resetSnakeUpdateInterval();
            }
        } else if (eventsManager.action["left"]) {
            //this.player.moveY = 0;
            //this.player.moveX = -1;
            if (this.stackDirection[this.stackDirection.length - 1] !== 'Left' && this.stackDirection[this.stackDirection.length - 1] !== 'Right'
                && this.lastDirection !== 'Left' && this.lastDirection !== 'Right'/*&& head.direction !== 'Left' && head.direction !== 'Right'*/) {
                this.lastDirection = 'Left';
                this.stackDirection.push('Left');
                //this.player.update();
                //this.resetSnakeUpdateInterval();
            }
        } else if (eventsManager.action["right"]) {
            //this.player.moveY = 0;
            //this.player.moveX = 1;
            if (this.stackDirection[this.stackDirection.length - 1] !== 'Left' && this.stackDirection[this.stackDirection.length - 1] !== 'Right'
                && this.lastDirection !== 'Left' && this.lastDirection !== 'Right'/*&& head.direction !== 'Left' && head.direction !== 'Right'*/) {
                this.lastDirection = 'Right';
                this.stackDirection.push('Right');
                //this.player.update();
                //this.resetSnakeUpdateInterval();
            }
        }

        for (var i = 0; i < this.laterKill.length; i++) {
            var idx = this.entities.indexOf(this.laterKill[i]);
            if (idx > -1) {
                this.entities.splice(idx, 1);
            }
        }

        if (this.laterKill.length > 0) {
            this.laterKill.length = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mapManager.draw(ctx);
        this.draw(ctx);

        //lvl complete
        if (this.player.numberApplesEaten === 10) {
            if (this.currentLvl === 2) {
                localStorage[localStorage.getItem("snake.username")] = 
this.player.numberCoinsCollect;
        	setRecords();
                ctx.font = "60px Tahoma";
                ctx.fillStyle = "white";
                ctx.fillText("YOU WIN!!!", 215, 155);
                this.owlUpdateIntervals.forEach(function (interval) {
                    clearInterval(interval);
                });
                clearInterval(gameManager.snakeUpdateInterval);
                clearInterval(gameUpdateInterval);
            } else if (this.currentLvl === 1)
            {
                ctx.font = "60px Tahoma";
                ctx.fillStyle = "white";
                ctx.fillText("LEVEL COMPLETE!!!", 120, 155);
                for (let i = 0; i< this.entities.length; i++) {
                    let e = this.entities[i];
                    this.entities.splice(this.entities.indexOf(e), 1);
                }
                this.player.numberApplesEaten = 0;
                gameManager.scoreOnFirstLvl = this.player.numberCoinsCollect;
                this.owlUpdateIntervals.forEach(function (interval) {
                    clearInterval(interval);
                });
                clearInterval(gameManager.snakeUpdateInterval);
                clearInterval(gameUpdateInterval);
                mapManager.reset();
                spriteManager.reset();
                gameManager.player.moveX = 0;
                gameManager.player.moveY = 0;
                gameManager.currentLvl = 2;
                gameManager.entities = [];
                gameManager.stackDirection = [];
                gameManager.lastDirection = null;
                setTimeout(function () {
                    gameManager.loadAll();
                    gameManager.play();
                }, 3000);
            }
        }
    },
    draw: function (ctx) {
        for (var e = 0; e < this.entities.length; e++) {
            this.entities[e].draw(ctx);
        }

        ctx.font = "25px Tahoma";
        ctx.fillStyle = "red";
        ctx.fillText("LVL: " + this.currentLvl, 820, 40);
        ctx.fillStyle = "blue";
        ctx.fillText("SCORE: " + this.player.numberCoinsCollect, 820, 80);
        spriteManager.drawSprite(ctx, 'coin', 930, 50);
        if (this.currentLvl === 1) {
            ctx.fillStyle = "red";
            ctx.font = "23px Tahoma";
            ctx.fillText("Collect all the", 820, 120);
            ctx.fillText("apples to go", 820, 141);
            ctx.fillText("the next level!", 820, 162);
        } else if (this.currentLvl === 2) {
	    ctx.fillStyle = "red";
            ctx.font = "23px Tahoma";
            ctx.fillText("Collect all the", 820, 120);
            ctx.fillText("apples to", 820, 141);
            ctx.fillText("complete the game!", 820, 162);
	}
    },
    loadAll: function () {
        soundManager.init();
        if (this.currentLvl === 1) {
            mapManager.loadMap("./resources/snakeMap.json");
        } else if (this.currentLvl === 2) {
            mapManager.loadMap("./resources/snakeMapLvl2.json")
        }
        spriteManager.loadAtlas("./resources/sprites.json", "./resources/spritePictures.png");
        gameManager.factory['Snake'] = Player;
        gameManager.factory['Apple'] = Apple;
        gameManager.factory['Coin'] = Coin;
        gameManager.factory['Owl'] = Owl;
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventsManager.setup(canvas);
    },

    play: function () {
        setRecords();
        gameUpdateInterval = setInterval(updateWorld, 10);
    },

    stop: function () {
        localStorage[localStorage.getItem("snake.username")] = this.player.numberCoinsCollect;
        setRecords();
        this.owlUpdateIntervals.forEach(function (interval) {
           clearInterval(interval);
        });
        clearInterval(gameManager.snakeUpdateInterval);
        clearInterval(gameUpdateInterval);
        gameManager.player.isDead = true;
        soundManager.playDead();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mapManager.draw(ctx);
        this.draw(ctx);
        ctx.font = "60px Tahoma";
        ctx.fillStyle = "white";
        ctx.fillText("GAME OVER!", 200, 155);
        gameUpdateInterval = false;
    },
}

function updateWorld() {
    gameManager.update();
}

function setRecords()
{
    records = [];
    for (let key in localStorage)
    {
        if(localStorage.getItem(key) !== "undefined" && key !== "snake.username" && localStorage.getItem(key) != null && key !== "rememberName")
        {
            records.push([key, localStorage.getItem(key)]);
        }
    }
    records.sort(function (a, b) {
        return b[1] - a[1];
    });

    let table = '<table width="30">';
    if(records !== []) {
        for (let i = 0; i < records.length; i++) {
            table += '<tr>';
            table += '<td>' + (i + 1) + ')' + '</td>';
            table += '<td>' + records[i][0] + '</td>';
            table += '<td>' + records[i][1] + '</td>';
            table += '</tr>';
        }
        table += '</table>';
        document.getElementById("recordsTable").innerHTML = table;
    }
}

var gameUpdateInterval;

var canvas = document.getElementById("canvasId");
var ctx = canvas.getContext("2d");

gameManager.loadAll();
gameManager.play();



