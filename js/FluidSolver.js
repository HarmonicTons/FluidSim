/**
 * 2D Fluid solver
 *
 * Use .nextStep() to solve and update the fluid field.
 *
 * Original code in C written by Jos Stam.
 * http://www.dgp.toronto.edu/people/stam/reality/index.html
 * Adapted to JavaScript by Thomas Roncin.
 */

/**
 * Fluid field
 * @param {number} width width of the field
 * @param {number} height height of the field
 * @param {Object[]} [boundaries=[]] rectangular obstacles in the field
 * @param {number} boundaries[].x x position of top left corner
 * @param {number} boundaries[].y y position of top left corner
 * @param {number} boundaries[].w width
 * @param {number} boundaries[].h height
 * @param {number} [diffusionRate = 0] diffusion rate of the fluid
 * @param {number} [viscosity = 0] viscosity of the fluid
 * @param {number} [iterations = 10] number of iterations to calculate next step
 * @param {number} [defaultStep = 100] default step's duration (in ms)
 */
class FluidField2 {
    constructor(width, height, boundaries = [], diffusionRate = 0, viscosity = 0, iterations = 10, defaultStep = 100) {
        this.width = width;
        this.height = height;
        this.boundaries = boundaries;
        this.diffusionRate = diffusionRate;
        this.diffusionRate = 0; // FIXME a diff != 0 makes the solver diverge no matter what
        this.viscosity = diffusionRate;
        this.iterations = iterations;
        this.defaultStep = defaultStep;
        let size = (width + 2) * (height + 2); // +2 for borders
        this.densityField = (new Array(size)).fill(0);
        this.xVelocityField = (new Array(size)).fill(0);
        this.yVelocityField = (new Array(size)).fill(0);
        this.densitySourceField = (new Array(size)).fill(0);
        this.xVelocitySourceField = (new Array(size)).fill(0);
        this.yVelocitySourceField = (new Array(size)).fill(0);
    }

    get area() {
        return (this.width + 2) * (this.height + 2);
    }

    index(x, y) {
        return x + (this.width + 2) * y;
    }

    /**
     * Update the fluid field
     * @param {number} [step=defaultStep] step's duration
     */
    update(step = this.defaultStep) {
        // impeach negative density to happen
        this._noNegativeDensity(step);
        // update density field
        this._updateDensityField(step);
        // update velocity fields
        this._updateVelocityField(step);

        // FIXME: misplaced responsability
        [this.densitySourceField, this.xVelocitySourceField, this.yVelocitySourceField].forEach(x => x.fill(0));
    }

    _noNegativeDensity(dt) {
        // TODO
        // for each point check that densityField >= densityInfluenceField * dt
        // otherwise densityInfluenceField = densityField / dt;
        // if densityField < 0 set to 0
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

    // TODO: improve
    // adapt to every shape not just rectangle
    // with a boundariesField
    _set_bnd(b, u) {
        let bnds = this.boundaries;
        let IX = (x, y) => x + (this.width + 2) * y;

        if (bnds.length == 0) return;
        bnds.forEach(({
            x: x0,
            y: y0,
            w: w0,
            h: h0
        }) => {
            // horizontal sides
            for (let i = 1; i < w0 - 1; i++) {
                u[IX(x0 + i, y0)] = b == 2 ? -u[IX(x0 + i, y0 - 1)] : u[IX(x0 + i, y0 - 1)];
                u[IX(x0 + i, y0 + h0 - 1)] = b == 2 ? -u[IX(x0 + i, y0 + h0)] : u[IX(x0 + i, y0 + h0)];
            }
            // vertical sides
            for (let i = 1; i < h0 - 1; i++) {
                u[IX(x0, y0 + i)] = b == 1 ? -u[IX(x0 - 1, y0 + i)] : u[IX(x0 - 1, y0 + i)];
                u[IX(x0 + w0 - 1, y0 + i)] = b == 1 ? -u[IX(x0 + w0, y0 + i)] : u[IX(x0 + w0, y0 + i)];
            }

            // center
            for (let i = 2; i < w0 - 2; i++) {
                for (let j = 2; j < h0 - 2; j++) {
                    u[IX(x0 + i, y0 + j)] = 0;
                }
            }

            // corners
            u[IX(x0, y0)] = u[IX(x0 - 1, y0 - 1)];
            u[IX(x0, y0 + h0 - 1)] = u[IX(x0 - 1, y0 + h0)];
            u[IX(x0 + w0 - 1, y0)] = u[IX(x0 + w0, y0 - 1)];
            u[IX(x0 + w0 - 1, y0 + h0 - 1)] = u[IX(x0 + w0, y0 + h0)];
        });
    }

    _lin_solve(b, x, x0, a, c) {
        let IX = (x, y) => x + (this.width + 2) * y;
        let kMax = this.iterations;
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
