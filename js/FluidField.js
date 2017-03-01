/**
 * 2D Fluid solver
 *
 * Original solver written in C by Jos Stam.
 * http://www.dgp.toronto.edu/people/stam/reality/index.html
 * Adapted to JavaScript and completed by Thomas Roncin.
 */

/**
 * Fluid field
 * @param {number} width width of the field
 * @param {number} height height of the field
 * @param {number[]} obstacleMap obstacle field
 * @param {number} [diffusionRate = 0] diffusion rate of the fluid
 * @param {number} [viscosity = 0] viscosity of the fluid
 * @param {number} [solverIterations = 10] number of iterations to calculate next step
 * @param {number} [defaultStepDuration = 100] default step's duration (in ms)
 */

class FluidField {
    constructor(width, height, diffusionRate = 0, viscosity = 0, solverIterations = 10, defaultStepDuration = 100) {
        this.width = width;
        this.height = height;
        this.diffusionRate = diffusionRate;
        this.viscosity = viscosity;
        this.solverIterations = solverIterations;
        this.defaultStepDuration = defaultStepDuration;
        let size = (width + 2) * (height + 2); // +2 for borders
        this.obstacleMap = (new Array(size)).fill(0);
        this.densityField = (new Array(size)).fill(0);
        this.xVelocityField = (new Array(size)).fill(0);
        this.yVelocityField = (new Array(size)).fill(0);
        this.densitySourceField = (new Array(size)).fill(0);
        this.xVelocitySourceField = (new Array(size)).fill(0);
        this.yVelocitySourceField = (new Array(size)).fill(0);
    }

    index(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return -1;
        }
        return (x + 1) + (this.width + 2) * (y + 1);
    }

    //obstacleMap
    getObstacle(x, y) {
        let i = this.index(x, y);
        if (i >= 0) {
            return this.obstacleMap[this.index(x, y)];
        }
        throw `the specified coordinates are out of the field: (x: ${x}, y: ${y})`;
    }
    setObstacle(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.obstacleMap[this.index(x, y)] = v;
        }
    }
    // fields
    getDensity(x, y) {
        let i = this.index(x, y);
        if (i >= 0) {
            return this.densityField[this.index(x, y)];
        }
        throw `the specified coordinates are out of the field: (x: ${x}, y: ${y})`;
    }
    getXVelocity(x, y) {
        let i = this.index(x, y);
        if (i >= 0) {
            return this.xVelocityField[this.index(x, y)];
        }
        throw `the specified coordinates are out of the field: (x: ${x}, y: ${y})`;
    }
    getYVelocity(x, y) {
        let i = this.index(x, y);
        if (i >= 0) {
            return this.yVelocityField[this.index(x, y)];
        }
        throw `the specified coordinates are out of the field: (x: ${x}, y: ${y})`;
    }
    setDensity(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.densityField[this.index(x, y)] = v;
        }
    }
    setXVelocity(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.xVelocityField[this.index(x, y)] = v;
        }
    }
    setYVelocity(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.yVelocityField[this.index(x, y)] = v;
        }
    }
    // sources
    getDensitySource(x, y) {
        let i = this.index(x, y);
        if (i >= 0) {
            return this.densitySourceField[this.index(x, y)];
        }
        throw `the specified coordinates are out of the field: (x: ${x}, y: ${y})`;
    }
    getXVelocitySource(x, y) {
        let i = this.index(x, y);
        if (i >= 0) {
            return this.xVelocitySourceField[this.index(x, y)];
        }
        throw `the specified coordinates are out of the field: (x: ${x}, y: ${y})`;
    }
    getYVelocitySource(x, y) {
        let i = this.index(x, y);
        if (i >= 0) {
            return this.yVelocitySourceField[this.index(x, y)];
        }
        throw `the specified coordinates are out of the field: (x: ${x}, y: ${y})`;
    }
    setDensitySource(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.densitySourceField[this.index(x, y)] = v;
        }
    }
    setXVelocitySource(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.xVelocitySourceField[this.index(x, y)] = v;
        }
    }
    setYVelocitySource(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.yVelocitySourceField[this.index(x, y)] = v;
        }
    }
    addDensitySource(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.densitySourceField[this.index(x, y)] += v;
        }
    }
    addXVelocitySource(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.xVelocitySourceField[this.index(x, y)] += v;
        }
    }
    addYVelocitySource(x, y, v) {
        let i = this.index(x, y);
        if (i >= 0) {
            this.yVelocitySourceField[this.index(x, y)] += v;
        }
    }
    resetSources() {
        this.densitySourceField.fill(0);
        this.xVelocitySourceField.fill(0);
        this.yVelocitySourceField.fill(0);
    }


    /**
     * Update the fluid field
     * @param {number} [stepDuration=default] step's duration
     */
    update(stepDuration = this.defaultStepDuration) {
        // update density field
        this._updateDensityField(stepDuration);
        // update velocity fields
        this._updateVelocityField(stepDuration);
    }

    _updateDensityField(dt) {
        let x = this.densityField;
        let x0 = this.densitySourceField;
        let diff = this.diffusionRate;
        let u = this.xVelocityField;
        let v = this.yVelocityField;

        this._add_source(x, x0, dt);
        this._diffuse(0, x0, x, diff, dt);
        this._advect(0, x, x0, u, v, dt);
    }

    _updateVelocityField(dt) {
        let u = this.xVelocityField;
        let v = this.yVelocityField;
        let u0 = this.xVelocitySourceField;
        let v0 = this.yVelocitySourceField;
        let visc = this.viscosity;

        this._add_source(u, u0, dt);
        this._add_source(v, v0, dt);
        this._diffuse(1, u0, u, visc, dt);
        this._diffuse(2, v0, v, visc, dt);
        this._project(u0, v0, u, v);
        this._advect(1, u, u0, u0, v0, dt);
        this._advect(2, v, v0, u0, v0, dt);
        this._project(u, v, u0, v0);
    }

    _add_source(x, s, dt) {
        let IX = (x, y) => x + (this.width + 2) * y;
        let w = this.width;
        let h = this.height;

        for (let i = 2; i <= w - 1; i++) {
            for (let j = 2; j <= h - 1; j++) {
                x[IX(i, j)] += dt * s[IX(i, j)] / 1000;
            }
        }
    }

    _set_bnd(b, u) {
        let bnds = this.obstacleMap;
        let w = this.width;
        let h = this.height;
        let IX = (x, y) => x + (this.width + 2) * y;

        for (let i = 1; i <= w; i++) {
            for (let j = 1; j <= h; j++) {
                // if this case is an obstacle
                if (bnds[IX(i, j)] === 1) {
                    let neighboors = [];
                    if (bnds[IX(i - 1, j)] === 0) {
                        neighboors.push(u[IX(i - 1, j)]);
                    }
                    if (bnds[IX(i + 1, j)] === 0) {
                        neighboors.push(u[IX(i + 1, j)]);
                    }
                    if (bnds[IX(i, j - 1)] === 0) {
                        neighboors.push(u[IX(i, j - 1)]);
                    }
                    if (bnds[IX(i, j + 1)] === 0) {
                        neighboors.push(u[IX(i, j + 1)]);
                    }
                    if (neighboors.length === 0) {
                        u[IX(i, j)] = 0;
                    } else {
                        let val = neighboors.reduce((sum, n) => sum += n, 0) / neighboors.length;
                        u[IX(i, j)] = b >= 1 ? -val : val;
                    }
                }
            }
        }
    }

    _lin_solve(b, x, x0, a, c) {
        let IX = (x, y) => x + (this.width + 2) * y;
        let kMax = this.solverIterations;
        let w = this.width;
        let h = this.height;

        for (let k = 0; k < kMax; k++) {
            for (let i = 1; i <= w; i++) {
                for (let j = 1; j <= h; j++) {
                    x[IX(i, j)] = (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) / c;
                }
            }
            this._set_bnd(b, x);
        }
    }

    _diffuse(b, x, x0, diff, dt) {
        let a = dt * diff * this.width * this.height / 1000;
        this._lin_solve(b, x, x0, a, 1 + 4 * a);
    }

    _advect(b, d, d0, u, v, dt) {
        let IX = (x, y) => x + (this.width + 2) * y;
        let w = this.width;
        let h = this.height;

        let dt0 = dt * Math.sqrt(w * h) / 1000;
        for (let i = 1; i < w; i++) {
            for (let j = 1; j < h; j++) {
                let x = i - dt0 * u[IX(i, j)];
                let y = j - dt0 * v[IX(i, j)];

                if (x < 0.5) x = 0.5;
                if (x > w + 0.5) x = w + 0.5;
                let i0 = parseInt(x);
                let i1 = i0 + 1;

                if (y < 0.5) y = 0.5;
                if (y > h + 0.5) y = h + 0.5;
                let j0 = parseInt(y);
                let j1 = j0 + 1;

                let s1 = x - i0;
                let s0 = 1 - s1;
                let t1 = y - j0;
                let t0 = 1 - t1;

                d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
            }
        }
        this._set_bnd(b, d);
    }

    _project(u, v, p, div) {
        let IX = (x, y) => x + (this.width + 2) * y;
        let w = this.width;
        let h = this.height;

        for (let i = 1; i < w; i++) {
            for (let j = 1; j < h; j++) {
                div[IX(i, j)] = -0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]) / Math.sqrt(w * h);
                p[IX(i, j)] = 0;
            }
        }
        this._set_bnd(0, div);
        this._set_bnd(0, p);

        this._lin_solve(0, p, div, 1, 4);

        for (let i = 1; i < w; i++) {
            for (let j = 1; j < h; j++) {
                u[IX(i, j)] -= 0.5 * Math.sqrt(w * h) * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
                v[IX(i, j)] -= 0.5 * Math.sqrt(w * h) * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
            }
        }
        this._set_bnd(1, u);
        this._set_bnd(2, v);
    }
}
