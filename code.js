class Frame{
	constructor() {
		this.Id = this.getFrameId()
		this.State = FrameStates.disassembled
		this.HTMLElement = this.getHTMLElement()
		this.CarpenterNumber = 0
		
		state.frames.push(this)
	}
	async moveToNextStage() {
		if (this.State == FrameStates.disassembled) {
			await this.moveToCarpenterStage()
			
		} else if (this.State == FrameStates.assembled) {

		} else if (this.State == FrameStates.painted) {

		} else if (this.State == FrameStates.packed) {

		}
	}

	async moveToCarpenterStage() {
		let distance = stagesPositions.carpenterTable.right
		const transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.right = stagesPositions.carpenterTable.right + 'px'
		await sleep(transitionDuration)

		let waitingTime = randomIntFromInterval(
			config.frameRequiredTime.hoursToAssemblyRange[0],
			config.frameRequiredTime.hoursToAssemblyRange[1]) * 1000

		await sleep(waitingTime / 3)
		this.HTMLElement.className = 'obj frame state1'

		await sleep(waitingTime / 3)
		this.HTMLElement.className = 'obj frame state2'

		await sleep(waitingTime / 3)
		this.changeStateTo(FrameStates.assembled)
	}

	changeStateTo(frameState) {
		this.State = frameState
		this.HTMLElement.className = 'obj frame ' + frameState
	}

	getFrameId() {
		return 'frame' + state.frames.length
	}

	getHTMLElement() {
		let HTMLElement = document.createElement('div')
		HTMLElement.className = 'obj frame ' + this.State
		HTMLElement.id = this.Id
		return HTMLElement
	}
}

const FrameStates = {
	disassembled: 'disassembled',
	assembled: 'assembled',
	painted: 'painted',
	packed: 'packed'
}

const stagesPositions = {
	carpenterTable: {
		right: 150
	},
	warehouse: {
		
	}
}

const config = {
	hoursToSimulate: 1,

	isFramesGroupRandomRange: false,
	minFramesPerGroup: 4,
	maxFramesPerGroup: 6,

	elapseHoursBetweenGroups: 5,
	maxDeflectionOnHoursBetweenGroups: 1,

	frameRequiredTime : {
		hoursToAssemblyRange: [2, 6],
		hoursInWareHouse: 24,
		minutesInPaintingMachineRange: [10, 20],
		minutesInPackMachineRange: [10, 15]
	},

	lineSpeed: 50
}

const state = {
	frames: [],
	elapsedHours: 0
}

const factoryContainerElement = document.querySelector('.factory-container');

main()

function main() {
	//Iniciar llegada de marcos cada 5 horas en promedio
		//Seleccionar el carpintero aleatoreamente
		//Poner el marco en su lista de espera
	//Cuando un marco termine una etapa que pase a la siguiente hasta llegar al camion
		//Iniciar proceso de la etapa
		//cambiar estado del marcos
		//Moverlo a la siguiente etapa
	
	initIncomingFramesInterval()

}

async function initIncomingFramesInterval() {
	while (state.elapsedHours < config.hoursToSimulate) {

		addRandomNewFramesToWaitingLine()

		const elapsedHours = randomIntFromInterval(
			config.elapseHoursBetweenGroups - config.maxDeflectionOnHoursBetweenGroups,
			config.elapseHoursBetweenGroups + config.maxDeflectionOnHoursBetweenGroups)
		
		await sleep(elapsedHours * 1000)
		state.elapsedHours += elapsedHours
	}
}

function addRandomNewFramesToWaitingLine() {
	let framesAmount = getRandomFrameGroupCount()

	for (let i = 0; i < framesAmount; i++) {
		addNewFrameToWaitingLine()
	}
}

const getTransitionDurationMiliseconds = (distance) => (distance / config.lineSpeed) * 1000


function addNewFrameToWaitingLine() {
	let frame = new Frame()
	frame.CarpenterNumber = randomIntFromInterval(1, 5)

	frame.HTMLElement.style.top = frame.CarpenterNumber > 1 ? (150 * (frame.CarpenterNumber - 1) + 75) + 'px' : 75 + 'px'
	frame.HTMLElement.style.right = 0

	factoryContainerElement.appendChild(frame.HTMLElement)
}

function getRandomFrameGroupCount() {
	let framesAmount

	if (config.isFramesGroupRandomRange) {
		framesAmount = randomIntFromInterval(config.minFramesPerGroup, config.maxFramesPerGroup)

	} else {
		let isMaxAmount = Math.random() < 0.40

		framesAmount = isMaxAmount
			? config.maxFramesPerGroup
			: config.minFramesPerGroup

	}
	return framesAmount
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}