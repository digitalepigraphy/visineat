//Setup
function SystemInfoApp(app)
{
	
	this.app=app;
	this.vn=app.getMainApp();
	this.wm=app.getWindowManager();
	var w=this.wm.createWindow(0,0,320,230);
	this.win=w;
	w.setTitle('System Info');
	if(typeof this.wm.apps[this.app.src].left !== 'undefined')
	{
		w.setPosition(this.wm.apps[this.app.src].left,this.wm.apps[this.app.src].top);
	}
	else w.center();
	w.setScrollerY(true);
	w.applyBlackTransparentPreset();
	this.div=w.getContentDiv();
	
	this.closed=false;
	
	this.animate();

	var self=this;
	w.onClose=function()
	{
		self.wm.apps[self.app.src].left=self.win.left;
		self.wm.apps[self.app.src].top=self.win.top;
		self.closed=true;
		return true;
	}
}

//draw
SystemInfoApp.prototype.animate=function()
{	
	if(this.closed)return;
	
	var s='<table><tr><td><b>FPS: </b></td><td>'+this.vn.canvas.camera.getFPSSmooth().toFixed(2)+'</td></tr>';
	s+='<tr><td><b>Canvas size: </b></td><td>'+this.vn.canvas.camera.getWidth()+'px x '+this.vn.canvas.camera.getHeight()+'px </td></tr>';
	s+='<tr><td><b>Vertices: </b></td><td>'+this.vn.canvas.getNumOfVertices()+' </td></tr>';
	s+='<tr><td><b>Elements: </b></td><td>'+this.vn.canvas.getNumOfElements()+' </td></tr>';
	s+='<tr><td><b>Objects: </b></td><td>'+this.vn.canvas.getNumOfObjects()+' </td></tr>';
	s+='<tr><td><b>Max&nbsp;Texture&nbsp;Size: </b></td><td>'+this.vn.canvas.gl.getParameter(this.vn.canvas.gl.MAX_TEXTURE_SIZE)+'px </td></tr>';
	s+='<tr><td><b>Real/CSS pixels: </b></td><td>'+this.vn.canvas.camera.realToCSSPixels+' </td></tr>';
	s+='<tr><td><b>Container size: </b></td><td>'+this.vn.canvas.camera.div_container.clientWidth+'px x '+this.vn.canvas.camera.div_container.clientHeight+'px </td></tr>';
	s+='<tr><td valign="top"><b>Navigator: </b></td><td>'+navigator.userAgent+' </td></tr>';
	s+='</table>';
	this.div.innerHTML=s;
	self=this;
	window.setTimeout(function(){self.animate();}, 250);
}