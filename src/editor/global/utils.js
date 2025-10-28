window._BPEditorUtils ??= {};
var utils = window._BPEditorUtils;

utils._nodeGitHub ??= {};
utils.openNodeSource = async function(node){
	// If Blackprint.Interface
	if(node.node != null && !(node instanceof Blackprint.Node))
		node = node.node;

	let namespace = node.iface.namespace;
	let objPath = namespace.split('/');
	let nodes = Blackprint.nodes;

	let toast = SmallNotif.add("Obtaining path", 'yellow', false);
	let result = false;
	let githubURL;

	try{
		for (var i = 0; i < objPath.length; i++) {
			nodes = nodes[objPath[i]];
			if(nodes == null) throw new Error("Node namespace was not found: "+namespace);
		}

		if(nodes._scopeURL == null)
			throw new Error("Can't view source because the node doesn't seems to be loaded from known URL.");

		if(nodes.isGenerated)
			throw new Error("Can't view source of node that was dynamically generated");

		// For JSDelivr
		if(utils._nodeGitHub[nodes._scopeURL] == null){
			let url = nodes._scopeURL;
			let ghName;
			let packageInfo;

			if(url.includes('@dist/') && url.includes('/gh/'))
				ghName = url.match(/\/\/cdn.jsdelivr.net\/gh\/(.*?)@dist\//)[1];
			else {
				if(!url.includes('/dist/')) throw new Error("'/dist/' was not found on the URL: "+url);

				toast.message = 'Obtaining "package.json"';
				url = url.split('/dist/')[0];

				try {
					packageInfo = await $.getJSON(`${url}/package.json`);
				} catch(e){
					throw new Error("Failed to fetch '/package.json'");
				}

				if(packageInfo.repository == null)
					throw new Error("'repository' field was not found on package.json file");

				ghName = packageInfo.repository.url
					.replace(/\.git$/m, '')
					.replace(/https?:\/\/.*?\//, '')
					.replace(/@/, '');
			}

			// var commitHash = await $.getJSON(`https://api.github.com/repos/${ghName}/commits?per_page=1`);
			utils._nodeGitHub[nodes._scopeURL] = `https://cdn.jsdelivr.net/gh/${ghName}@latest`;

			let sourceAlias = packageInfo?.blackprint?.source;
			if(sourceAlias != null){
				for(let key in sourceAlias){
					if(nodes._scopeURL.includes('/'+key)){
						utils._nodeGitHub[nodes._scopeURL] += '/'+sourceAlias[key];
						break;
					}
				}
			}
			else utils._nodeGitHub[nodes._scopeURL] += '/src';
		}

		githubURL = utils._nodeGitHub[nodes._scopeURL];
		namespace = namespace.replace(/^.*?\//m, '');
		// return githubURL + '/' + namespace + '.js';

		try {
			toast.message = `Obtaining "${namespace}.js"`;
			result = await $.get(githubURL + '/' + namespace + '.js');
		} catch(e){
			console.error(`File can't be loaded: "${githubURL + '/' + namespace + '.js'}"`);
			throw new Error("Source was not found, maybe the settings on package.json was incorrect.");
		}
	} catch(e) {
		SmallNotif.add(e.message || "Something went wrong", 'red');
		console.error(e);
	}

	let list = SmallNotif.list;
	let ii = list.indexOf(toast);

	if(ii !== -1) list.splice(ii, 1);

	return { code: result, githubURL, scopeURL: nodes._scopeURL };
}

utils.exportCurrentFile = function(options = {}, sketch = null){
	sketch ??= CurrentSketch.rootInstance ?? CurrentSketch;
	let opt = Object.assign(options, {environment: false, toRawObject: true});
	let json = Blackprint.Sketch.prototype.exportJSON.call(sketch, opt);

	// Scan all used nodes and obtain the modules path
	let namespaces = new Set();
	for (let i=0; i < sketch.ifaceList.length; i++) {
		namespaces.add(sketch.ifaceList[i].namespace);
	}
	for (let key in sketch.functions) {
		let structure = sketch.functions[key].structure;
		delete structure.environments; // Just double check as we must not export environment data
		for (let namespace in structure.instance) {
			namespaces.add(namespace);
		}
	}

	delete json.environments; // Just double check as we must not export environment data

	let moduleJS = [];
	for (let item of namespaces) {
		let module_ = utils.getDeepProperty(Blackprint.nodes, item.split('/'))?._scopeURL;
		if(module_) moduleJS.push(module_);
	}

	let npmModules = Object.values(blackprintModules);
	for (let i=moduleJS.length-1; i >= 0; i--) {
		let decodedURI = decodeURIComponent(decodeURIComponent(moduleJS[i]));
		let replace = blackprintModules[decodedURI];

		if(replace) moduleJS[i] = replace;
		else {
			if(decodedURI.startsWith('http') && !decodedURI.includes('vscode-resource.vscode-cdn.net')) {
				moduleJS[i] = decodedURI;
			}
			else {
				let hasMatch = null;
				for (let j=0; j < npmModules.length; j++) {
					if(decodedURI.includes(`/${npmModules[j]}/`)) {
						hasMatch = npmModules[j];
						break;
					}
				}
				if(hasMatch) moduleJS[i] = hasMatch + decodedURI.split(hasMatch).pop();
				else moduleJS.splice(i, 1);
			}
		}
	}

	json.moduleJS = Array.from(new Set(moduleJS));
	return json;
}

utils.customExportJSON = function(options = {}){
	return utils.exportCurrentFile(options, this);
}

utils.getDeepProperty = function(obj, path, reduceLen=0){
	for(let i = 0, n = path.length-reduceLen; i < n; i++){
		if((obj = obj[path[i]]) === void 0)
			return;
	}

	return obj;
}

utils.resolvedNpmModule ??= {}
utils.resolveNpmModule = async function(name){
	let temp = utils.resolvedNpmModule[name];
	if(!temp){
		temp = utils.resolvedNpmModule[name] = {};
		temp.wait = new Promise(resolve => {
			temp.resolve = resolve;
		});

		vscode.postMessage({ type: 'resolveNpmPackage', data: { name } })
	}

	if (temp.wait) return await temp.wait;
	return temp;
}

sf.loader.timeout = 7e3;
Blackprint.Environment.loadFromNodeModules = true;
Blackprint.Environment.isVSCode = true;
Blackprint.DepsLoader.NodeModulesResolver = async(name, type) => {
	if(type === 'js') return await import(await utils.resolveNpmModule(name));
	else if(type === 'css') {
		let url = await utils.resolveNpmModule(name);
		if(url) {
			await sf.loader.css([ url ]);
			return true; // mark as resolved
		}
	}
}

function urlResolverBlocked(url, type){
	if(!url.includes('/npm/@melloware/coloris') && !url.includes('/npm/canvas-confetti')){
		console.log(`URL Blocked: ` + url);
	}

	if(type === 'js') return vscodeOutPath + '/assets/empty.js';
	if(type === 'css') return vscodeOutPath + '/assets/empty.css';
	throw new Error("Unknown type: " + type);
}

// The webview is using CSP, and isolated for security
Blackprint.DepsLoader.URLResolver = async(url, type) => {
	if(url.startsWith('http')) return urlResolverBlocked(url, type);
	if(url.startsWith('files')) return urlResolverBlocked(url, type);
	return url;
}