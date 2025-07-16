// FlairNode.js
// primary JS app for the Flair Node firmware
// copyright 2025 Drew Shipps, J Squared Systems




// ==================== IMPORT ====================
import Logger from './Logger.mjs';
const logger = new Logger('FlairNode');

import eventHub from './EventHub.mjs';

import idManager from './IdManager.mjs';
import configManager from './ConfigManager.mjs';
import networkModule from './NetworkModule.mjs';
import statusTracker from './StatusTracker.mjs';
import moduleStatusTracker from './ModuleStatusTracker.mjs';
import macrosModule from './MacrosModule.mjs';
import udpManager from './UDPManager.mjs';



// ==================== INITIALIZATION SEQUENCE ====================

// initial logs
logger.info('Flair Node Device Firmware v1.0');
logger.info('Copyright 2025 Drew Shipps, J Squared Systems');
logger.info('System initializing at time ' + new Date());


// init screen connnect first? display "connected to JS backend" or sum?


// initialize config manager and id manager
setTimeout(() => {
	idManager.init();
	configManager.init();
}, 10);


// initialize network module so it can begin listening for messages
setTimeout(() => {
	networkModule.init();
}, 20);


// initialize status trackers
setTimeout(() => {
	statusTracker.init();
	moduleStatusTracker.init();
}, 30);


// initialize macros module
setTimeout(() => {
	macrosModule.init();
}, 70);


// initialize UDP Manager
setTimeout(() => {
	udpManager.init();
}, 80);


// initialization sequence complete!
setTimeout(() => {
	logger.info('Device initialization sequence complete!');
}, 100);


