class Simulation {
    constructor(width, height, canvas) {
        this.width = width;
        this.height = height;
        this.canvas = canvas;

        this.frames = 0;
        this.isPaused = true;
        this.stepDuration = 100;
        this.solverIterations = 10;
        this.areas = [];

        this.fluid = {
            name: "air",
            viscosity: 0,
            diffusionRate: 0
        }

        this.inputStrenght = 100;

        this.resetObstacleMap();

        this.renderer = new Renderer(this, canvas);
        this.inputListener = new InputListener(canvas);
    }

    get ratio() {
        return {
            x: this.canvas.width / this.width,
            y: this.canvas.height / this.height
        }
    }

    _get(what, x, y) {
        if (x < 0 || x > this.width || y < 0 || y > this.height) {
            return -1;
        }
        for (let i = 0; i < this.areas.length; i++) {
            let area = this.areas[i];
            let x0 = area.position.x;
            let y0 = area.position.y;
            let w = area.field.w;
            let h = area.field.h;

            if (x > x0 && x < x0 + w && y > y0 && y < y0 + h) {
                if (what === "density") {
                    return area.field.getDensity(x - x0, y - y0);
                }
                if (what === "xVelocity") {
                    return area.field.getXVelocity()(x - x0, y - y0);
                }
                if (what === "yVelocity") {
                    return area.field.getYVelocity(x - x0, y - y0);
                }
            }
        }
        return 0;
    }

    getDensity(x, y) {
        return this._get('density', x, y);
    }

    getXVelocity(x, y) {
        return this._get('xVelocity', x, y);
    }

    getYVelocity(x, y) {
        return this._get('yVelocity', x, y);
    }

    start() {
        if (!this.isPaused) {
            console.log("The simulation is already running.");
            return;
        }
        this.isPaused = false;
        this.simulationLoop();
    }

    pause() {
        if (this.isPaused) {
            console.log("The simulation is already paused.");
            return;
        }
        this.isPaused = true;
    }

    resetObstacleMap() {
        let size = this.width * this.height;
        this.obstacleMap = (new Array(size)).fill(0);
    }

    _ix(x, y) {
        return x + this.width * y;
    }

    getObstacle(x, y) {
        return this.obstacleMap[this._ix(x, y)];
    }
    setObstacle(x, y, o) {
        this.obstacleMap[this._ix(x, y)] = o;
    }

    // TODO: add rotation
    setObstacleSquare(x0, y0, w, h) {
        for (let x = x0; x < w; x++) {
            for (let y = y0; y < h; y++) {
                setObstacle(x, y, 1);
            }
        }
    }

    setObstacleCircle(x0, y0, r) {
        for (let x = x0 - r; x <= x0 + r; x++) {
            for (let y = y0 - r; y <= y0 + r; y++) {
                if (Math.sqrt((x0 - x) * (x0 - x) + (y0 - y) * (y0 - y)) <= r) {
                    setObstacle(x, y, 1);
                }
            }
        }
    }

    handleInputs() {
        let inputs = this.inputListener.getInputs();
        inputsForEach: for (let input of inputs) {
            let x0 = input.position.x / this.ratio.x;
            let y0 = input.position.y / this.ratio.y;
            for (let area of this.areas) {
                if (x0 >= area.position.x &&
                    x0 < area.position.x + area.field.width &&
                    y0 >= area.position.y &&
                    y0 < area.position.y + area.field.height) {
                    let inputInAreaReferentiel = {
                        position: {
                            x: x0 - area.position.x,
                            y: y0 - area.position.y
                        }
                        speed: {
                            x: input.speed.x / this.ratio.x,
                            y: input.speed.y / this.ratio.y,
                        }
                    }
                    area.inputs.push(inputInAreaReferentiel);
                    continue inputsForEach;
                }
            }

            // TODO: the input is not in any existing area => create a new one
        }
    }

    simulationLoop() {
        if (this.isPaused) {
            return;
        }

        this.handleInputs();

        this.areas.forEach(area => {
            this.applyInputs(area);
            this.applyPhysics(area);
            area.field.update();
        });

        this.renderer.render();

        this.frames++;
        requestAnimationFrame(this.simulationLoop);
    }

    applyInputs(area) {
        let inputs = area.inputs;
        let strenght = this.inputStrenght;
        inputs.forEach({position, speed} => {
            area.field.setDensity(position.x, position.y, strenght);
            area.field.setXVelocity(position.x, position.y, speed.x);
            area.field.setYVelocity(position.x, position.y, speed.y);
        });
    }

    applyPhysics(area) {
        // TODO
        // fire physic or other
    }

    newArea(x, y, w, h) {
        let newArea = {
            position: {
                x: x,
                y: y
            },
            field: new FluidField(w, h, this.fluid.diffusionRate, this.fluid.viscosity, this.solverIterations, this.stepDuration),
            inputs: []
        };

        // fill the obstacleMap of the area with the data of the obstacleMap of the Simulation
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                newArea.field.setObstacle(i, j, this.getObstacle(i + x, j + y));
            }
        }
        this.areas.push(newArea);
    }
}
