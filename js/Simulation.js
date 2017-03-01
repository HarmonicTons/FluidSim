class Simulation {
    constructor(width, height, fluid, canvas) {
        this.width = width;
        this.height = height;
        this.fluid = fluid;
        this.canvas = canvas;

        this.frames = 0;
        this.isPaused = true;
        this.stepDuration = 100;
        this.solverIterations = 10;
        this.areas = [];

        this.densityHalfLife = 1000; // in ms
        this.densityToVelocityEquation = d => {
            return {
                x: 0,
                y: -Math.pow(d / 100, 0.4) / 1.2
            };
        };

        this.backgroundWind = 2;

        this.inputStrenght = 300;
        this.inputRadius = 4;
        this.inputVelocityFactor = 0.2;

        this.resetObstacleMap();

        this.renderer = new Renderer(this, canvas);
        this.inputListener = new InputListener(canvas);
    }

    get densityDecay() {
        return Math.pow(1 / 2, this.stepDuration / this.densityHalfLife);
    }

    get ratio() {
        return {
            x: this.canvas.width / this.width,
            y: this.canvas.height / this.height
        };
    }

    _get(what, x, y) {
        if (x < 0 || x > this.width || y < 0 || y > this.height) {
            return -1;
        }
        for (let i = 0; i < this.areas.length; i++) {
            let area = this.areas[i];
            let x0 = area.position.x;
            let y0 = area.position.y;
            let w = area.field.width;
            let h = area.field.height;

            if (x >= x0 && x < x0 + w && y >= y0 && y < y0 + h) {
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
        for (let x = x0; x < x0 + w; x++) {
            for (let y = y0; y < y0 + h; y++) {
                this.setObstacle(x, y, 1);
            }
        }
    }

    setObstacleDisk(x0, y0, r) {
        for (let x = x0 - r; x <= x0 + r; x++) {
            for (let y = y0 - r; y <= y0 + r; y++) {
                if (Math.sqrt((x0 - x) * (x0 - x) + (y0 - y) * (y0 - y)) < r) {
                    this.setObstacle(x, y, 1);
                }
            }
        }
    }

    handleInputs() {
        let inputs = this.inputListener.getInputs();

        inputsForEach: for (let input of inputs) {
            let x = Math.floor(input.position.x / this.ratio.x);
            let y = Math.floor(input.position.y / this.ratio.y);
            let vx = Math.floor(input.speed.x / this.ratio.x);
            let vy = Math.floor(input.speed.y / this.ratio.y);

            for (let area of this.areas) {
                let x0 = area.position.x;
                let y0 = area.position.y;
                let w = area.field.width;
                let h = area.field.height;

                if (x >= x0 && x < x0 + w && y >= y0 && y < y0 + h) {
                    let inputInAreaReferentiel = {
                        position: {
                            x: x - x0,
                            y: y - y0
                        },
                        speed: {
                            x: vx,
                            y: vy
                        }
                    };
                    area.inputs.push(inputInAreaReferentiel);
                    continue inputsForEach;
                }
            }

            // TODO: the input is not in any existing area => create a new one
            console.warn("The input is not in any existing area.");

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
            area.field.resetSources();
        });

        this.renderer.render();

        this.frames++;
        requestAnimationFrame(() => this.simulationLoop());
    }

    applyInputs(area) {
        let inputs = area.inputs;
        inputs.forEach(({
            position,
            speed
        }) => {
            let x0 = position.x;
            let y0 = position.y;
            let r = this.inputRadius;
            for (let x = x0 - r; x <= x0 + r; x++) {
                for (let y = y0 - r; y <= y0 + r; y++) {
                    let distance = Math.sqrt((x0 - x) * (x0 - x) + (y0 - y) * (y0 - y));
                    if (distance < r) {
                        let strenght = this.inputStrenght * (1 - distance / r);
                        area.field.addDensitySource(x, y, strenght);
                        area.field.addXVelocitySource(x, y, speed.x * this.inputVelocityFactor);
                        area.field.addYVelocitySource(x, y, speed.y * this.inputVelocityFactor);
                    }
                }
            }
        });
        area.inputs = [];
    }

    applyPhysics(area) {
        for (let x = 0; x < area.field.width; x++) {
            for (let y = 0; y < area.field.height; y++) {
                // density decay
                let density = area.field.getDensity(x, y);
                let d = density * this.densityDecay;
                area.field.setDensity(x, y, d);
                // velocity
                let dv = this.densityToVelocityEquation(density);
                let vx = this.backgroundWind * (Math.random() - 0.5) + dv.x;
                let vy = this.backgroundWind * (Math.random() - 0.5) + dv.y;
                area.field.addXVelocitySource(x, y, vx);
                area.field.addYVelocitySource(x, y, vy);
            }
        }
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
        return newArea;
    }

    removeArea(area) {
        let index = this.areas.indexOf(area);
        if (index >= 0) {
            this.areas.splice(index, 1);
        } else {
            console.warn("The area specified does not exist in the simulation.");
        }
    }

    moveArea(area, dx, dy) {
        area.position.x += dx;
        area.position.y += dy;

        let w = area.field.width;
        let h = area.field.height;

        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                area.field.setObstacle(i, j, this.getObstacle(i + area.position.x, j + area.position.y));
            }
        }

        function setTo0(x, y) {
            area.field.setDensity(x, y, 0);
            area.field.setXVelocity(x, y, 0);
            area.field.setYVelocity(x, y, 0);
            area.field.setDensitySource(x, y, 0);
            area.field.setXVelocitySource(x, y, 0);
            area.field.setYVelocitySource(x, y, 0);
        }

        function setFromOld(x, y) {
            area.field.setDensity(x, y, area.field.getDensity(x + dx, y + dy));
            area.field.setXVelocity(x, y, area.field.getXVelocity(x + dx, y + dy));
            area.field.setYVelocity(x, y, area.field.getYVelocity(x + dx, y + dy));
            area.field.setDensitySource(x, y, area.field.getDensitySource(x + dx, y + dy));
            area.field.setXVelocitySource(x, y, area.field.getXVelocitySource(x + dx, y + dy));
            area.field.setYVelocitySource(x, y, area.field.getYVelocitySource(x + dx, y + dy));
        }

        if (dx > 0 && dy > 0) {
            for (let x = 1; x < w - 1; x++) {
                if (x >= w - dx) {
                    for (let y = 1; y < h - 1; y++) {
                        setTo0(x, y);
                    }
                } else {
                    for (let y = 1 ; y < h - 1; y++) {
                        if (y >= h - dy) {
                            setTo0(x, y);
                        } else {
                            setFromOld(x, y);
                        }
                    }
                }
            }
        } else if (dx < 0 && dy > 0) {
            for (let x = w - 2; x >= 1; x--) {
                if (x < dx) {
                    for (let y = 1; y < h - 1; y++) {
                        setTo0(x, y);
                    }
                } else {
                    for (let y = 1; y < h - 1; y++) {
                        if (y >= h - dy) {
                            setTo0(x, y);
                        } else {
                            setFromOld(x, y);
                        }
                    }
                }
            }
        } else if (dx > 0 && dy < 0) {
            for (let x = 1; x < w - 1; x++) {
                if (x >= w - dx) {
                    for (let y = 1; y < h - 1; y++) {
                        setTo0(x, y);
                    }
                } else {
                    for (let y = h - 2; y >= 1; y--) {
                        if (y < dy) {
                            setTo0(x, y);
                        } else {
                            setFromOld(x, y);
                        }
                    }
                }
            }
        } else if (dx < 0 && dy < 0) {
            for (let x = w - 2; x >= 1; x--) {
                if (x < -dx) {
                    for (let y = 1; y < h - 1; y++) {
                        setTo0(x, y);
                    }
                } else {
                    for (let y = h - 2; y >= 1; y--) {
                        if (y < -dy) {
                            setTo0(x, y);
                        } else {
                            setFromOld(x, y);
                        }
                    }
                }
            }
        }
    }
}
