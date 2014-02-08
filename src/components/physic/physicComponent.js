/*global FM*/
/**
 * Component of basic physics.
 * @class physicComponent
 * @param {int} pWidth width of the collider.
 * @param {int} pHeight height of the collider.
 * @param {fmObject} The object that owns this component.
 * @author Simon Chauvin
 */
FM.physicComponent = function (pWidth, pHeight, pOwner) {
    "use strict";
    /**
     * FM.physicComponent is based on component.
     */
    var that = FM.component(FM.componentTypes.PHYSIC, pOwner),
        /**
         * World of the game.
         */
        world = FM.game.getCurrentState().getWorld(),
        /**
        * Quad tree containing all game objects with a physic component.
         */
        quad = FM.game.getCurrentState().getQuad(),
        /**
         * Represent the mass of the physic game object, 0 means infinite mass.
         */
        mass = 1,
        /**
         * Represent the inverse mass.
         */
        invMass = 1 / mass,
        /**
         * Array storing the types of game objects that can collide with this one.
         */
        collidesWith = [],
        /**
         * Store the collisions that this object has.
         */
        collisions = [],
        /**
         * Store the types of tile map that this object collides with.
         */
        tilesCollisions = [],
        /**
         * Spatial component reference.
         */
        spatial = pOwner.components[FM.componentTypes.SPATIAL],
        /**
         * Correct the position of the physic component.
         */
        correctPosition = function (collision) {
            //Position correction
            var correction = FM.vector(collision.penetration * collision.normal.x, collision.penetration * collision.normal.y),
                aSpatial = collision.a.owner.components[FM.componentTypes.SPATIAL],
                bSpatial = collision.b.owner.components[FM.componentTypes.SPATIAL],
                //aPhysic = collision.a.owner.components[FM.componentTypes.PHYSIC],
                //bPhysic = collision.b.owner.components[FM.componentTypes.PHYSIC],
                massSum = 0,
                aInvMass = collision.a.getInvMass(),
                bInvMass = collision.b.getInvMass();
            massSum = aInvMass + bInvMass;

            //TODO make it work instead of the other below
            /*var percent = 0.2; // usually 20% to 80%
            var slop = 0.01; // usually 0.01 to 0.1
            correction.x = (Math.max(collision.penetration - slop, 0) / (massSum)) * percent * collision.normal.x;
            correction.y = (Math.max(collision.penetration - slop, 0) / (massSum)) * percent * collision.normal.y;
            aSpatial.position.x -= invMass * correction.x;
            aSpatial.position.y -= invMass * correction.y;
            bSpatial.position.x += otherInvMass * correction.x;
            bSpatial.position.y += otherInvMass * correction.y;*/

            //TODO this is here that it goes wrong, need to add offset ?
            aSpatial.position.x -= correction.x * (aInvMass / massSum);
            aSpatial.position.y -= correction.y * (aInvMass / massSum);
            bSpatial.position.x += correction.x * (bInvMass / massSum);
            bSpatial.position.y += correction.y * (bInvMass / massSum);
            //TODO try with physic tiles with fixed integer position value
            //aSpatial.position.reset(Math.floor(aSpatial.position.x), Math.floor(aSpatial.position.y));
            //bSpatial.position.reset(Math.floor(bSpatial.position.x), Math.floor(bSpatial.position.y));
        },
        /**
         * Check collisions with a given array of tiles.
         * @param {tileMap} tiles tiles to test for collisions.
         */
        checkCollisionsWithTiles = function (tiles, tileWidth, tileHeight, xPos, yPos) {
            var i1 = Math.floor(yPos / tileHeight),
                j1 = Math.floor(xPos / tileWidth),
                i2 = Math.floor((yPos + that.height) / tileHeight),
                j2 = Math.floor((xPos + that.width) / tileWidth),
                i,
                j;
            for (i = i1; i <= i2; i = i + 1) {
                for (j = j1; j <= j2; j = j + 1) {
                    if (tiles[i] !== 0 && tiles[i][j] !== -1) {
                        if (j === j1 || j === j2 || i === i1 || i === i2) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },
        /**
         * Try to move the physic object and rollback if it collides with a tile.
         */
        tryToMove = function (tiles, tileWidth, tileHeight, xVel, yVel) {
            var spX = spatial.position.x + xVel,
                spY = spatial.position.y + yVel;
            if (!checkCollisionsWithTiles(tiles, tileWidth, tileHeight, spX + that.offset.x, spY + that.offset.y)) {
                spatial.position.x = spX;
                spatial.position.y = spY;
                return true;
            }
            return false;
        },
        /**
         * Move the physic object one pixel at a time.
         */
        move = function (tileMap, xVel, yVel) {
            var tiles = tileMap.getData(),
                tileWidth = tileMap.getTileWidth(),
                tileHeight = tileMap.getTileHeight(),
                hasCollided = false;
            if (Math.abs(xVel) >= tileWidth || Math.abs(yVel) >= tileHeight) {
                move(tileMap, xVel / 2, yVel / 2);
                move(tileMap, xVel - xVel / 2, yVel - yVel / 2);
                return;
            }

            var hor = tryToMove(tiles, tileWidth, tileHeight, xVel, 0),
                ver = tryToMove(tiles, tileWidth, tileHeight, 0, yVel),
                i,
                maxSpeed,
                vel;
            if (hor && ver) {
                return;
            }
            if (!hor) {
                that.velocity.x = 0;
                maxSpeed = Math.abs(xVel);
                for (i = 0; i < maxSpeed; i = i + 1) {
                    if (xVel === 0) {
                        vel = 0;
                    } else if (xVel > 0) {
                        vel = 1;
                    } else {
                        vel = -1;
                    }
                    if (!tryToMove(tiles, tileWidth, tileHeight, vel, 0)) {
                        hasCollided = true;
                        break;
                    } else {
                        that.velocity.x += vel;
                    }
                }
            }
            if (!ver) {
                that.velocity.y = 0;
                maxSpeed = Math.abs(yVel);
                for (i = 0; i < maxSpeed; i = i + 1) {
                    if (yVel === 0) {
                        vel = 0;
                    } else if (yVel > 0) {
                        vel = 1;
                    } else {
                        vel = -1;
                    }
                    if (!tryToMove(tiles, tileWidth, tileHeight, 0, vel)) {
                        hasCollided = true;
                        break;
                    } else {
                        that.velocity.y += vel;
                    }
                }
            }
            return hasCollided;
        };
    /**
     * Offset of the bounding box or circle.
     */
    that.offset = FM.vector(0, 0);
    /**
     * Width of the collider.
     */
    that.width = pWidth;
    /**
     * Height of the collider.
     */
    that.height = pHeight;
    /**
     * Velocity of the physic component.
     */
    that.velocity = FM.vector(0, 0);
    /**
     * Acceleration applied to the physic object.
     */
    that.acceleration = FM.vector(0, 0);
    /**
     * How much the object's velocity is decreasing when acceleration is
     * equal to 0.
     */
    that.drag = FM.vector(0, 0);
    /**
     * Angular velocity.
     */
    that.angularVelocity = 0;
    /**
     * How much the object's velocity is decreasing when acceleration is
     * equal to 0.
     */
    that.angularDrag = FM.vector(0, 0);
    /**
     * Represent the maximum absolute value of the velocity.
     */
    that.maxVelocity = FM.vector(1000, 1000);
    /**
     * Maximum angular velocity.
     */
    that.maxAngularVelocity = 10000;
    /**
     * Elasticity is a factor between 0 and 1 used for bouncing purposes.
     */
    that.elasticity = 0;
    //Check if a spatial component is present
    if (!spatial && FM.parameters.debug) {
        console.log("ERROR: No spatial component was added and you need one for physics.");
    }

    /**
    * Update the component.
    */
    that.update = function (dt) {
        collisions = [];
        tilesCollisions = [];

        //Limit velocity to a max value
        //TODO maxvelocity should be in pixels per seconds
        var currentVelocity = that.velocity.x + (invMass * that.acceleration.x) * dt,
            maxVelocity = that.maxVelocity.x + (invMass * that.acceleration.x) * dt,
            canMove = true,
            hasCollided = false,
            tileMap,
            gameObjects,
            i,
            j,
            otherGameObject,
            otherPhysic,
            collision = null;
        if (Math.abs(currentVelocity) <= maxVelocity) {
            that.velocity.x = currentVelocity;
        } else if (currentVelocity < 0) {
            that.velocity.x = -maxVelocity;
        } else if (currentVelocity > 0) {
            that.velocity.x = maxVelocity;
        }
        currentVelocity = that.velocity.y + (invMass * that.acceleration.y) * dt;
        maxVelocity = that.maxVelocity.y + (invMass * that.acceleration.y) * dt;
        if (Math.abs(currentVelocity) <= maxVelocity) {
            that.velocity.y = currentVelocity;
        } else if (currentVelocity < 0) {
            that.velocity.y = -maxVelocity;
        } else if (currentVelocity > 0) {
            that.velocity.y = maxVelocity;
        }

        //Apply drag
        if (that.acceleration.x === 0) {
            if (that.velocity.x > 0) {
                that.velocity.x -= that.drag.x;
                if (that.velocity.x < 0) {
                    that.velocity.x = 0;
                }
            } else if (that.velocity.x < 0) {
                that.velocity.x += that.drag.x;
                if (that.velocity.x > 0) {
                    that.velocity.x = 0;
                }
            }
        }
        if (that.acceleration.y === 0) {
            if (that.velocity.y > 0) {
                that.velocity.y -= that.drag.y;
                if (that.velocity.y < 0) {
                    that.velocity.y = 0;
                }
            } else if (that.velocity.y < 0) {
                that.velocity.y += that.drag.y;
                if (that.velocity.y > 0) {
                    that.velocity.y = 0;
                }
            }
        }

        if (collidesWith.length > 0) {
            if (world.hasTileCollisions()) {
                for (i = 0; i < collidesWith.length; i = i + 1) {
                    tileMap = world.getTileMapFromType(collidesWith[i]);
                    if (tileMap && tileMap.canCollide()) {
                        hasCollided = move(tileMap, that.velocity.x * dt, that.velocity.y * dt);
                        if (hasCollided) {
                            tilesCollisions.push({a: that.owner, b: tileMap});
                        }
                        canMove = false;
                    }
                }
            }
        }

        //Update position
        if (canMove) {
            spatial.position.x += that.velocity.x * dt;
            spatial.position.y += that.velocity.y * dt;
        }

        //If this game object collides with at least one type of game object
        if (collidesWith.length > 0) {
            quad = FM.game.getCurrentState().getQuad();
            gameObjects = quad.retrieve(pOwner);
            //If there are other game objects near this one
            for (i = 0; i < gameObjects.length; i = i + 1) {
                otherGameObject = gameObjects[i];
                otherPhysic = otherGameObject.components[FM.componentTypes.PHYSIC];
                //If a game object is found and is alive and is not the current one
                if (otherGameObject.isAlive() && pOwner.getId() !== otherGameObject.getId() && !otherPhysic.isCollidingWith(pOwner) && !that.isCollidingWith(otherGameObject)) {
                    for (j = 0; j < collidesWith.length; j = j + 1) {
                        if (otherGameObject.hasType(collidesWith[j])) {
                            collision = pOwner.components[FM.componentTypes.PHYSIC].overlapsWithObject(otherPhysic);
                            if (collision !== null) {
                                that.addCollision(collision);
                                otherPhysic.addCollision(collision);
                                that.resolveCollision(otherPhysic, collision);
                                otherPhysic.resolveCollision(that, collision);
                                correctPosition(collision);
                            }
                        }
                    }
                }
            }
        }
    };

    /**
     * Resolve collision between current game object and the specified one.
     */
    that.resolveCollision = function (otherPhysic, collision) {
        var relativeVelocity = FM.math.substractVectors(otherPhysic.velocity, that.velocity),
            velocityAlongNormal = relativeVelocity.dotProduct(collision.normal),
            //Compute restitution
            e = Math.min(that.elasticity, otherPhysic.elasticity),
            j = 0,
            otherInvMass = otherPhysic.getInvMass(),
            impulse = FM.vector(0, 0);
        //Do not resolve if velocities are separating.
        if (velocityAlongNormal > 0) {
            return;
        }
        //Compute impulse scalar
        j = -(1 + e) * velocityAlongNormal;
        j /= invMass + otherInvMass;
        //Apply impulse
        impulse.reset(j * collision.normal.x, j * collision.normal.y);
        that.velocity.x -= invMass * impulse.x;
        that.velocity.y -= invMass * impulse.y;
        otherPhysic.velocity.x += otherInvMass * impulse.x;
        otherPhysic.velocity.y += otherInvMass * impulse.y;
    };

    /**
     * Ensure that a game object collides with a certain type of other game 
     * objects (with physic components of course).
     */
    that.addTypeToCollideWith = function (pType) {
        collidesWith.push(pType);
    };

    /**
     * Remove a type that was supposed to collide with this game object.
     */
    that.removeTypeToCollideWith = function (pType) {
        collidesWith.splice(collidesWith.indexOf(pType), 1);
    };
    /**
     * Add a collision object representing the collision to the list of current
     * collisions.
     * @param {collision} collision the collision object.
     */
    that.addCollision = function (collision) {
        collisions.push(collision);
    };

    /**
     * Get the velocity.
     */
    that.getLinearVelocity = function () {
        return that.velocity;
    };

    /**
     * Check if the current physic component is colliding a specified type of physic component.
     * @returns {boolean} whether there is already collision between the the current physic component and the specified type of physic component.
     */
    that.isCollidingWithType = function (pOtherType) {
        var i, collision;
        for (i = 0; i < collisions.length; i = i + 1) {
            collision = collisions[i];
            if ((collision.b && collision.b.owner.hasType(pOtherType))
                    || (collision.a && collision.a.owner.hasType(pOtherType))) {
                return true;
            }
        }
        for (i = 0; i < tilesCollisions.length; i = i + 1) {
            collision = tilesCollisions[i];
            if ((collision.b && collision.b.hasType(pOtherType))
                    || (collision.a && collision.a.hasType(pOtherType))) {
                return true;
            }
        }
        return false;
    };

    /**
     * Check if the current physic component is colliding with another one.
     * @returns {boolean} whether there is already collision between the physic components.
     */
    that.isCollidingWith = function (pOtherGameObject) {
        var i, collision;
        for (i = 0; i < collisions.length; i = i + 1) {
            collision = collisions[i];
            if ((collision.b && collision.b.owner.getId() === pOtherGameObject.getId())
                    || (collision.a && collision.a.owner.getId() === pOtherGameObject.getId())) {
                return true;
            }
        }
        return false;
    };

    /**
     * Set the mass of the physic object.
     */
    that.setMass = function (newMass) {
        mass = newMass;
        if (mass === 0) {
            invMass = 0;
        } else {
            invMass = 1 / mass;
        }
    };

    /**
     * Retrieve the mass of the physic object.
     */
    that.getMass = function () {
        return mass;
    };

    /**
     * Retrieve the inverse mass of the physic object.
     */
    that.getInvMass = function () {
        return invMass;
    };

    return that;
};