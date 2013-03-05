/**
 * World represent the concrete space of the game.
 * @author Simon Chauvin
 */
FMENGINE.fmBox2DWorld = function (pState, pWidth, pHeight) {
    "use strict";
    var that = Object.create(FMENGINE.fmWorld(pState, pWidth, pHeight));

    /**
     * Init the Box2D world.
     */
    that.init = function (gravity, sleep) {
        var b2World = Box2D.Dynamics.b2World,
        b2Vec2 = Box2D.Common.Math.b2Vec2;
        new b2World(new b2Vec2(gravity.x / FMENGINE.fmParameters.PIXELS_TO_METERS, gravity.y / FMENGINE.fmParameters.PIXELS_TO_METERS), sleep);
    };

    /**
     * Add a tile map to the Box2D world.
     */
    that.createTiles = function (tileMap) {
        var i, j, k, lines = tileMap.length, col, tileSet = tileMap.getTileSet(), tileWidth = tileMap.getTileWidth(), tileHeight = tileMap.getTileHeight();
        for (i = 0; i < lines; i = i + 1) {
            col = tileMap[i].length;
            for (j = 0; j < col; j = j + 1) {
                var tile = tileMap[i][j], tileSetWidth = tileSet.width, tileSetHeight = tileSet.height, xOffset, yOffset;
                if (tile > 0) {
                    //Create Box2D tile
                    tileMap[i][j] = FMENGINE.fmGameObject(tileMap.getZIndex());
                    FMENGINE.fmSpatialComponent(j * tileWidth, i * tileHeight, tileMap[i][j]);
                    var renderer = FMENGINE.fmSpriteRendererComponent(tileSet, tileWidth, tileHeight, tileMap[i][j]);
                    //Select the right tile in the tile set
                    xOffset = (tile - 1) * tileWidth;
                    yOffset = Math.floor(xOffset / tileSetWidth) * tileHeight;
                    if (xOffset >= tileSetWidth) {
                        yOffset = Math.floor(xOffset / tileSetWidth) * tileHeight;
                        xOffset = (xOffset % tileSetWidth);
                    }
                    renderer.setXOffset(xOffset);
                    renderer.setYOffset(yOffset);

                    var physicComponent = FMENGINE.fmB2BoxComponent(tileWidth, tileHeight, that, tileMap[i][j]);
                    physicComponent.init(FMParameters.STATIC, 1, 0, 0);
                    //TODO Remove tiles from the game objects list
                    //It shoult have its own list
                    that.state.add(tileMap[i][j]);
                }
            }
        }
    };

    /**
    * Destroy the Box2D world.
    */
    that.destroy = function () {
        that.destroy();
        that = null;
    };

    return that;
};