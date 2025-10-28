$(function () {
	window.BPEditor = {
		Dialog: Swal.fire.bind(Swal),
	};

	$(sf.Window).on('resize', ev => {
		let height = ev.target.innerHeight;
		let width = ev.target.innerWidth;

		for (var i = 0; i < SketchList.length; i++) {
			if (SketchList[i] == null) continue;

			let container = SketchList[i].scope('container');
			if (container.origSize.h < height)
				container.origSize.h = container.size.h = height;

			if (container.origSize.w < width)
				container.origSize.w = container.size.w = width;
		}
	});

	// Always use the newest module
	Blackprint.onModuleConflict = async map => {
		// ToDo: show popup to select if user is prefer old version or the newest version
		return Object.entries(map).forEach(v => v.useOld = false);
	};

	Blackprint.on('menu.create.node', function (ev) {
		let { list, isSuggestion } = ev;
		if (!isSuggestion) return;

		delete list.Example; // Delete example nodes from suggestion
	});

	// Load available blackprint skeletons
	for (let i=0; i < blackprintSkeletons.length; i++) {
		Blackprint.Tools.importSkeleton(blackprintSkeletons[i]);
	}

	// Load available modules on the workspace
	;(()=>{
		let loader = sf.loader.mjs;
		sf.loader.mjs = function(url, options){
			return loader(url, options).catch(console.error);
		}

		sf.loader.mjs(Object.keys(blackprintModules));
	})();
});

window.Events = sf.events;
$(function () {
	if (window.SmallNotif == null)
		alert("This editor doesn't seems supported for your browser, please try using Chromium based browser instead");

	// Register event listener
	Events.register('DBReady', false);
});

window.addEventListener('message', event => {
	let action = event.data;
	if (action.type === 'loadSketch') {
		!(async()=>{
			await sf.loader.task;
			CurrentSketch.clearNodes();

			setTimeout(async () => {
				views.goto('/sketch/1');
			}, 100);

			setTimeout(async () => {
				await CurrentSketch.importJSON(action.data.json);
			}, 500);

			setTimeout(() => {
				let list = [
					'cable.created',
					'cable.connect',
					'cable.disconnect',
					'cable.create.branch',
					'cable.deleted',
					'cable.dropped',
					'node.created',
					'node.delete',
					'node.move',
					'node.id.changed',
					'port.default.changed',
					'_port.split',
					'_port.unsplit',
					'_port.resync.allow',
					'_port.resync.disallow',
					'variable.new',
					'variable.renamed',
					'variable.deleted',
					'function.port.renamed',
					'function.port.deleted',
					'editor.data.changed',
				];
				SketchList[0].on(list.join(' '), this._save);
			}, 1000);

			let debounce_ = 0;
			this._save = function () {
				clearTimeout(debounce_);
				debounce_ = setTimeout(() => {
					vscode.postMessage({ type: 'unsavedChanges', data: { text: JSON.stringify(utils.exportCurrentFile()) } });
				}, 500);
			}
		})();
	}
	else if (action.type === 'notify') {
		SmallNotif.add(action.data.message, action.data.color);
	}
	else if (action.type === 'resolvedNpmPackage') {
		let data = action.data;
		utils.resolvedNpmModule[data.name].resolve?.(data.url);
		utils.resolvedNpmModule[data.name] = data.url
	}
	else if (action.type === 'runBlackprintCLICallback') {
		if(action.data.success){
			SmallNotif.add("Executed on terminal", 'green');

			if(action.data.port){
				let model = sf.model('modal-remote-sketch-connect');
				model.url = `ws://localhost:${action.data.port}`;
				Modal.goto('/remote-sketch-connect');
			}
		}
		else {
			SmallNotif.add(action.data.error, 'red');
		}
	}
	else if (action.type === 'runSocketRelayCallback') {
		if(action.data.success){
			SmallNotif.add("Relay server started on terminal", 'green');

			if(action.data.port){
				let model = sf.model('modal-remote-sketch-connect');
				model.url = `ws://localhost:${action.data.port}`;
				Modal.goto('/remote-sketch-connect');
			}
		}
		else {
			SmallNotif.add(action.data.error, 'red');
		}
	}
});