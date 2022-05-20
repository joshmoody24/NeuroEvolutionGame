import Genome from "../genetics/Genome.mjs";
import Animal from "./Animal.mjs";
import NodeGene from '../genetics/NodeGene.mjs';
import NodeType from '../genetics/NodeType.mjs';
import Activations from "../neural/Activations.mjs";
import ConnectionGene from '../genetics/ConnectionGene.mjs';
import Vec2 from "../geometry/Vec2.mjs";

export default class Amoeba extends Animal {
	constructor(position, genome, manager) {

		super(position, genome);

		const amoebaActionMap = {
			"move_forward": (val, delta) => {
				const x = Math.cos(this.rotation) * val * this.genome.traitGenes.moveSpeed * delta;
				const y = Math.sin(this.rotation) * val * this.genome.traitGenes.moveSpeed * delta;
				this.move(new Vec2(x,y));
			},
			"rotate": (val, delta) => {
				this.rotate(val * delta * this.genome.traitGenes.rotateSpeed);
			},
		}

		this.senses = genome.nodeGenes.filter(ng => ng.nodeType == NodeType.INPUT).map(ng => ng.name);
		this.actions = genome.nodeGenes.filter(ng => ng.nodeType == NodeType.OUTPUT).map(ng => ng.name);
		this.actionMap = amoebaActionMap;
		this.manager = manager;
		this.maxEnergy = this.genome.traitGenes.maxEnergy;
		this.energy = this.genome.traitGenes.startingEnergy;
	}

	static InitialGenome(manager){
		const senseNames = ["random", "energy", "food_distance", "up_pressed", "left_pressed", "right_pressed"];
		const amoebaSenses = senseNames.map(sense => new NodeGene(manager.nextInnovationNumber(), NodeType.INPUT, "Identity", sense, 0));

		const actionNames = [
			{name: "move_forward", activation: "Clamp"},
			{name: "rotate", activation: "Identity"},
		]
		const amoebaActions = actionNames.map(action => new NodeGene(manager.nextInnovationNumber(), NodeType.OUTPUT, action.activation, action.name, 0));


		const upNodeId = amoebaSenses.find(n => n.name === "up_pressed").innovationNumber;
		const leftNodeId = amoebaSenses.find(n => n.name === "left_pressed").innovationNumber;
		const rightNodeId = amoebaSenses.find(n => n.name === "right_pressed").innovationNumber;

		const moveNodeId = amoebaActions.find(n => n.name === "move_forward").innovationNumber;
		const rotateNodeId = amoebaActions.find(n => n.name === "rotate").innovationNumber;

		const amoebaConnections = [
			// temp
			new ConnectionGene(manager.nextInnovationNumber(), upNodeId, moveNodeId, 1),
			new ConnectionGene(manager.nextInnovationNumber(), leftNodeId, rotateNodeId, -1),
			new ConnectionGene(manager.nextInnovationNumber(), rightNodeId, rotateNodeId, 1),

		];

		const amoebaTraits = {
			color: 0x33ffcc,
			radius: 10,
			moveSpeed: 2,
			rotateSpeed: .2,
			maxEnergy: 3,
			startingEnergy: 1,
			moveCost: .001,
			rotateCost: 0.0005,
			restingCost: 0.001,
		};

		const amoebaGenome = new Genome(amoebaSenses, amoebaActions, amoebaConnections, amoebaTraits);
		return amoebaGenome;
	}

	update(delta){
		// get the inputs
		const inputValues = {};
	
		const foodDistanceNode = this.brain.nodes.find(n => n.name === "food_distance");
		const randomNode = this.brain.nodes.find(n => n.name === "random");
		const energyNode = this.brain.nodes.find(n => n.name === "energy");
		const upNode = this.brain.nodes.find(n => n.name === "up_pressed");
		const leftNode = this.brain.nodes.find(n => n.name === "left_pressed");
		const rightNode = this.brain.nodes.find(n => n.name === "right_pressed");

		foodDistanceNode.value = 0;
		randomNode.value = Math.random();
		energyNode.value = this.energy / this.maxEnergy;
		upNode.value = this.manager.getKey("ArrowUp") ? 1 : 0;
		leftNode.value = this.manager.getKey("ArrowLeft") ? 1 : 0;
		rightNode.value = this.manager.getKey("ArrowRight") ? 1 : 0;

		const nnResults = this.brain.evaluate();

		Object.keys(this.actionMap).forEach(action => {
			const outputValue = nnResults[this.brain.nodes.find(n => n.name === action).id];
			this.actionMap[action](outputValue, delta);
		});
		

		this.spendEnergy(this.genome.traitGenes.restingCost * delta);
	}

	move(vec){
		if(this.energy <= 0) return;
		this.spendEnergy(vec.magnitude() * this.genome.traitGenes.moveCost);
		this.x += vec.x;
		this.y += vec.y;
	
		
		// collision with borders
		if(this.x < 0 || this.x > this.manager.app.width){
			this.x = Math.min(Math.max(this.x, 0), this.manager.app.width);
		}
		if(this.y < 0 || this.y > this.manager.app.height){
			this.y = Math.min(Math.max(this.y, 0), this.manager.app.height);
		}
	}

	rotate(amount){
		this.rotation += amount;
		this.spendEnergy(Math.abs(amount) * this.genome.traitGenes.rotateCost);
	}

	spendEnergy(amount){
		this.energy -= amount;
		if(this.energy < 0){
			this.energy = 0;
			this.die();
		}
	}

	gainEnergy(amount){
		this.energy += amount;
		if(this.energy > this.maxEnergy){
			this.energy = this.maxEnergy;
		}
	}

	die(){
		this.parent.removeChild(this);
		this.destroy();
	}

	reproduce(){
		const spawnPos = new Vec2(this.position.x + Math.random(), this.position.y + Math.random());
		this.manager.app.addChild(new Amoeba(spawnPos, this.genome, this.manager));
	}
}
