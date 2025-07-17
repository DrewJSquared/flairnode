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



// Define the PlaybackController class to handle playback logic
class PlaybackController {

	// constructor
	constructor() {
		// setup interval
		this.interval = INTERVAL_MS;
		this.lastRunTime = 0;
		this.isRunning = false;
		this.startTime = Date.now();
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

			if (!this.isRunning && now - this.lastRunTime >= this.interval) {
				this.processPlayback();
			}
		}, this.interval);


		// log initialization
		logger.info(`Initializing Playback Controller...`);
	}


	// core playback handler
	processPlayback() {
		// mark as running
		this.isRunning = true;
		this.lastRunTime = Date.now();

		try {


			// check for identify mode
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
				// get wall type info
				const wallType = configManager.getWallType();

				if (!wallType) {
					logger.warn(`No wall type found, unable to show wall type zones.`);

					// Fallback: show serial number if nothing else is active
					RenderSocketClient.send('show_serial_number', { 
	    				serial_number: idManager.getSerialNumber(), 
	    			});

					return;
				}

				// get zones array from wallType.canvas.zones or fallback
				const zones = wallType.canvas?.zones ?? [];

				// send layout to frontend
				// DEFAULT VERSION NO TIME DATA
				// RenderSocketClient.send('show_wall_type_zones_layout', { zones });

				const currentTime = new Date().toLocaleTimeString();
				const uptime = this.getUptimeString();

				const enhancedZones = zones.map(zone => ({
					...zone,
					time_of_day: currentTime,
					uptime: uptime,
				}));

				RenderSocketClient.send('show_wall_type_zones_layout_with_time', { zones: enhancedZones });


				// TODO: Handle Scene playback logic when role is assigned
			}

			



			// // check for identify mode/target
			// const identifyMode = configManager.getIdentifyMode();
			// const identifyTarget = configManager.getIdentifyTarget();

			// if (identifyMode == true) {
			// 	if (identifyTarget == true) {
			// 		RenderSocketClient.send('identify_this_node', { 
	    	// 			serial_number: idManager.getSerialNumber(), 
	    	// 		});
			// 	} else {
			// 		RenderSocketClient.send('identify_not_this_node', { 
	    	// 			serial_number: idManager.getSerialNumber(), 
	    	// 		});
			// 	}
			// } else {
			// 	RenderSocketClient.send('disable_identify_mode', { 
    		// 	});
			// }


		} catch (error) {
			logger.error(`Error in processPlayback: ${error.message}`);
		} finally {
			// mark done
			this.isRunning = false;
		}
	}


	getUptimeString() {
		const seconds = Math.floor((Date.now() - this.startTime) / 1000);
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return `${h}h ${m}m ${s}s`;
	}
}



// Create an instance of the PlaybackController and initialize it
const playbackController = new PlaybackController();

// Export the playbackController instance for use in other modules
export default playbackController;
