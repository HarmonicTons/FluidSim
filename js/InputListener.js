class InputListener {
    /**
     * @param {DOM} element DOM element to listen to
     */
    constructor(element) {
        this.element = element;
        this.mouseStatus = "up";
        this.mouseSpeed = {x: 0, y: 0};
        this.mousePosition = {x: 0, y: 0};

        // TODO: generalize for multi-touch

        this.element.onmousemove = function() { /**do the thing**/ };
        this.element.onmouseup = function() { /**do the thing**/ };
        this.element.onmousedown = function() { /**do the thing**/ };

    }

    getInputs() {
        // return  current inputs
        // improve: to catch fast inputs (between 2 checks) add an array uncaughtInputs
        // return the content of uncaughtInputs if the current input is empty
    }
}
