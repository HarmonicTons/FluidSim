class Simulation {
    constructor(width, height, canvas) {
        this.width = width;
        this.height = height;
        this.canvas = canvas;

        this.cycles = 0;
        this.isPaused = true;
        this.stepDuration = 100;
        this.solverIterations = 10;
        this.areas = [];
        this.fluid = {
            name: "air",
            viscosity: 0,
            diffusionRate: 0
        }

        this.resetObstacleMap();

        this.inputs = [];

        this.renderer = new Renderer(this, canvas);
        this.inputListener = new InputListener(canvas); // meh.

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

    getDensity(x,y) {
        return this._get('density',x,y);
    }

    getXVelocity(x,y) {
        return this._get('xVelocity',x,y);
    }

    getYVelocity(x,y) {
        return this._get('yVelocity',x,y);
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

    setObstacle(x, y, o) {
        this.obstacleMap[this._ix(x, y)] = o;
    }

    // TODO: add angle
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
        this.inputs.forEach(input => {
            // TODO
            // if the input is outside of any area: create a new one
            // if the input is inside an area: add to area.inputs with coordinates in area ref
        });
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

        this.cycles++;
        requestAnimationFrame(this.simulationLoop);
    }

    applyInputs(area) {
        let inputs = area.inputs;
        inputs.forEach(input => {
            // TODO
            // exemples:
            // area.field.setDensity(input.x, input.y, val);
        });
    }

    applyPhysics(area) {
        // TODO
        // fire physic or other
    }

    newArea(x, y, w, h) {

        // TODO: get bnds from global bnds

        this.areas.push({
            position: {
                x: x,
                y: y
            },
            field: new FluidField2(w, h), // add bnds
            inputs: []
        });
    }
}




// OLD:

function FluidField() {


    var uiCallback;

    function Field(dens, u, v) {
        // Just exposing the fields here rather than using accessors is a measurable win during display (maybe 5%)
        // but makes the code ugly.
        this.setDensity = function(x, y, d) {
            dens[(x + 1) + (y + 1) * rowSize] = d;
        };
        this.getDensity = function(x, y) {
            return dens[(x + 1) + (y + 1) * rowSize];
        };
        this.getAvgDensity = function() {
            return dens.reduce((s, c) => s + c, 0) / dens.length;
        };
        this.getMaxDensity = function() {
            return dens.reduce((m, c) => c > m ? c : m);
        };
        this.setVelocity = function(x, y, xv, yv) {
            u[(x + 1) + (y + 1) * rowSize] = xv;
            v[(x + 1) + (y + 1) * rowSize] = yv;
        };
        this.getXVelocity = function(x, y) {
            return u[(x + 1) + (y + 1) * rowSize];
        };
        this.getYVelocity = function(x, y) {
            return v[(x + 1) + (y + 1) * rowSize];
        };
        this.width = function() {
            return width;
        };
        this.height = function() {
            return height;
        };
    }

    this.getFieldInfo = function() {
        return new Field(dens, u, v);
    };


    function applyPhysics() {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let d = dens[(x + 1) + (y + 1) * rowSize];
                let p = d * 1.5;
                dens_prev[(x + 1) + (y + 1) * rowSize] = -p;
                let r = 1;
                let rng = Math.random() * r - r / 2;
                u_prev[(x + 1) + (y + 1) * rowSize] = rng;
                v_prev[(x + 1) + (y + 1) * rowSize] = -Math.pow(d / 100, 0.4) / 1.2;

            }
        }
    }

    this.update = function(fps) {
        applyPhysics(); // modify x_prev according to dens u et v
        uiCallback(new Field(dens_prev, u_prev, v_prev)); // modify x_prev according to user actions
        this.fluidSolver.update();
        displayFunc(new Field(dens, u, v));
    };
    this.setDisplayFunction = function(func) {
        displayFunc = func;
    };


    this.iterations = function() {
        return iterations;
    };
    this.setIterations = function(iters) {
        if (iters > 0 && iters <= 100)
            iterations = iters;
    };
    this.setUICallback = function(callback) {
        uiCallback = callback;
    };
    var iterations = 10;
    var visc = 0;
    var dt = 0.1;
    var dens;
    var dens_prev;
    var u;
    var u_prev;
    var v;
    var v_prev;
    var width;
    var height;
    var rowSize;
    var size;
    var displayFunc;

    function reset() {
        rowSize = width + 2;
        size = (width + 2) * (height + 2);
        dens = new Array(size);
        dens_prev = new Array(size);
        u = new Array(size);
        u_prev = new Array(size);
        v = new Array(size);
        v_prev = new Array(size);
        for (var i = 0; i < size; i++)
            dens_prev[i] = u_prev[i] = v_prev[i] = dens[i] = u[i] = v[i] = 0;
    }
    this.reset = reset;
    this.setResolution = function(hRes, wRes) {
        width = wRes;
        height = hRes;

        reset();


        let bnds = (new Array((width + 2) * (height + 2))).fill(0);
        /*
        let x0 = 40;
        let y0 = 120;
        for (let i = 20; i < 60; i++) {
            for (let j = 100; j < 140; j++) {
                if (Math.sqrt((x0 - i) * (x0 - i) + (y0 - j) * (y0 - j)) <= 15) {
                    bnds[i + (width + 2) * j] = 1;
                }
            }
        }
        */

        this.fluidSolver = new FluidField2(width, height, bnds);
        dens = this.fluidSolver.densityField;
        u = this.fluidSolver.xVelocityField;
        v = this.fluidSolver.yVelocityField;
        dens_prev = this.fluidSolver.densitySourceField;
        u_prev = this.fluidSolver.xVelocitySourceField;
        v_prev = this.fluidSolver.yVelocitySourceField;
    };


}
