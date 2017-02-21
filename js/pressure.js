//import {FluidSolver} from "FluidSolver";

function Simulation() {
    this.cycles = 0; // nombre total d'iterations effectuées depuis le lancement de la simulation
    this.isPaused = true;
    this.stepDuration = 0.1; // en secondes
    this.solverIterations = 10;
    this.areas = [];
    this.visc = 0;
    this.diff = 0;

    // 1 simulation = 1 ensemble de field
    // c'est la simulation qui sait où sont placer les fields dans l'univers du jeu
    // les fields eux-mêmes sont totalement ignorant de ce qui se passe en dehors de leurs bordures
    // c'est la simulation qui choisie de déplacer un field par exemple en fonction de la position des curseurs / sources
    // c'est la simulation qui controle la position des sources et des obstacles
    // 1 field ne contient que l'information de sont fluid

    this.start = function() {
        if (!this.isPaused) {
            console.log("The simulation is already running.");
            return;
        }
        this.isPaused = false;
        this.simulationLoop();
    };

    this.pause = function() {
        if (this.isPaused) {
            console.log("The simulation is already paused.");
            return;
        }
        this.isPaused = true;
    };

    this.ui = function() {
        return ; // renvoie un object permettant d'indiquer les actions de l'utilisateur > impact userActions
    };

    this.simulationLoop = function() {
        if (this.isPaused) {
            return;
        }

        this.areas.forEach(area => {
            let field;
            this.applyUserActions(field);
            this.applyPhysics(field);
            field.fluidSolver.nextStep(this.stepDuration);
        });

        this.cycles++;
        setTimeout(function() {
            this.simulationLoop();
        }, this.stepDuration * 1000);
    };

    this.newArea = function(x, y, field) {
        this.areas.push({
            position: {
                x: x,
                y: y
            },
            field: field,
            solver: new FluidSolver(field, this.solverIterations)
        });
    };
}

// la notion de field n'est plus nécessaire
// passer directement à l'area (qui contient plus d'infos)

function Field(w, h) {
    this.height = 0;
    this.width = 0;
    this.size = (w + 2) * (h + 2); // TODO les + 2 disparaitrons quand les bords ne seront plus systématiques

    function resetField() {
        return (new Uint8Array(this.size)).fill(0);
    }

    this.bnd = resetField();
    this.u = resetField();
    this.v = resetField();
    this.d = resetField();
    this.u0 = resetField();
    this.v0 = resetField();
    this.d0 = resetField();

    this.visc = 0;
    this.diff = 0;

    let N = w; // TODO: prendre en compte largeur et hauter
    this.ix = (i, j) => i + (N + 2) * j;

    this.set = function(u, x, y, v) {
        this[u][this.ix(x,y)] = v;
    };

    this.get = function(u, x, y) {
        return this[u][this.ix(x,y)];
    };
}





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
            for (let y = 0; y < height ; y++) {
                let d = dens[(x + 1) + (y + 1) * rowSize];
                let p = d*1.5;
                dens_prev[(x + 1) + (y + 1) * rowSize] = -p;
                let r = 1;
                let rng = Math.random() * r - r/2;
                    u_prev[(x + 1) + (y + 1) * rowSize] = rng;
                    v_prev[(x + 1) + (y + 1) * rowSize] = -Math.pow(d/100,0.4)/1.2;
            }
        }
    }

    this.update = function() {
        applyPhysics(); // modify x_prev according to dens u et v
        uiCallback(new Field(dens_prev, u_prev, v_prev)); // modify x_prev according to user actions
        this.fluidSolver.nextStep();
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
        var res = wRes * hRes;
        if (res > 0 && res < 1000000 && (wRes != width || hRes != height)) {
            width = wRes;
            height = hRes;
            reset();
            return true;
        }
        return false;
    };
    this.setResolution(64, 64);

    this.fluidSolver = new FluidSolver(width, height, dens, u, v, dens_prev, u_prev, v_prev, 0, 0);
}
