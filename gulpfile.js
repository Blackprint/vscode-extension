process.stdout.write("Loading scarletsframe-compiler\r");

let Gulp = require('gulp');
let os = require('os');
let fs = require('fs');
let notifier = os.platform() === 'win32'
	? new require('node-notifier/notifiers/balloon')() // For Windows
	: require('node-notifier'); // For other OS

let compileTargets = {};
compileTargets.default = {
    versioning: 'out/index.html',
    stripURL: 'out/',

    js:{
        file:'out/assets/myjs.min.js',

        // Will be processed from the top to bottom
        combine:[
            // Combine files from all directory recursively
            'src/editor/**/*.js',
        ],
    },
    scss:{
        file:'out/assets/mycss.min.css',
        combine:'src/editor/**/*.scss',
    },
    sf:{
        file:'out/assets/custom.sf',
        combine:'src/editor/**/*.sf',
        prefix:'BPExtensionEditor',
    },
};

var SFC = require("scarletsframe-compiler")({
	// Start the server
	browserSync:{
		// proxy:'http://myjs.sandbox',
		port: process.env.PORT || 6789, // Accessible-> http://localhost:6789
		ghostMode: false, // Use synchronization between browser?
		ui: false,
		open: false,
		// https: true,

		// Standalone server with BrowserSync
		server:{
			baseDir:'out/',
			index:'index.html',
			middleware(req, res, next){
				// if(true) return next(); // Comment this to allow CORS for all domain
				// Always disable this if you don't need it
				// it can dangerous if you leave this active

				res.setHeader("Access-Control-Allow-Methods", "GET");
				res.setHeader('Access-Control-Allow-Origin', '*');
				next();
			},
		    routes: {
		        "/dist": "dist"
		    }
		}
	},

	// Recompile some files before being watched on startup
	// You may want to check if the git history was changed
	// And then set this to true with JavaScript
	startupCompile: !false,

	// Choose your default editor
	// You must register "subl" or "code" to the PATH environment variable.
	// https://www.sublimetext.com/docs/command_line.html
	//
	// https://code.visualstudio.com/docs/out/command-line#_code-is-not-recognized-as-an-internal-or-external-command
	editor: 'vsc', // only 'sublime' or 'vsc' that currently supported

	// Optional if you want to remove source map on production mode
	includeSourceMap: process.env.production || true,
	hotReload:{
		html: true,
		sf: true,
		js: true,
		scss: true
	},

	onCompiled(which){
		notifier.notify({
			title: 'Gulp Compilation',
			message: which+' was finished!',
			timeout: 4, time: 4,
		});
	},

	onInit(){
        
	},
	beforeInit(){
        
	},

	// ===== Modify me, add slash as last character if it's directory =====
	path: compileTargets
}, Gulp);