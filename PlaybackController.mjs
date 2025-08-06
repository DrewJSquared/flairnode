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

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// variables
const INTERVAL_MS = 1000;  // how often to attempt processPlayback

const USE_LOCALHOST = false;  // for development only
const LAPTOP_MODE = (process.platform === 'darwin');

const CONTENT_DOWNLOAD_URL = (USE_LOCALHOST && LAPTOP_MODE)
	? 'http://flairled.test/storage/scene_renders/'
	: 'https://flairled.com/storage/scene_renders/';

const OUTPUT_DIR = path.join(__dirname, 'content');



// Define the PlaybackController class to handle playback logic
class PlaybackController {

	// constructor
	constructor() {
		// setup interval
		this.interval = INTERVAL_MS;
		this.lastRunTime = 0;
		this.isRunning = false;
		this.startTime = Date.now();

		this.didWeRenderThisScene = false;
		this.lastRenderVersion = 0;
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


		// handle incoming sense data
		eventHub.on('receivedUDP', this.handleNewSenseData);


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

				const scenes = configManager.getScenes();
				const notes = configManager.getNotes();
				const content = configManager.getContent();
				const sceneMatch = notes?.match(/^playscene=(\d+)$/);
				const sceneId = sceneMatch ? parseInt(sceneMatch[1], 10) : null;

				const filesToRender = [];

				// if (!this.didWeRenderThisScene) {
				// 	this.downloadSceneElements(scenes, content);
				// }

				// let didWeRenderThisScene = false;

				if (sceneId !== null) {
					const scene = scenes.find(s => s.id === sceneId);
					// console.log('hey so did we render it?' + this.didWeRenderThisScene)

					if (scene) {

						// console.log(`scene.render_version: ${scene.render_version}  |  this.lastRenderVersion: ${this.lastRenderVersion}`);



						try {
							if (!scene || !scene.elements || !Array.isArray(scene.elements)) return;

							// clear everything except this scene
							const domIds = scene.elements.map((element) => {
								return `${scene.id}-${element.layer}-${scene.render_version}`;
							});

							RenderSocketClient.send('clear_videos_except_dom_ids', {
								dom_ids: domIds,
							});

							// assert playback of this scene
							scene.elements.forEach((element) => {
								const contentItem = content.find(c => c.id === element.content_id);
								if (!contentItem) { return };

								const extension = (contentItem.type == 'image') ? 'jpg' : 'mp4';
								
								RenderSocketClient.send('assert_video_is_playing', {
									file: `/content/${scene.id}-${element.layer}-${scene.render_version}.${extension}`,
									dom_id: `${scene.id}-${element.layer}-${scene.render_version}`,
									x: element.x,
									y: element.y,
									width: element.width,
									height: element.height,
									type: contentItem.type,
								});
							});
						} catch (err) {
							logger.error('Failed to assert scene playback:', err);
						}



/*
						if (scene.render_version != this.lastRenderVersion) {
							// this.downloadSceneElements(scenes, content);
							this.lastRenderVersion = scene.render_version;

							// setTimeout(function () {
								console.log('NOW telling chrome to show videos');

								// console.log(scene);
								// console.log(content);

								// clear screen essentially
								RenderSocketClient.send('hide_rendered_video_files', {});

								if (scene.elements?.length > 0) {
									for (const element of scene.elements) {

										// console.log('element');
										// console.log(element);

										const contentItem = content.find(c => c.id === element.content_id);

										// console.log('contentItem');
										// console.log(contentItem);

										if (!contentItem) continue;

										const extension = (contentItem.type == 'image') ? 'jpg' : 'mp4';

										const fileToRenderObject = {
											file: `/content/${scene.id}-${element.layer}-${scene.render_version}.${extension}`,
											x: element.x,
											y: element.y,
											width: element.width,
											height: element.height,
											type: contentItem.type,
										};

										RenderSocketClient.send('render_video_file', fileToRenderObject);

										// console.log('sending render object');
										// console.log(fileToRenderObject);
									}

									this.didWeRenderThisScene = true;
									// console.log('scene is rendered yay')
								}

							// }, 10000);
						}
	*/
					}



				} else {
					// if no scene assigned show zones



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
				}
 


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



	// handleNewSenseData - function to handle the data packet received from the sense
	handleNewSenseData(object) {
		// wrap the processing logic in a try catch in case of errors
		try {
			// skip packets that are not from TYPE 1 devices (i.e. not from Attitude Sense units)
			if (object?.TYPE !== 1) {
				if (configManager.checkLogLevel('detail')) {
					logger.info(`Skipped non-sense UDP packet or invalid TYPE: ${object?.TYPE}`);
				}
				return;
			}

			// validate the packet
			// this didnt work for some reason as of 8-6-25 so i just cut it out and we'll go without validating
			// this.validateSenseDataObject(object);

    		// if detail log level, log that we just got a status packet
			if (configManager.checkLogLevel('detail')) {
    			logger.info(`New packet of TYPE=1 from sense ID: ${object.ID} with data ${object.DATA}`);
    		}

    		// console.log(`New packet from sense ID: ${object.ID} with data ${object.DATA}`);

            // process the data array from the sense's ports (string to array)
            const processedDataArrray = object.DATA.split(',').map(Number);

            // console.log('ok great processed data array is now');
            // console.log(processedDataArrray);

            // iterate over each port and if its a 1 play the scene
            for (var i = 0; i < object.DATA.length; i++) {
            	if (object.DATA[i] == true) {
            		console.log('PLAY A SCENE');
            	}
            }





		} catch (error) {
    		// else log error
            logger.error(`Error processing sense data message: ${error}`);
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
