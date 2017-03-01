class InputListener {
    /**
     * @param {DOM} element DOM element to listen to
     */
    constructor(element) {
        this.element = element;
        let mouseData = new MouseData();
        this.mouseData = mouseData;

        let self = this;
        this.element.onmousemove = function(e) {
            mouseData.position = {
                x: e.offsetX,
                y: e.offsetY,
                _at: Date.now()
            };
            return false;
        }
        this.element.onmouseup = function(e) {
            mouseData.status = 'up';
        };
        this.element.onmousedown = function(e) {
            mouseData.status = 'down';
        };

    }

    getInputs() {
        let inputs = [];
        let mouseData = this.mouseData;
        if (mouseData.status === 'down') {
            inputs.push({
                position: mouseData.position,
                speed: mouseData.speed
            })
        }

        // TODO: add touch events

        return inputs;
    }
}

class MouseData {
    constructor() {
        this.status = 'up';
        this.position = {
            x: 0,
            y: 0,
            _at: Date.now()
        };
        this._lastPosition = {
            x: 0,
            y: 0,
            _at: Date.now()
        };
        this.speed = {
            x: 0,
            y: 0
        }
        this.speedInterval = 100;
        // reassert the mouse speed frequently
        setInterval(() => this.setSpeed(), this.speedInterval);
    }

    setSpeed() {
        let {
            x: x1,
            y: y1,
            _at: t1
        } = this.position;
        let {
            x: x0,
            y: y0,
            _at: t0
        } = this._lastPosition;

        let speed = {
            x: 0,
            y: 0
        }
        if ((t1 != t0) && (t1 - t0 < 2* this.speedInterval) && (Date.now() - t1 < this.speedInterval)) {
            speed = {
                x: (x1 - x0) / (t1 - t0) * this.speedInterval,
                y: (y1 - y0) / (t1 - t0) * this.speedInterval
            }
        }

        this.speed = speed;
        this._lastPosition = this.position;
    }
}
