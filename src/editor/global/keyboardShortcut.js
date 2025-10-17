// Use sf.model so we can use the hot reload feature
sf.model('keyboard-shortcut', My => {
	My.workspacePanel = sf.model("project-panel-workspace"); // panel on the left
	My.projectList = sf.model("project-list"); // project tabs on top

	setTimeout(init, 1);
	function init(){
		if(My.initialized) return;
		My.initialized = true;

		$(window).on('keydown', My.workspaceShortcuts);
	}

	My.workspaceShortcuts = function(ev){
		if(ev.altKey && /^[0-9]$/m.test(ev.key))
			1;//My.switchInstanceTab(+ev.key);
		else if(ev.altKey && ev.key === 'w')
			1;//My.projectList.closeTab(My.projectList.getActiveTab());
		else return;

		ev.preventDefault();
	}

});