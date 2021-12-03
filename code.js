'use strict';

class Frame{
	constructor() {
		this.Id = this.getFrameId()
		this.State = FrameStates.disassembled
		this.HTMLElement = this.getHTMLElement()
		this.CarpenterNumber = 0
		this.WasRejected = false
		this.IsControl = false
		
		state.frames.push(this)
	}
	async moveToNextStage() {

		if (timeOver()) {
			return
		}

		if (this.State == FrameStates.disassembled) {
			while (this.IsCarpenterBusy()) {
				await sleep(1000)
			}
		}

		if (this.State == FrameStates.disassembled) {

			await this.moveToCarpenterStage()
			this.moveToNextStage()

		} else if (this.State == FrameStates.assembled) {

			await this.moveToWareHouse()
			this.moveToNextStage()

		} else if (this.State == FrameStates.inWarehouse) {

			await this.moveToPaintingMachine()
			this.moveToNextStage()

		} else if (this.State == FrameStates.painted) {

			await this.moveToPackingMachine()
			if (!this.WasRejected) this.moveToNextStage()

		} else if (this.State == FrameStates.packed) {

			await this.moveToTruck()

		}
	}

	IsCarpenterBusy() {
		if (state.elapsedHours >= config.hoursToSimulate) {
			return true
		}

		let carpenterWatingLine = state.frames.filter(frame => frame.CarpenterNumber == this.CarpenterNumber)
		let isCarpenterBusy = carpenterWatingLine.some(frame => frame.HTMLElement.classList.contains(FrameStates.assembling))
		return isCarpenterBusy
	}

	async moveToTruck() {
		//Moving left
		let distance = stagesPositions.truck.right - stagesPositions.packingMachine.right
		let transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.right = stagesPositions.truck.right + 'px'
		await sleep(transitionDuration)

		//Moving up
		distance = stagesPositions.packingMachine.top - stagesPositions.truck.top
		transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.top = stagesPositions.truck.top + 'px'
		await sleep(transitionDuration)
		this.changeStateTo(FrameStates.inTruck)
		this.HTMLElement.remove()
	}

	async moveToPackingMachine() {
		//Moving down to inspector
		this.changeStateTo(FrameStates.packing)
		let distance = stagesPositions.inspector.top - stagesPositions.paintingMachine.top
		let transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.top = stagesPositions.inspector.top + 'px'
		await sleep(transitionDuration)

		const isFrameRejected = Math.random() > 1 - config.declineFrameProbability
		if (isFrameRejected) {
			rejectedFrameAudio.play()
			this.WasRejected = true
			const duration = 500

			inspectorElement.style.transitionDuration = duration / 2 + 'ms'
			inspectorElement.style.transform = 'rotate(-90deg)'

			sleep(duration / 2).then(() => {
				inspectorElement.style.transform = 'rotate(0deg)'
			})

			this.HTMLElement.style.transitionDuration = duration + 'ms'
			this.HTMLElement.style.top = 655 + 'px'
			this.HTMLElement.style.right = 376 + 'px'
			await sleep(duration)
			this.HTMLElement.remove()

		} else {
			//Moving down
			distance = stagesPositions.packingMachine.top - stagesPositions.inspector.top
			transitionDuration = getTransitionDurationMiliseconds(distance)

			this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
			this.HTMLElement.style.top = stagesPositions.packingMachine.top + 'px'
			await sleep(transitionDuration)

			//Moving left
			distance = stagesPositions.packingMachine.right - stagesPositions.inspector.right
			transitionDuration = getTransitionDurationMiliseconds(distance)

			this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
			this.HTMLElement.style.right = stagesPositions.packingMachine.right + 'px'
			await sleep(transitionDuration)

			//waint packing time
			let packingTime = (1 / 60) * randomIntFromInterval(
				config.frameRequiredTime.minutesInPackMachineRange[0],
				config.frameRequiredTime.minutesInPackMachineRange[1]
			)

			await sleep(packingTime)
			playPackingMachineSound()
			if (!timeOver()) this.changeStateTo(FrameStates.packed)
		}
	}

	async moveToPaintingMachine() {
		//Moving down
		this.changeStateTo(FrameStates.painting)
		let distance = stagesPositions.paintingMachine.top - stagesPositions.warehouse.top
		let transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.top = stagesPositions.paintingMachine.top + 'px'
		await sleep(transitionDuration)

		let paintingTime = (1 / 60) * randomIntFromInterval(
			config.frameRequiredTime.minutesInPaintingMachineRange[0],
			config.frameRequiredTime.minutesInPaintingMachineRange[1]
		)

		await sleep(paintingTime)
		playPaintingMachineSound()
		if(!timeOver()) this.changeStateTo(FrameStates.painted)
	}

	async moveToWareHouse() {
		//Moving left
		let distance = 290 - stagesPositions.carpenterTable.right
		let transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.right = 290 + 'px'
		await sleep(transitionDuration)

		//Moving up
		distance = this.HTMLElement.style.top.replace('px', '') - stagesPositions.carpenterTable.top.first
		transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.top = stagesPositions.carpenterTable.top.first + 'px'
		await sleep(transitionDuration)

		//Moving left
		distance = stagesPositions.warehouse.right - 290
		transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.right = stagesPositions.warehouse.right + 'px'
		await sleep(transitionDuration)

		this.changeStateTo(FrameStates.inWarehouse)
		await sleep(config.frameRequiredTime.hoursInWareHouse * 1000)
	}

	async moveToCarpenterStage() {
		this.changeStateTo(FrameStates.assembling)

		const distance = stagesPositions.carpenterTable.right
		const transitionDuration = getTransitionDurationMiliseconds(distance)

		this.HTMLElement.style.transitionDuration = transitionDuration + 'ms'
		this.HTMLElement.style.right = stagesPositions.carpenterTable.right + 'px'
		await sleep(transitionDuration)

		let waitingTime = randomIntFromInterval(
			config.frameRequiredTime.hoursToAssemblyRange[0],
			config.frameRequiredTime.hoursToAssemblyRange[1]) * 1000

		playHammerSound()
		
		await sleep(waitingTime / 3)
		this.HTMLElement.className = 'obj frame assembling state1'

		await sleep(waitingTime / 3)
		this.HTMLElement.className = 'obj frame assembling state2'

		await sleep(waitingTime / 3)
		if(!timeOver()) this.changeStateTo(FrameStates.assembled)
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
	assembling: 'assembling',
	assembled: 'assembled',
	inWarehouse: 'inWarehouse',
	painting: 'painting',
	painted: 'painted',
	packing: 'packing',
	packed: 'packed',
	inTruck: 'inTruck'
}

const stagesPositions = {
	carpenterTable: {
		right: 150,
		top: {
			first: 75,
			second: 225,
			third: 375,
			fourth: 525,
			fifth: 675
		}
	},
	warehouse: {
		right: 476,
		top: 75
	},
	paintingMachine: {
		right: 476,
		top: 250
	},
	inspector: {
		right: 476,
		top: 415
	},
	packingMachine: {
		right: 670,
		top: 525
	},
	truck: {
		right: 810,
		top: 325
	}
}

const config = {
	hoursToSimulate: 100,

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

	lineSpeed: 200,
	declineFrameProbability: 0.30
}

const state = {
	frames: [],
	elapsedHours: 0,
	simulationStart: false
}

const initialState = {
	frames: [],
	elapsedHours: 0,
	simulationStart: false
}

let updateStatsInterval
let timerInterval

const factoryAudio = new Audio('assets/sounds/factory.mp3')
const factory2Audio = new Audio('assets/sounds/factory2.mp3')
const rejectedFrameAudio = new Audio('assets/sounds/EsoTaMalo1.m4a')
const sprayAudio = new Audio('assets/sounds/spray.mp3')
const hammerAudio = new Audio('assets/sounds/hammer.mp3')
const packingMachineAudio = new Audio('assets/sounds/packMachine.mp3')
const truckAudio = new Audio('assets/sounds/truck.mp3')

//Grafic element
const factoryContainerElement = document.querySelector('.factory-container');
const inspectorElement = document.querySelector('.inspector');
const truckElement = document.querySelector('.truck');

//Stats spans
const elapsedHoursSpan = document.getElementById('elapsedHoursSpan');

const framesInWaitingLineSpan = document.getElementById('framesInWaitingLineSpan');
const framesInWarehousepanSpan = document.getElementById('framesInWarehousepan');
const framesInPaintingMachineSpan = document.getElementById('framesInPaintingMachine');
const rejectedFramesSpan = document.getElementById('rejectedFramesSpan');
const framesInPackingMachineSpam = document.getElementById('framesInPackingMachine');
const framesInTruckSpan = document.getElementById('framesInTruckSpan');

const startButton = document.getElementById('startButton');

//Inputs
const hoursToSimulateInput = document.getElementById('hoursToSimulateInput');
const elapseHoursBetweenGroupsInput = document.getElementById('elapseHoursBetweenGroupsInput');
const requiredHoursInWareHouseInput = document.getElementById('requiredHoursInWareHouseInput');
const lineSpeedInput = document.getElementById('lineSpeedInput');
const declineFrameProbabilityInput = document.getElementById('declineFrameProbabilityInput');

main()

function main() {
	addListenersToInputs()
	showInitialConfigValues()
}

function handleStartClick() {
	//Iniciar llegada de marcos cada 5 horas en promedio */
		//Seleccionar el carpintero aleatoreamente */
		//Poner el marco en su lista de espera */
	//Cuando un marco termine una etapa que pase a la siguiente hasta llegar al camion */
		//Iniciar proceso de la etapa */
		//cambiar estado del marcos */
		//Moverlo a la siguiente etapa */
	if (!state.simulationStart) {
		startSimulation()
	} else {
		location.reload()
	}
	
}

function startSimulation() {
	state.simulationStart = true;
	startButton.innerHTML = "Detener simulacion";
	initIncomingFramesLoop()
	initStatsUpdateInterval()
	playFactoryAmbientSound()
	startTimerInteval()
}

function updateStats() {
	elapsedHoursSpan.innerHTML = state.elapsedHours
	framesInWaitingLineSpan.innerHTML = state.frames.filter(frame => frame.State == FrameStates.disassembled).length
	framesInWarehousepanSpan.innerHTML = state.frames.filter(frame => frame.State == FrameStates.inWarehouse).length
	framesInPaintingMachineSpan.innerHTML = state.frames.filter(frame => frame.State == FrameStates.painting).length
	rejectedFramesSpan.innerHTML = state.frames.filter(frame => frame.WasRejected).length
	framesInPackingMachineSpam.innerHTML = state.frames.filter(frame => frame.State == FrameStates.packing && !frame.WasRejected).length
	framesInTruckSpan.innerHTML = state.frames.filter(frame => frame.State == FrameStates.inTruck || frame.State == FrameStates.packed).length
}

function addListenersToInputs() {
	hoursToSimulateInput.addEventListener('change', () => {
		config.hoursToSimulate = hoursToSimulateInput.value
	})
	elapseHoursBetweenGroupsInput.addEventListener('change', () => {
		config.elapseHoursBetweenGroups = elapseHoursBetweenGroupsInput.value
	})
	requiredHoursInWareHouseInput.addEventListener('change', () => {
		config.frameRequiredTime.hoursInWareHouse = requiredHoursInWareHouseInput.value
	})
	lineSpeedInput.addEventListener('change', () => {
		config.lineSpeed = lineSpeedInput.value
	})
	declineFrameProbabilityInput.addEventListener('change', () => {
		config.declineFrameProbability = declineFrameProbabilityInput.value / 100
	})
}

function showInitialConfigValues() {
	hoursToSimulateInput.value = config.hoursToSimulate
	elapseHoursBetweenGroupsInput.value = config.elapseHoursBetweenGroups
	requiredHoursInWareHouseInput.value = config.frameRequiredTime.hoursInWareHouse
	lineSpeedInput.value = config.lineSpeed
	declineFrameProbabilityInput.value = config.declineFrameProbability * 100
}

async function initIncomingFramesLoop() {

	let randomElapsedHours = getRandomElapseHoursBetweenGroups()

	while (state.elapsedHours + randomElapsedHours <= config.hoursToSimulate && state.simulationStart) {

		addRandomNewFramesToWaitingLine()

		await sleep(randomElapsedHours * 1000)

		updateStats()
		randomElapsedHours = getRandomElapseHoursBetweenGroups()
	}
	state.elapsedHours = config.hoursToSimulate
	clearInterval(timerInterval)
	updateStats()
}

function startTimerInteval() {
	timerInterval = setInterval(() => {
		state.elapsedHours++
	}, 1000);
}

function getRandomElapseHoursBetweenGroups() {
	return randomIntFromInterval(
		config.elapseHoursBetweenGroups - config.maxDeflectionOnHoursBetweenGroups,
		config.elapseHoursBetweenGroups + config.maxDeflectionOnHoursBetweenGroups)
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

	const thereIsAnControlFrameAlready = state.frames.some(frame => frame.IsControl)
	if (!thereIsAnControlFrameAlready) {
		frame.IsControl = true
	}

	frame.HTMLElement.style.top = frame.CarpenterNumber > 1 ? (150 * (frame.CarpenterNumber - 1) + 75) + 'px' : 75 + 'px'
	frame.HTMLElement.style.right = 0

	factoryContainerElement.appendChild(frame.HTMLElement)

	sleep(100).then(() => {
		
		frame.moveToNextStage()
	})
}

function timeOver() {
	if (state.elapsedHours >= config.hoursToSimulate) {
		return true
	}
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


function initStatsUpdateInterval() {
	updateStatsInterval = setInterval(() => {
		updateStats()
		checkTruckForDeparture()
	}, 500);
}

function checkTruckForDeparture() {
	let framesIntruck = state.frames.filter(frame => frame.State == FrameStates.inTruck).length
	let rejectedFrames = state.frames.filter(frame => frame.WasRejected).length
	let packedFrames = state.frames.filter(frame => frame.State == FrameStates.packed).length

	if (((framesIntruck == state.frames.length - rejectedFrames) && state.frames.length > 0) || timeOver() && packedFrames == 0) {
		endSimulation()
	}
}

function endSimulation() {
	dispatchTruck()
	factory2Audio.pause()
	clearInterval(updateStatsInterval)
	startButton.innerHTML = 'Reiniciar simulacion'
	state.simulationStart = false
}

async function dispatchTruck() {
	truckAudio.play()
	truckElement.style.top = -372 + 'px'
	for (let i = 1; i <= 9; i++) {
		await sleep(1000)
		truckAudio.volume = 1 - (i/10)
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

async function playFactoryAmbientSound() {
	factory2Audio.volume = 0.1
	factory2Audio.play()
	factory2Audio.loop = true
}

function playHammerSound() {
	hammerAudio.volume = 0.1
	hammerAudio.play();
}

function playPackingMachineSound() {
	packingMachineAudio.volume = 1
	packingMachineAudio.play();
}

function playPaintingMachineSound() {
	sprayAudio.volume = 0.3
	sprayAudio.play()
}