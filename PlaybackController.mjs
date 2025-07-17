// PlaybackController.mjs
// playback controller module for the FlairNode firmware
// copyright 2025 Drew Shipps, J Squared Systems


// this module creates a single instance of the PlaybackController javascript object,
// which handles all video playback state, scheduling, and logic for the render client



// import modules
import eventHub from './EventHub.mjs';
import configManager from './ConfigManager.mjs';
import RenderSocketClient from './RenderSocketClient.mjs';
import idManager from './IdManager.mjs';

import Logger from './Logger.mjs';
const logger = new Logger('PlaybackController');



// variables
const INTERVAL_MS = 1000;  // how often to attempt processPlayback
let lastRunTime = 0;
let isRunning = false;



// Define the PlaybackController class to handle playback logic
class PlaybackController {

	// constructor
	constructor() {
		// setup interval
		this.interval = INTERVAL_MS;
	}


	// initialization function 
	init() {
		// bind event from NetworkModule
		eventHub.on('newNetworkDataProcessed', () => {
			this.processPlayback();
		});

		// start interval
		setInterval(() => {
			const now = Date.now();

			if (!isRunning && now - lastRunTime >= this.interval) {
				this.processPlayback();
			}
		}, this.interval);


		// log initialization
		logger.info(`Initializing Playback Controller...`);
	}


	// core playback handler
	processPlayback() {
		// mark as running
		isRunning = true;
		lastRunTime = Date.now();

		try {


			// check for identify mode/target
			const identifyMode = configManager.getIdentifyMode();
			const identifyTarget = configManager.getIdentifyTarget();

			if (identifyMode == true) {
				if (identifyTarget == true) {
					RenderSocketClient.send('identify_this_node', { 
	    				serial_number: idManager.getSerialNumber(), 
	    			});
				} else {
					RenderSocketClient.send('identify_not_this_node', { 
	    				serial_number: idManager.getSerialNumber(), 
	    			});
				}
			} else {
				RenderSocketClient.send('disable_identify_mode', { 
    			});
			}


		} catch (error) {
			logger.error(`Error in processPlayback: ${error.message}`);
		} finally {
			// mark done
			isRunning = false;
		}
	}
}



// Create an instance of the PlaybackController and initialize it
const playbackController = new PlaybackController();

// Export the playbackController instance for use in other modules
export default playbackController;
