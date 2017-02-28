const simulationSize = {
    width: 50,
    height: 50
}
const displaySize = {
    width: 500,
    height: 500
}
const fluidName = 'air';


let fluid = fluids.find(f => f.name === fluidName);

let canvas = document.getElementById("canvas");
canvas.width = displaySize.width;
canvas.height = displaySize.height;

let simulation = new Simulation(simulationSize.width, simulationSize.height, fluid, canvas);

simulation.start();

simulation.newArea(0, 0, simulationSize.width, simulationSize.height);
