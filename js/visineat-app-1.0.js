/* V1.0
 * Author(s): Angelos Barmpoutis
 * 
 * Copyright (c) 2016, University of Florida Research Foundation, Inc. 
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain this copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce this
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var c;

function VNMainApp(div_name3d, div_name,file_info)
{
	this.in_iframe=this.inIframe();
	
	if(!this.inIframe())
	{
		var d=document.getElementById(div_name3d);
		d.style.right='50px';
		d.style.bottom='40px';
		
		d=document.getElementById('main_header'); 
		d.style.display='block';
		d=document.getElementById('main_footer'); 
		d.style.display='block';
		
	}
	
	this.one_finger_mode=1;//0: translate, 1: rotate, 2:zoom, 3:relight
	this.use_accelerometer=true;
	
	this.file_info=file_info;
	
	this.file_info.propagate_flags="";
	if(this.file_info.collection) this.file_info.propagate_flags+="&collection="+this.file_info.collection;
	if(this.file_info.full) this.file_info.propagate_flags+="&full="+this.file_info.full;
	
	this.wm=new WindowManager(div_name);
	this.wm.setMainApp(this);
	this.wm.default_border_color='rgb(180,180,180)';
	
	this.console=this.wm.createConsole(0,0,1000,300);
	c=this.console;
	this.console.getWindow().hide();
	this.console.getWindow().center();
	this.console.getWindow().setCanMinimize(true);
	this.console.getWindow().onClose=function(win){win.hide();return false;};
	this.console.visineatCommand=function(name,vars)
	{
		self.console.setPromptEnabled(false);
		self.console.postCommand((('https:' == document.location.protocol) ? 'https:' : 'http:')+"://digitalepigraphy.github.io/visineat/do/"+name+".php",vars,function(xml)
		{
			if(xml==null) self.console.error(name+" failed");
			else if(xml.getElementsByTagName("success")[0].innerHTML!="true") self.console.error(name+" failed. "+xml.getElementsByTagName("comments")[0].innerHTML);
			else self.console.println("done. "+xml.getElementsByTagName("comments")[0].innerHTML);
			self.console.setPromptEnabled(true);
		});
	};
	
	this.console.onCommandEntered=function(com)
	{
		if(com=='')
		{
			return true;
		}
		else if(com=='oid')
		{
			self.console.println(self.file_info.id);
			return true;
		}
		else if(com=='collection')
		{
			if(self.file_info.collection)self.console.println(self.file_info.collection);
			else self.console.println('undefined');
			return true;
		}		
		else if(com=='clear' || com=='cls')
		{
			self.console.clear();
			return true;
		}
		else if(com=='reload')
		{
			if(self.file_info.id)
				document.location=(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//digitalepigraphy.github.io/visineat/view?o='+self.file_info.id+self.file_info.propagate_flags;
			else self.console.error('File ID is missing.');
			
			return true;
		}
		else if(com=='countalldirs')
		{
			self.console.visineatCommand("countalldirs");
			return true;
		}
		else if(com=='countpubdirs')
		{
			self.console.visineatCommand("countpubdirs");
			return true;
		}
		else if(com=='mkcollection')
		{
			self.console.visineatCommand("mkcollection");
			return true;
		}
		
		else if(com=='upload')
		{
			self.openFile();
			return true;
		}
		
		var tokens=com.split(" ");
		if(self.file_info.id && tokens[0]=='setfield' && tokens.length>2)
		{
			self.console.visineatCommand("setfield",[["id",self.file_info.id],["field",tokens[1]],["value",com.substring(com.indexOf(tokens[1])+tokens[1].length+1)]]);
			return true;
		}
		else if(self.file_info.id && tokens[0]=='getfield' && tokens.length>1)
		{
			self.console.visineatCommand("getfield",[["id",self.file_info.id],["field",tokens[1]]]);
			return true;
		}
		else if(self.file_info.id && tokens[0]=='addtocollection')
		{
			if(tokens.length==2)
				self.console.visineatCommand("addtocollection",[["id",self.file_info.id],["collection",tokens[1]]]);
			else self.console.error("Undefined collection");
			return true;
		}
		else if(tokens[0]=='rmfromcollection')
		{
			if(tokens.length>1)
			{
				self.console.visineatCommand("rmfromcollection",[["id",self.file_info.id],["collection",tokens[1]]]);
			}
			else if(self.file_info.collection)
			{
				self.console.visineatCommand("rmfromcollection",[["id",self.file_info.id],["collection",self.file_info.collection]]);
			}
			else self.console.error('Undefined collection.');
			return true;
		}
		else if(self.file_info.id && tokens[0]=='rmdir')
		{
			self.console.visineatCommand("rmdir",[["id",self.file_info.id]]);
			return true;
		}
		else if(tokens[0]=='recoverdir')
		{
			if(tokens.length>1)
			{
				self.console.visineatCommand("recoverdir",[["id",tokens[1]]]);
			}
			else if(self.file_info.id)
			{
				self.console.visineatCommand("recoverdir",[["id",self.file_info.id]]);
			}
			else self.console.error('Undefined object.');
			return true;
		}
		else if(tokens[0]=='pubdir')
		{
			if(tokens.length>1)
			{
				self.console.visineatCommand("pubdir",[["id",tokens[1]]]);
			}
			else if(self.file_info.id)
			{
				self.console.visineatCommand("pubdir",[["id",self.file_info.id]]);
			}
			else self.console.error('Undefined object.');
			return true;
		}
		else if(tokens[0]=='unpubdir')
		{
			if(tokens.length>1)
			{
				self.console.visineatCommand("unpubdir",[["id",tokens[1]]]);
			}
			else if(self.file_info.id)
			{
				self.console.visineatCommand("unpubdir",[["id",self.file_info.id]]);
			}
			else self.console.error('Undefined object.');
			return true;
		}
		else if(tokens[0]=='rmcollection')
		{
			if(tokens.length>1)
			{
				self.console.visineatCommand("rmcollection",[["id",tokens[1]]]);
			}
			else if(self.file_info.collection)
			{
				self.console.visineatCommand("rmcollection",[["id",self.file_info.collection]]);
			}
			else self.console.error('Undefined collection.');
			return true;
		}
		else if(tokens[0]=='recovercollection')
		{
			if(tokens.length>1)
			{
				self.console.visineatCommand("recovercollection",[["id",tokens[1]]]);
			}
			else if(self.file_info.collection)
			{
				self.console.visineatCommand("recovercollection",[["id",self.file_info.collection]]);
			}
			else self.console.error('Undefined collection.');
			return true;
		}
		
		return false;
	};
	
	this.canvas=new WebGLCanvas(document.getElementById(div_name3d));
	this.canvas.setTitle(this.file_info.title);
	this.canvas.setSubTitle(this.file_info.subtitle);
	this.canvas.setTitleOpacity(1);
	this.canvas.createProgressBar();
	this.canvas.renderWhenNecessary();
	
	
	this.drawables=new Array();
	
	var self=this;
	
	this.gui=new GUIManager(this.canvas.getDiv());
	
	this.message_area=this.gui.createNotificationArea();
	//this.addNotification("Under construction!");
	
	this.toolbar_x=this.gui.createRetractableToolbar(50,1);
	this.toolbar_y=this.gui.createRetractableToolbar(50,2);
	
	if(this.inIframe()) this.toolbar_y.setVisible(false);
	if(this.file_info.full) this.toolbar_y.setVisible(true);
	
	var b=new RetractableToolbarButton(this.toolbar_x);
	b.setIcon('https://digitalepigraphy.github.io/visineat/js/img/VNlogo256.png',0);
	//if(this.inIframe()) b.setLink('https://digitalepigraphy.github.io/visineat/view?o='+this.file_info.id);
	//else
		b.setLink('https://digitalepigraphy.github.io/visineat/os');
	
	//b.setEnabled(false);
	
	b.setLabel(['Neat OS']);
	
	this.interaction_menu=new RetractableToolbarButton(this.toolbar_x);
	this.interaction_menu.setLabel('Change interaction mode');
	this.move_button=new RetractableToolbarButton(this.interaction_menu);
	this.move_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/move_icon.png');
	this.move_button.setLabel('Move object');
	//this.move_button.onClick=ui_callback;
	
	this.rotate_button=new RetractableToolbarButton(this.interaction_menu);
	this.rotate_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/rotate_icon.png');
	this.rotate_button.setLabel('Rotate object');
	this.interaction_menu.setSelectedOption(this.rotate_button);
	//this.rotate_button.onClick=ui_callback;
	
	this.zoom_button=new RetractableToolbarButton(this.interaction_menu);
	this.zoom_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/zoom_icon.png');
	this.zoom_button.setLabel('Zoom in or out');
	//this.zoom_button.onClick=ui_callback;
	
	this.relight_button=new RetractableToolbarButton(this.interaction_menu);
	this.relight_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/relight_icon.png');
	this.relight_button.setLabel('Change lighting direction');
	//this.relight_button.onClick=ui_callback;
	this.interaction_menu.onSelect=function(opt)
	{
		if(opt==self.move_button) self.translateWithOneFinger();
		else if(opt==self.rotate_button) self.rotateWithOneFinger();
		else if(opt==self.zoom_button) self.zoomWithOneFinger();
		else if(opt==self.relight_button)
		{
			if(!self.lightswitch_button.isSelected())
			{
				self.lightswitch_button.setSelected(true);
				self.obj1.shader.useLighting(true);
				self.canvas.renderFrame();
			}
			self.relightWithOneFinger();
		}
	};
	
	b=new RetractableToolbarButton(this.toolbar_x);
	var b2=new RetractableToolbarButton(b);
	b2.setIcon('https://digitalepigraphy.github.io/visineat/js/img/preset1_icon.png');
	b2.setLabel('3D visualization with shading');
	
	b2=new RetractableToolbarButton(b);
	b2.setIcon('https://digitalepigraphy.github.io/visineat/js/img/preset2_icon.png');
	b2.setLabel('3D shading with depthmap');
	
	b2=new RetractableToolbarButton(b);
	b2.setIcon('https://digitalepigraphy.github.io/visineat/js/img/preset3_icon.png');
	b2.setLabel('3D depthmap visualization');
	
	b2=new RetractableToolbarButton(b);
	b2.setIcon('https://digitalepigraphy.github.io/visineat/js/img/preset4_icon.png');
	b2.setLabel('3D edgemap visualization');
	
	b2=new RetractableToolbarButton(b);
	b2.setIcon('https://digitalepigraphy.github.io/visineat/js/img/preset5_icon.png');
	b2.setLabel('3D visualization of original images');
	
	b.setSelectedOption(b2);
	b.setLabel('Change visualization mode');
	var mem=b;
	b.onSelect=function(){
		if(mem.getSelectedOptionId()==0) 
		{
			self.obj1.shader.useLighting(true);
			self.lightswitch_button.setSelected(true);
			self.obj1.shader.setMapMode(0);
			self.map_menu.setSelectedOption(self.map1_button);
			self.colormap_menu.setEnabled(false);
			self.obj1.shader.useTexture(false);	
			self.texture_button.setSelected(false);
			self.canvas.renderFrame();
		}
		else if(mem.getSelectedOptionId()==1) 
		{
			self.obj1.shader.useLighting(true);
			self.lightswitch_button.setSelected(true);
			self.obj1.shader.setMapMode(1);
			self.map_menu.setSelectedOption(self.map2_button);
			self.colormap_menu.setEnabled(true);
			self.obj1.shader.setColorMap([[0,0,0,1],[1,1,1,1]]);
			self.colormap_menu.setSelectedOption(self.colormap3_button);
			self.obj1.shader.useTexture(false);	
			self.texture_button.setSelected(false);
			self.canvas.renderFrame();
		}
		else if(mem.getSelectedOptionId()==2) 
		{
			self.obj1.shader.useLighting(false);
			self.lightswitch_button.setSelected(false);
			self.interaction_menu.setSelectedOption(self.rotate_button);
			self.rotateWithOneFinger();
			
			self.obj1.shader.setMapMode(1);
			self.map_menu.setSelectedOption(self.map2_button);
			self.colormap_menu.setEnabled(true);
			self.obj1.shader.setColorMap([[0,0,0,1],[1,1,1,1]]);
			self.colormap_menu.setSelectedOption(self.colormap3_button);
			self.obj1.shader.useTexture(false);	
			self.texture_button.setSelected(false);
			self.canvas.renderFrame();
		}
		else if(mem.getSelectedOptionId()==3) 
		{
			self.obj1.shader.useLighting(false);
			self.lightswitch_button.setSelected(false);
			self.interaction_menu.setSelectedOption(self.rotate_button);
			self.rotateWithOneFinger();
			
			self.obj1.shader.setMapMode(2);
			self.map_menu.setSelectedOption(self.map3_button);
			self.colormap_menu.setEnabled(true);
			self.obj1.shader.setColorMap([[0,0,1,1],[0,1,1,1],[0,1,0,1],[1,1,0,1],[1,0,0,1]]);
			self.colormap_menu.setSelectedOption(self.colormap1_button);
			self.obj1.shader.useTexture(false);
			self.texture_button.setSelected(false);
			self.canvas.renderFrame();
		}
		else if(mem.getSelectedOptionId()==4) 
		{
			self.obj1.shader.useLighting(false);
			self.lightswitch_button.setSelected(false);
			self.interaction_menu.setSelectedOption(self.rotate_button);
			self.rotateWithOneFinger();
			
			self.obj1.shader.setMapMode(0);
			self.map_menu.setSelectedOption(self.map1_button);
			self.colormap_menu.setEnabled(false);
			self.obj1.shader.useTexture(true);
			self.texture_button.setSelected(true);
			self.canvas.renderFrame();
		}
		};
	
	var dev_callback=function(){
			var w=self.wm.infoWindow(400,200,'Information');
			var dv=w.getContentDiv();
			var d=document.createElement('div');
			dv.appendChild(d);
			dv.style.backgroundColor='rgba(128,128,128,0.8)';
			d.style.top='10px';
			d.style.width='100%';
			d.style.position='absolute';
			d.style.touchAction='none';
			d.style.textAlign='center';
			d.style.lineHeight='14px';
			d.style.verticalAlign='middle';	
			d.style.fontFamily='Arial';
			d.style.color='rgb(255,255,255)';
			d.style.textShadow='-1px -1px 0px #5b6178';
			d.style.fontWeight='bold';
			d.style.fontSize='14px';
			d.style.textDecoration='none';
			d.innerHTML='<img src="js/img/console_icon.png" width="64px"><br>This function is currently under development.<br><br>Get preview access when you join our dev team!';
			};
	
	b=new RetractableToolbarButton(this.toolbar_x);
	b.setIcon('https://digitalepigraphy.github.io/visineat/js/img/share_icon.png');
	b.setLink('');
	b.setLabel('Share');
	b.onClick=function()
	{	
		var app=self.wm.installApp('https://digitalepigraphy.github.io/visineat/js/apps/social_nets/','Sharing options');
		app.start(function(app){new SocialNetsApp(app);});
	};
	
	b=new RetractableToolbarButton(this.toolbar_x);
	b.setIcon('https://digitalepigraphy.github.io/visineat/js/img/embed_icon.png');
	b.setLink('');
	b.setLabel('Embed');
	b.onClick=function()
	{
		var w=self.wm.infoWindow(550,200,'Embed HTML tag');
			var dv=w.getContentDiv();
			var d=document.createElement('div');
			dv.appendChild(d);
			dv.style.backgroundColor='rgba(0,0,0,0.4)';
			d.style.top='10px';
			d.style.width='100%';
			d.style.position='absolute';
			d.style.touchAction='none';
			d.style.textAlign='center';
			d.style.lineHeight='14px';
			d.style.verticalAlign='middle';	
			d.style.fontFamily='Arial';
			d.style.color='rgb(255,255,255)';
			d.style.textShadow='-1px -1px 0px #5b6178';
			d.style.fontWeight='bold';
			d.style.fontSize='14px';
			d.style.textDecoration='none';
			d.innerHTML='Copy the following HTML tag and paste it in your site:<br><br><textarea style="border-radius:5px;height:80px;width:90%;font-family:Courier;font-size:14px;" readonly>&lt;iframe src="https://digitalepigraphy.github.io/visineat/view?o='+self.file_info.id+'" width="600px" height="400px" frameborder="0" scrolling="no"&gt;&lt;/iframe&gt;</textarea>';
	};
	
	this.projector_menu=new RetractableToolbarButton(this.toolbar_x);
	this.projector_menu.setLabel('Change viewing mode');
		
	this.cross_eyes_button=new RetractableToolbarButton(this.projector_menu);
	this.cross_eyes_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/crossed_eyes_icon.png');
	this.cross_eyes_button.setLabel('Crossed eyes');
	
	this.parallel_eyes_button=new RetractableToolbarButton(this.projector_menu);
	this.parallel_eyes_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/parallel_eyes_icon.png');
	this.parallel_eyes_button.setLabel('Parallel eyes');
	
	this.red_blue_button=new RetractableToolbarButton(this.projector_menu);
	this.red_blue_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/red_cyan_icon.png');
	this.red_blue_button.setLabel('Red/Cyan glasses');
	
	this.side_by_side_button=new RetractableToolbarButton(this.projector_menu);
	this.side_by_side_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/3dtv_icon.png');
	this.side_by_side_button.setLabel('3D TV display');
	
	this.oculus_button=new RetractableToolbarButton(this.projector_menu);
	this.oculus_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/oculus_icon.png');
	this.oculus_button.setLabel('Oculus head mounted display');
	
	this.eyes_button=new RetractableToolbarButton(this.projector_menu);
	this.eyes_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/eye_icon.png');
	this.eyes_button.setLabel('Bare eye vision');
	this.projector_menu.setSelectedOption(this.eyes_button);
	
	this.projector_menu.onSelect=function(opt)
	{
		if(opt==self.eyes_button)
		{
			self.canvas.useRegularProjector();
		}
		else if(opt==self.oculus_button)
		{
			self.canvas.useOculusProjector();
			//self.setFullScreen(true);
		}
		else if(opt==self.side_by_side_button)
		{
			self.canvas.useSideBySideProjector(true,false);
			//self.setFullScreen(true);
		}
		else if(opt==self.red_blue_button)
		{
			self.canvas.useRedCyanProjector();
		}
		else if(opt==self.parallel_eyes_button)
		{
			self.canvas.useSideBySideProjector(false,false);
		}
		else if(opt==self.cross_eyes_button)
		{
			self.canvas.useSideBySideProjector(false,true);
		}
	};
	
	var camera_callback=function()
	{
		var video      = document.createElement('video');
		video.width    = 320;
		video.height   = 240;
		video.autoplay = true;

		navigator.getUserMedia  = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;
		
		var hasUserMedia = navigator.getUserMedia ? true : false;

		if(!hasUserMedia) return;
		
		navigator.getUserMedia({video: true}, function(stream){
			video.src    = window.URL.createObjectURL(stream);
			console.log(video.src);
		}, function(error){
		console.log("Failed to get a stream due to", error);
		});
		
		var w=self.wm.createWindow(0,0,320,240);
		w.setTitle('Camera');
		w.setCanResize(true);
		w.setCanMove(true);
		var div_container=w.getContentDiv();
		div_container.style.backgroundColor='rgb(0,0,0)';
		div_container.appendChild(video);
		video.style.width='100%';
		video.style.height='100%';
		var decoration_width=w.getWidth()-parseInt(div_container.clientWidth);
		var decoration_height=w.getHeight()-parseInt(div_container.clientHeight);
		w.setSize(320+decoration_width,240+decoration_height);
		w.center();
	};
	
	b=new RetractableToolbarButton(this.toolbar_x);
	b.setLink('');
	if(!this.inIframe() || this.file_info.full)
	{
		b.setIcon('https://digitalepigraphy.github.io/visineat/js/img/more_icon.png');
		b.setLabel('App menu');
	}
	else
	{
		b.setIcon('https://digitalepigraphy.github.io/visineat/js/img/more_icon.png');
		b.setLabel(['More options and App menu','(in full screen)']);
	}
	b.onClick=function(b)
	{
		if(self.file_info.full){}
		else if(self.inIframe())
		{	
			//window.open('https://digitalepigraphy.github.io/visineat/view?o='+self.file_info.id);
			parent.location='https://digitalepigraphy.github.io/visineat/view?o='+self.file_info.id;
			return;
		}
		var menu=self.wm.createIconMenuWindow('App Menu');
		
		menu.addApp('https://digitalepigraphy.github.io/visineat/js/apps/gesture_demo/','Gesture Demo',function(app){new DEAdemo(app);});
		
		//menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/gesture_demo_icon.png','Gesture Demo',function(){self.demo.start();});
		
		menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/console_icon.png','Console',function(){self.console.getWindow().show();self.console.focus();});
		
		menu.addApp('https://digitalepigraphy.github.io/visineat/js/apps/system_info/','System Info',function(app){new SystemInfoApp(app);});
		
		menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/edit_icon.png','Record editor',dev_callback);
		
		menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/annotation_icon.png','Annotation editor',dev_callback);
		
		menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/mesh_editor_icon.png','Mesh editor',dev_callback);
		
		menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/caliber_icon.png','Measurement tool',dev_callback);
		
		menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/camera_icon.png','Camera',camera_callback);
		
		menu.addIcon('https://digitalepigraphy.github.io/visineat/js/img/gavel_icon.png','Report files',dev_callback);
	};
	
	b=new RetractableToolbarButton(this.toolbar_y);
	this.surface_button=new RetractableToolbarButton(b);
	this.surface_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/solid_icon.png');
	this.surface_button.setLabel('Surface rendering');
	
	this.edge_button=new RetractableToolbarButton(b);
	this.edge_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/edges_icon.png');
	this.edge_button.setLabel('Edge redering');
	
	this.vertex_button=new RetractableToolbarButton(b);
	this.vertex_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/points_icon.png');
	this.vertex_button.setLabel('Vertex rendering');
	b.setSelectedOption(this.surface_button);
	b.setLabel('Change rendering mode');
	b.onSelect=function(opt){
		self.canvas.renderFrame();
		if(opt==self.surface_button)	self.obj1.setDrawMode(self.canvas.gl.TRIANGLES);
		else if(opt==self.edge_button)	self.obj1.setDrawMode(self.canvas.gl.LINES);
		else if(opt==self.vertex_button)	{self.obj1.setDrawMode(self.canvas.gl.POINTS);
			//self.obj1.shader.setPointSize(10);
		}
	};
	
	b=new RetractableToolbarButton(this.toolbar_y);
	this.perspective_button=new RetractableToolbarButton(b);
	this.perspective_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/perspective_icon.png');
	this.perspective_button.setLabel('Perspective projection');
	
	this.orthographic_button=new RetractableToolbarButton(b);
	this.orthographic_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/orthographic_icon.png');
	this.orthographic_button.setLabel('Orthographic projection');
	b.setSelectedOption(this.perspective_button);
	b.setLabel('Change projection mode');
	
	b.onSelect=function(opt)
	{
		if(opt==self.perspective_button) self.canvas.camera.perspectiveProjection();
		else if(opt==self.orthographic_button) self.canvas.camera.orthographicProjection();
	};
	
	this.map_menu=new RetractableToolbarButton(this.toolbar_y);
	this.map1_button=new RetractableToolbarButton(this.map_menu);
	this.map1_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/map1_icon.png');
	this.map1_button.setLabel('No map');
	this.map1_button.setLabel('No map');
	
	this.map2_button=new RetractableToolbarButton(this.map_menu);
	this.map2_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/map2_icon.png');
	this.map2_button.setLabel('Depth map');
	
	this.map3_button=new RetractableToolbarButton(this.map_menu);
	this.map3_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/map3_icon.png');
	this.map3_button.setLabel('Edge map');
		
	/*this.shader5_button=new RetractableToolbarButton(b);
	this.shader5_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/shader5_icon.png');
	this.shader5_button.setLabel('Original image');*/
	this.map_menu.setSelectedOption(this.map1_button);
	this.map_menu.setLabel('Use a map');
	this.map_menu.onSelect=function(opt)
	{
		self.canvas.renderFrame();
		if(opt==self.map1_button)
		{
			self.colormap_menu.setEnabled(false);
			self.obj1.shader.setMapMode(0);
		}
		else if(opt==self.map2_button)	
		{
			self.colormap_menu.setEnabled(true);
			self.obj1.shader.setMapMode(1);
		}
		else if(opt==self.map3_button)	
		{
			self.colormap_menu.setEnabled(true);
			self.obj1.shader.setMapMode(2);
		}
	};
	
	this.colormap_menu=new RetractableToolbarButton(this.toolbar_y);
	this.colormap_menu.setLabel('Change colormap');
	this.colormap_menu.setEnabled(false);
	
	this.colormap1_button=new RetractableToolbarButton(this.colormap_menu);
	this.colormap1_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/colormap1_icon.png');
	this.colormap1_button.setLabel('Heat colormap');
	this.colormap_menu.setSelectedOption(this.colormap1_button);
	
	this.colormap2_button=new RetractableToolbarButton(this.colormap_menu);
	this.colormap2_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/colormap2_icon.png');
	this.colormap2_button.setLabel('Inverse heat colormap');
	
	this.colormap3_button=new RetractableToolbarButton(this.colormap_menu);
	this.colormap3_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/colormap3_icon.png');
	this.colormap3_button.setLabel('Grayscale colormap');
	
	this.colormap4_button=new RetractableToolbarButton(this.colormap_menu);
	this.colormap4_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/colormap4_icon.png');
	this.colormap4_button.setLabel('Inverse grayscale colormap');
	
	this.colormap5_button=new RetractableToolbarButton(this.colormap_menu);
	this.colormap5_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/colormap5_icon.png');
	this.colormap5_button.setLabel('Heat colormap 2');
	
	this.colormap6_button=new RetractableToolbarButton(this.colormap_menu);
	this.colormap6_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/colormap6_icon.png');
	this.colormap6_button.setLabel('Inverse heat colormap 2');
	
	
	
	
	this.colormap_menu.onSelect=function(opt)
	{
		self.canvas.renderFrame();
		if(opt==self.colormap1_button)
			self.obj1.shader.setColorMap([[0,0,1,1],[0,1,1,1],[0,1,0,1],[1,1,0,1],[1,0,0,1]]);
		else if(opt==self.colormap2_button)
			self.obj1.shader.setColorMap([[1,0,0,1],[1,1,0,1],[0,1,0,1],[0,1,1,1],[0,0,1,1]]);
		else if(opt==self.colormap3_button)
			self.obj1.shader.setColorMap([[0,0,0,1],[1,1,1,1]]);
		else if(opt==self.colormap4_button)
			self.obj1.shader.setColorMap([[1,1,1,1],[0,0,0,1]]);
		else if(opt==self.colormap6_button)
			self.obj1.shader.setColorMap([[1,1,0,1],[1,0,0,1],[1,0,1,1],[0,0,1,1],[0,1,1,1]]);
		else if(opt==self.colormap5_button)
			self.obj1.shader.setColorMap([[0,1,1,1],[0,0,1,1],[1,0,1,1],[1,0,0,1],[1,1,0,1]]);
	};
	
	this.texture_button=new RetractableToolbarButton(this.toolbar_y);
	this.texture_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/texture_icon.png');
	this.texture_button.setLabel('Show/hide texture');
	this.texture_button.setSelected(true);
	this.texture_button.onClick=function(btn)
	{
		self.canvas.renderFrame();
		self.obj1.shader.useTexture(btn.isSelected());
	};
	
	this.lightswitch_button=new RetractableToolbarButton(this.toolbar_y);
	this.lightswitch_button.setIcon('https://digitalepigraphy.github.io/visineat/js/img/lightswitch_icon.png');
	this.lightswitch_button.setLabel('Switch virtual light on/off');
	this.lightswitch_button.onClick=function(btn)
	{
		self.canvas.renderFrame();
		self.obj1.shader.useLighting(btn.isSelected());
		if(self.interaction_menu.getSelectedOption()==self.relight_button)
		{	
			self.interaction_menu.setSelectedOption(self.rotate_button);
			self.rotateWithOneFinger();
		}
	};
	
	b=new RetractableToolbarButton(this.toolbar_y);
	b.setIcon('https://digitalepigraphy.github.io/visineat/js/img/download_icon.png');
	b.setLabel('Download');
	b.setLink('');
	b.onClick=dev_callback;
	
	
	
	this.obj1=null;
	this.obj2=null;
	this.obj3=null;
	this.room=null;
	this.bkg=null;
	

	this.tap_mode=false;
	
	this.canvas.onOrientationChange=function(e){if(self.use_accelerometer)self.canvas.getCamera().updatePerspective(e);};
	this.canvas.onTap=function(e){
	if(e.object==null)
	{
		self.tap_mode=false;
		self.obj1.setDrawBoundingBox(false);
		if(self.gui.isExpanded())self.gui.retract();else self.gui.expand();}
	};
	this.canvas.onMove=function(e){
	if(self.canvas.getCamera().getFPS()>10 && !e.mouse_pressed)
	{
		var xyz=self.canvas.getXYDepthAt(e.x[0],e.y[0]);		
		self.sp.pos_x=xyz[0];self.sp.pos_y=xyz[1];self.sp.pos_z=xyz[2];
		if(self.obj1.bounding_box!=null)
		{
			var xyz2=self.canvas.getXYZAt(e.x[0],e.y[0]);
			self.obj1.bounding_box.setXYZ([xyz2[0]/self.obj1.scale,xyz2[1]/self.obj1.scale,xyz2[2]/self.obj1.scale]);
		}
		self.canvas.renderFrame();
	}
	//console.log(self.canvas.getDepthAt(e.x[0],e.y[0]));
	if(!e.mouse_pressed){self.gui.expand();}
	};
	this.canvas.onTouch=function(e){document.getElementById('search_input').blur();};
	this.canvas.onDragStart=function(e){self.gui.retract();};
	this.canvas.onDrag=function(e)
	{
		if(e.getNumOfPointers()==1)
		{
			if(self.one_finger_mode==0) self.canvas.getCamera().oneFingerMove(e);
			else if(self.one_finger_mode==1) self.canvas.getCamera().oneFingerRotate(e,{radius:2});
			else if(self.one_finger_mode==2) self.canvas.getCamera().oneFingerZoom(e);
			else if(self.one_finger_mode==3) 
			{
				self.canvas.showBeams(true);
				self.canvas.getCamera().oneFingerRelight(e);
			}
		}
		else
		{
			self.canvas.showBeams(false);
			self.canvas.getCamera().twoFingerRotate(e);
			self.canvas.getCamera().twoFingerZoom(e);
			self.canvas.getCamera().twoFingerMove(e);
		}
		self.sp.pos_x=0;self.sp.pos_y=0;self.sp.pos_z=100;
	};
	
	this.canvas.onDragEnd=function(e){
		self.sp.pos_x=0;self.sp.pos_y=0;self.sp.pos_z=100;
		self.gui.expand();self.canvas.showBeams(false);};
	
	this.canvas.onScroll=function(e){self.canvas.getCamera().zoomByScroll(e);};
	
	this.canvas.onSetup=function(){self.onCanvasSetup();};
	this.canvas.onDraw=function(){self.onCanvasDraw();};
	
	this.canvas.start();
}

VNMainApp.prototype.inIframe=function() {
	if(typeof this.in_iframe==='undefined')
	{
		try {
			return window.self !== window.top;
		} catch (e) {
			return true;
		}
	}
	else return this.in_iframe;
};

VNMainApp.prototype.showSettings=function()
{
	this.gui.playClick1Sound();
	var m=new VNAppMenuWindow(this.wm);
	var w=m.getWindow();
	w.setTitle('Settings');
	var cd=w.getContentDiv();
	var d=document.createElement('div');
	cd.style.backgroundColor='rgba(100,100,100,0.6)';
	cd.appendChild(d);
	d.style.width='100%';
	d.style.margin='10px';
	d.style.fontFamily='Arial';
	d.style.color='rgb(255,255,255)';
	d.style.textShadow='2px 2px 0px #000000';
	d.style.fontWeight='bold';
	d.style.fontSize='16px';
	d.style.lineHeight='50px';
	d.style.textDecoration='none';
	d.innerHTML+='Pixel Density: <input class="myButton" type="button" value="0.25" onclick="app.canvas.camera.setPixelDensity(0.25);"> <input class="myButton" type="button" value="0.5" onclick="app.canvas.camera.setPixelDensity(0.5);"> <input class="myButton" type="button" value="1" onclick="app.canvas.camera.setPixelDensity(1);"> <input class="myButton" type="button" value="1.5" onclick="app.canvas.camera.setPixelDensity(1.5);"> <input class="myButton" type="button" value="2" onclick="app.canvas.camera.setPixelDensity(2);"><br>';
	
	d.innerHTML+='Object Dimensionality: <input class="myButton" type="button" value="2D" onclick="app.obj1.shader.useZ(false);"> <input class="myButton" type="button" value="3D" onclick="app.obj1.shader.useZ(true);"><br>';
	
	d.innerHTML+='Full Screen mode: <input class="myButton" type="button" value="Toggle FullScreen" onclick="app.toggleFullScreen();"><br>';
	
	d.innerHTML+='Use Accelerometer: <input class="myButton" type="button" value="Enable" onclick="app.useAccelerometer(true);"> <input class="myButton" type="button" value="Disable" onclick="app.useAccelerometer(false);"><br>';
};

VNMainApp.prototype.useAccelerometer=function(flag)
{
	this.use_accelerometer=flag;
};

VNMainApp.prototype.setFullScreen=function(flag) {
if(flag)
{
	if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }
}
else
{
	if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

};

VNMainApp.prototype.toggleFullScreen=function() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

/**
 * Sets the interaction to rotate the camera when dragging one finger.
 */
VNMainApp.prototype.rotateWithOneFinger=function(){this.one_finger_mode=1;};
/**
 * Sets the interaction to move the camera when dragging one finger.
 */
VNMainApp.prototype.translateWithOneFinger=function(){this.one_finger_mode=0;};
/**
 * Sets the interaction to zoom in/out the camera when dragging one finger.
 */
VNMainApp.prototype.zoomWithOneFinger=function(){this.one_finger_mode=2;};
/**
 * Sets the interaction to relight the scene when dragging one finger.
 */
VNMainApp.prototype.relightWithOneFinger=function(){this.one_finger_mode=3;};

VNMainApp.prototype.addNotification=function(text)
{
	this.message_area.println(text);
};
VNMainApp.prototype.setNotification=function(pos,text)
{
	this.message_area.overwrite(pos,text);
};

VNMainApp.prototype.openFile=function()
{
	this.gui.playClick1Sound();
	var w=this.wm.uploadFileWindow('Open 3D File','Drag and drop or Click to select a 3D file from your computer.<br><br><font style="font-weight:normal;text-align:left;">This feature is currently under development. <br> Get preview access when you join our dev team!</font>',
	'https://digitalepigraphy.github.io/visineat/do/upload/',function(){},function(xmlhttp)
	{
		var xml=xmlhttp.responseXML;
		
		var e=xml.getElementsByTagName('success');
		if(e.length>0 && e[0].innerHTML=='true')
		{
			e=xml.getElementsByTagName('dir');
			location.assign("https://digitalepigraphy.github.io/visineat/view?o="+e[0].innerHTML);
		}
	});			
};

VNMainApp.prototype.onCanvasSetup=function()
{
   var gl=this.canvas.gl;
   var self=this;
  
   this.bkg=new BluePrintObject(this.canvas);
		this.bkg.addCircle([0,-0.6,0],1,[0,1,0],64,[0,60]);
		this.bkg.addCircle([0,-0.6,0],3,[0,1,0],64,[0,60]);
		
		this.bkg.addCircle([3,-0.6,0],0.1,[0,1,0],16,[60,120]);
		this.bkg.addCircle([-3,-0.6,0],0.1,[0,1,0],16,[60,120]);
		this.bkg.addCircle([0,-0.6,3],0.1,[0,1,0],16,[60,120]);
		this.bkg.addCircle([0,-0.6,-3],0.1,[0,1,0],16,[60,120]);
	
		this.bkg.addCircle([3,-0.6,3],0.2,[0,1,0],16,[0,60]);
		this.bkg.addCircle([-3,-0.6,3],0.2,[0,1,0],16,[0,60]);
		this.bkg.addCircle([3,-0.6,-3],0.2,[0,1,0],16,[0,60]);
		this.bkg.addCircle([-3,-0.6,-3],0.2,[0,1,0],16,[0,60]);
		
		for(var i=0;i<8;i++)
		this.bkg.column(8*Math.sin(3.14/8+i*6.28/8),8*Math.cos(3.14/8+i*6.28/8));
		
		
		this.bkg.dashedLine([0.72,-0.6,0.72],[3,-0.6,3],[0,1,0],8,[60,120]);
		this.bkg.dashedLine([0.72,-0.6,-0.72],[3,-0.6,-3],[0,1,0],8,[60,120]);
		this.bkg.dashedLine([-0.72,-0.6,0.72],[-3,-0.6,3],[0,1,0],8,[60,120]);
		this.bkg.dashedLine([-0.72,-0.6,-0.72],[-3,-0.6,-3],[0,1,0],8,[60,120]);
	
		for(var i=-9;i<=9;i+=2)
		{
			if(i<-2 || i>2)
				this.bkg.line([-9,-0.6,i],[9,-0.6,i],[0,1,0],2,[0,120]);
			else
			{
				this.bkg.line([-9,-0.6,i],[-3,-0.6,i],[0,1,0],2,[60+(i+9)*3,60+(i+10)*3]);
				this.bkg.line([3,-0.6,i],[9,-0.6,i],[0,1,0],2,[60+(i+9)*3,60+(i+10)*3]);
			}
		}
		for(var i=-9;i<=9;i+=2)
		{
			if(i<-2 || i>2)
				this.bkg.line([i,-0.6,-9],[i,-0.6,9],[0,1,0],2,[60+(i+9)*3,60+(i+10)*3]);
			else
			{
				this.bkg.line([i,-0.6,-9],[i,-0.6,-3],[0,1,0],2,[60+(i+9)*3,60+(i+10)*3]);
				this.bkg.line([i,-0.6,3],[i,-0.6,9],[0,1,0],2,[60+(i+9)*3,60+(i+10)*3]);
			}
		}
   
   
   
	this.room=new WebGLImageComposition(this.canvas);
   //this.room.load("https://digitalepigraphy.github.io/visineat/rooms/museum");
   this.room.setBrightness(1);
   this.obj1=new StructureSensorZIP(this.canvas);
   this.obj1.onTap=function(e)
   {
		if(self.tap_mode)
		{
		var xyz=self.canvas.getXYZAt(e.x[0],e.y[0]);
		var s=new WebGLObject(self.canvas);
		s.createSphere81(0.02);
		s.getShader().setColorMask([1,0,0,1]);
		s.pos_x=xyz[0];s.pos_y=xyz[1];s.pos_z=xyz[2];
		self.sp_array.push(s);
		self.canvas.renderFrame();
		}
		else
		{
			self.tap_mode=true;
			self.obj1.setDrawBoundingBox(true);
		}
   /*self.tap_mode=!self.tap_mode;if(self.tap_mode){self.obj1.setDrawBoundingBox(true);self.gui.retract();}else{self.obj1.setDrawBoundingBox(true);self.gui.expand();}*/
   };
   this.obj1.onDragStart=function(e){};
   this.obj1.onDragEnd=function(e){};
   this.obj1.onDrag=function(e){};
   this.obj1.onMouseEnter=function(e){self.tap_mode=true;self.obj1.setDrawBoundingBox(true);self.canvas.renderFrame();};
   this.obj1.onMouseLeave=function(e){self.tap_mode=false;self.obj1.setDrawBoundingBox(false);self.canvas.renderFrame();};
   this.obj1.onLoad=function()
   {
		self.canvas.setLoadingStatus(false);
		self.gui.expand();
		if(self.file_info['_has_thumbnail']=='false')
		{
			var t=new ThumbnailMaker(self.canvas);
			t.make(self.obj1,self.file_info.id);
		}
   };
   
   if(this.inIframe() && typeof this.file_info.collection ==='undefined') this.next_obj=new Array();
   else
   {
	   this.next_obj=new Array(this.file_info.next_items.length);
	   for(var i=0;i<this.file_info.next_items.length;i++)
	   {
			this.next_obj[i]=new WebGLObject(this.canvas);
			var xyz=new Float32Array(12);
			xyz[0]=-0.6;xyz[1]=-0.6;xyz[2]=0;
			xyz[3]=0.6;xyz[4]=-0.6;xyz[5]=0;
			xyz[6]=0.6;xyz[7]=0.6;xyz[8]=0;
			xyz[9]=-0.6;xyz[10]=0.6;xyz[11]=0;
			this.next_obj[i].setXYZ(xyz);
			this.next_obj[i].setUV([0,0,1,0,1,1,0,1]);
			this.next_obj[i].setTRI([0,1,2,0,2,3]);
			this.next_obj[i].setTexture('https://digitalepigraphy.github.io/visineat/db/'+this.file_info.next_items[i]+'/thumb.png',true);
			if(this.file_info.collection)
			this.next_obj[i].link='https://digitalepigraphy.github.io/visineat/view?o='+this.file_info.next_items[i]+this.file_info.propagate_flags;
			else this.next_obj[i].link='https://digitalepigraphy.github.io/visineat/view?o='+this.file_info.next_items[i];
			this.next_obj[i].onTap=function(e){document.location=e.object.link;};
			
			if(this.file_info.override_object_link_url)
			{
				this.next_obj[i].link='http://'+this.file_info.override_object_link_url+'?o='+this.file_info.next_items[i];
				this.next_obj[i].onTap=function(e){parent.location=e.object.link;};
			}
			this.next_obj[i].onMouseLeave=function(e){e.object.color=[1,1,1,0.7];self.canvas.renderFrame();};
			this.next_obj[i].onMouseEnter=function(e){e.object.color=[1,0,1,0.7];self.canvas.renderFrame();};
			this.next_obj[i].color=[1,1,1,0.7];
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			if(i>0) this.next_obj[i].sameShader(this.next_obj[0]);
	   }
	   this.next_obj[0].getShader().setColorMask([1,1,1,0.7]);
   }
   
   var meta=new VNMetaData();
   meta.onLoad=function()
   {
		self.obj1.load(self.file_info.main_object_url);
		//if(self.wm.getWidth()>600)meta.createWindow(self.wm);
   };
   meta.load(this.file_info);
   
   //this.obj1.load('https://digitalepigraphy.github.io/visineat/db/Model-fishmount5.zip');//'https://digitalepigraphy.github.io/visineat/db/Model-Rome-borghese-lion1.zip');
   //this.obj2=new StructureSensorZIP(this.canvas);
   //this.obj2.load('https://digitalepigraphy.github.io/visineat/db/Model-14.zip');
   //this.obj3=new StructureSensorZIP(this.canvas);
   //obj3.load('https://digitalepigraphy.github.io/visineat/db/Model-15.zip');
   //this.canvas.setBackgroundColor(16/255, 31/255, 115/255, 1.0); //blueprint blue
   this.canvas.setBackgroundColor(118/255, 0/255, 0/255, 1.0);
    //this.canvas.setBackgroundColor(0/255, 0/255, 255/255, 1.0);
   gl.enable(gl.BLEND);
   
   this.sp_array=[];
   
   this.img=new WebGLObject(this.canvas);
   this.img.createRect(0.5,0.5,1,1);
   this.img.disablePicking(true);
   
   this.sp=new WebGLObject(this.canvas);
	this.sp.disablePicking(true);
	this.sp.createSphere81(0.02);
	this.sp.getShader().setColorMask([1,1,1,0.5]);
	self.sp.pos_x=0;self.sp.pos_y=0;self.sp.pos_z=100;
   
};
	
VNMainApp.prototype.onCanvasDraw=function()
{  
	//console.log('draw');
	//c.println('entering draw '+Date.now());
	var gl=this.canvas.gl;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
		//mat4.translate(cv.camera.mvMatrix,[-0.6,0,0]);
		this.canvas.drawBackground();
		
		var cam=this.canvas.getCamera();
		cam.translate([0,0,-2]);
		this.bkg.draw();
		
		gl.clear(gl.DEPTH_BUFFER_BIT);
		
		
		this.obj1.draw();
		
		
		if(this.sp)
		{
			cam.pushMatrix();
			cam.identity();
			cam.translate([this.sp.pos_x,this.sp.pos_y,this.sp.pos_z]);
			this.sp.updateShader();
			this.sp.draw();
			cam.popMatrix();
		}
		for(var i=0;i<this.sp_array.length;i++)
		{
			cam.pushMatrix();
			//cam.identity();
			cam.translate([0,0,2]);
			cam.translate([this.sp_array[i].pos_x,this.sp_array[i].pos_y,this.sp_array[i].pos_z]);
			this.sp_array[i].updateShader();
			this.sp_array[i].draw();
			cam.popMatrix();
		}
		
		//if(this.tap_mode) this.obj2.draw();
		
		
		for(var i=0;i<this.next_obj.length;i++)
		{
			cam.pushMatrix();
			cam.rotate(i*3.14/4,[0,1,0]);
			cam.translate([0,0,-7]);
			this.next_obj[i].updateShader();
			this.next_obj[i].getShader().setColorMask(this.next_obj[i].color);
			this.next_obj[i].draw();
			cam.popMatrix();
		}
		
		var copy = mat4.create();
		mat4.set(this.canvas.camera.mvMatrix, copy);
		
		var a= mat4.create();
		mat4.identity(a);
		mat4.rotate(a,Math.PI*2/3,[0,1,0]);
		mat4.multiply(a,copy,this.canvas.camera.mvMatrix);
		
		//obj2.draw();
		
		mat4.identity(a);
		mat4.rotate(a,-Math.PI*2/3,[0,1,0]);
		mat4.multiply(a,copy,this.canvas.camera.mvMatrix);
		
		//obj3.draw();
		
		
		mat4.set(copy,this.canvas.camera.mvMatrix);
		gl.enable(gl.CULL_FACE);
		this.room.draw();
		gl.disable(gl.CULL_FACE);
		
		
		for(var i = this.drawables.length - 1; i >= 0; i--) this.drawables[i].draw();
		

		/*cam.pushMatrix();
		cam.identity();
		cam.translate([-0.5,0,-1]);
		this.img.setTexture(this.canvas.roii.bufferTexture);
		this.img.updateShader();
		this.img.draw();
		cam.popMatrix();*/
		
		//if(this.canvas.camera.getFPS()<10)
		//	c.println('Warning: Low FPS='+this.canvas.camera.getFPS());
		//c.println(cv.progress_bar.value);
		//c.println('exiting draw '+Date.now()+' FPS:'+cv.camera.getFPS()+' '+cv.camera.next_object_rotation);
		
		//c.println('f='+this.canvas.total_number_of_faces+' v='+this.canvas.total_number_of_vertices+' o='+this.canvas.total_number_of_objects);
		
};

	
	

function BluePrintObject(canvas)
	{
		this.gl=canvas.gl;
		this.camera=canvas.camera;
		this.canvas=canvas;
				
		this.grid=new WebGLObject(canvas);
		
		this.xyz=new Array();
		this.lin=new Array();
		this.time=new Array();
		this.nrm=new Array();

}
	
	
BluePrintObject.prototype.draw=function()
{	
		this.grid.setXYZ(this.xyz);
		this.grid.setNormals(this.nrm);
		this.grid.setLIN(this.lin);
		this.grid.setData("aTimeStamp",this.time,1);

		this.grid.setShader(new WebGLShader(this.canvas,this.canvas.VN_NORMALS|this.canvas.VN_TIMESTAMPS|	this.canvas.VN_CULL));	
		
		if(this.camera.realToCSSPixels==1)
		{
			this.grid.getShader().setUniform1f("uFadeWithDistanceFactor", 3);
			this.grid.getShader().setColorMask([1,1,1,1]);
		}
		else	
		{
			this.grid.getShader().setUniform1f("uFadeWithDistanceFactor", 0.8);
			this.grid.getShader().setColorMask([1,1,1,1]);
		}	
		this.grid.getShader().setUniform1i("uFadeWithDistance", true);
		this.grid.getShader().setUniform1i("uUseLighting", false);
		this.animation_time=0;
		this.grid.getShader().setUniform1f("uTimeNow",this.animation_time);
		
		this.draw=this._draw;
		this.draw();
};
	
	BluePrintObject.prototype.column=function(x,y)
	{
		this.addCircle([x,-0.6,y],0.2,[0,1,0],16,[0,60]);
		this.addCircle([x,-0.6,y],0.2,[0,-1,0],16,[0,60]);
		this.addCircle([x,1.2,y],0.14,[0,1,0],16,[0,60]);
		this.addCircle([x,1.2,y],0.14,[0,-1,0],16,[0,60]);
		this.addCircle([x,1.28,y],0.2,[0,1,0],16,[0,60]);
		this.addCircle([x,1.28,y],0.2,[0,-1,0],16,[0,60]);
		for(var i=0;i<6;i++)
			this.cylinder([x,-0.6+0.3*i,y],[x,-0.6+(i+1)*0.3,y],[0.2-0.01*i,0.2-0.01*(i+1)],[0,1,0],16,[10*i,10*(i+1)]);
		
		this.cylinder([x,1.2,y],[x,1.28,y],[0.14,0.2],[0,1,0],16,[0,60]);
		this.cube([x-0.2,1.28,y-0.2],[x+0.2,1.38,y+0.2],[0,1,0],2,[0,60]);
		
	};
	BluePrintObject.prototype.cylinder=function(from,to,rad,n,res,timing)
	{
		this.addCircle(from,rad[0],null,res,timing);
		//this.addCircle(from,rad[0],[n[0],-n[1],n[2]],res,timing);
		for(var i=0;i<res;i++)
			this.line([from[0]+rad[0]*Math.cos(-i*6.28/res),from[1],from[2]+rad[0]*Math.sin(-i*6.28/res)],[to[0]+rad[1]*Math.cos(-i*6.28/res),to[1],to[2]+rad[1]*Math.sin(-i*6.28/res)],[Math.cos(-i*6.28/res),0,Math.sin(-i*6.28/res)],2,timing);
		this.addCircle(to,rad[1],null,res,timing);
		//this.addCircle(to,rad[1],[n[0],-n[1],n[2]],res,timing);
	}
	
	
	BluePrintObject.prototype.cube=function(from,to,n,res,timing)
	{
		//back
		this.line([from[0],from[1],from[2]],[to[0],from[1],from[2]],[0,0,-1],2,timing);
		this.line([from[0],from[1],from[2]],[from[0],to[1],from[2]],[0,0,-1],2,timing);
		this.line([to[0],to[1],from[2]],[to[0],from[1],from[2]],[0,0,-1],2,timing);
		this.line([to[0],to[1],from[2]],[from[0],to[1],from[2]],[0,0,-1],2,timing);
		
		//front
		this.line([from[0],from[1],to[2]],[to[0],from[1],to[2]],[0,0,1],2,timing);
		this.line([from[0],from[1],to[2]],[from[0],to[1],to[2]],[0,0,1],2,timing);
		this.line([to[0],to[1],to[2]],[to[0],from[1],to[2]],[0,0,1],2,timing);
		this.line([to[0],to[1],to[2]],[from[0],to[1],to[2]],[0,0,1],2,timing);
		
		//bottom
		this.line([from[0],from[1],from[2]],[to[0],from[1],from[2]],[0,-1,0],2,timing);
		this.line([from[0],from[1],from[2]],[from[0],from[1],to[2]],[0,-1,0],2,timing);
		this.line([to[0],from[1],to[2]],[to[0],from[1],from[2]],[0,-1,0],2,timing);
		this.line([to[0],from[1],to[2]],[from[0],from[1],to[2]],[0,-1,0],2,timing);

		//top
		this.line([from[0],to[1],from[2]],[to[0],to[1],from[2]],[0,1,0],2,timing);
		this.line([from[0],to[1],from[2]],[from[0],to[1],to[2]],[0,1,0],2,timing);
		this.line([to[0],to[1],to[2]],[to[0],to[1],from[2]],[0,1,0],2,timing);
		this.line([to[0],to[1],to[2]],[from[0],to[1],to[2]],[0,1,0],2,timing);
		
		//left
		this.line([from[0],from[1],from[2]],[from[0],from[1],to[2]],[-1,0,0],2,timing);
		this.line([from[0],from[1],from[2]],[from[0],to[1],from[2]],[-1,0,0],2,timing);
		this.line([from[0],to[1],to[2]],[from[0],from[1],to[2]],[-1,0,0],2,timing);
		this.line([from[0],to[1],to[2]],[from[0],to[1],from[2]],[-1,0,0],2,timing);
		
		//right
		this.line([to[0],from[1],from[2]],[to[0],from[1],to[2]],[1,0,0],2,timing);
		this.line([to[0],from[1],from[2]],[to[0],to[1],from[2]],[1,0,0],2,timing);
		this.line([to[0],to[1],to[2]],[to[0],from[1],to[2]],[1,0,0],2,timing);
		this.line([to[0],to[1],to[2]],[to[0],to[1],from[2]],[1,0,0],2,timing);
		
	}
	
	BluePrintObject.prototype.dashedLine=function(from,to,n,res,timing)
	{
		var xyz=this.xyz;
		var lin=this.lin;
		var time=this.time;
		xyz_start=xyz.length;
		time_start=time.length;
		lin_start=lin.length;
		p_start=xyz_start/3;
		
		for(var i=0;i<res*2;i++)
		{
			xyz[xyz_start+i*3]=from[0]+(to[0]-from[0])*(i/(res*2-1));xyz[xyz_start+i*3+1]=from[1]+(to[1]-from[1])*(i/(res*2-1));xyz[xyz_start+i*3+2]=from[2]+(to[2]-from[2])*(i/(res*2-1));
			lin[lin_start+i]=p_start+i;
			time[time_start+i]=timing[0]+(timing[1]-timing[0])*(i/(res*2-1));
			this.nrm[xyz_start+i*3]=n[0];
			this.nrm[xyz_start+i*3+1]=n[1];
			this.nrm[xyz_start+i*3+2]=n[2];
		}
	};
	
	BluePrintObject.prototype.line=function(from,to,n,res,timing)
	{
		var xyz=this.xyz;
		var lin=this.lin;
		var time=this.time;
		xyz_start=xyz.length;
		time_start=time.length;
		lin_start=lin.length;
		p_start=xyz_start/3;
		
		for(var i=0;i<res;i++)
		{
			xyz[xyz_start+i*3]=from[0]+(to[0]-from[0])*(i/(res-1));xyz[xyz_start+i*3+1]=from[1]+(to[1]-from[1])*(i/(res-1));xyz[xyz_start+i*3+2]=from[2]+(to[2]-from[2])*(i/(res-1));
			time[time_start+i]=timing[0]+(timing[1]-timing[0])*(i/(res-1));
			this.nrm[xyz_start+i*3]=n[0];
			this.nrm[xyz_start+i*3+1]=n[1];
			this.nrm[xyz_start+i*3+2]=n[2];
		}
		for(var i=0;i<res-1;i++)
		{
			lin[lin_start+i*2]=p_start+i;
			lin[lin_start+i*2+1]=p_start+i+1;
		}
	};
	
	BluePrintObject.prototype.addCircle=function(pos,rad,n,res,timing)
	{
		var xyz=this.xyz;
		var lin=this.lin;
		var time=this.time;
		time_start=time.length;
		xyz_start=xyz.length;
		lin_start=lin.length;
		p_start=xyz_start/3;
		
		for(var i=0;i<res;i++)
		{
			xyz[xyz_start+i*3]=pos[0]+rad*Math.cos(-i*6.28/res);xyz[xyz_start+i*3+1]=pos[1];xyz[xyz_start+i*3+2]=pos[2]+rad*Math.sin(-i*6.28/res);
			lin[lin_start+i*2]=p_start+i;
			time[time_start+i]=timing[0]+(timing[1]-timing[0])*(i/(res-1));
			if(i==res-1) lin[lin_start+i*2+1]=p_start+0;
			else lin[lin_start+i*2+1]=p_start+i+1;
			if(n==null)
			{
				this.nrm[xyz_start+i*3]=Math.cos(-i*6.28/res);//n[0];
				this.nrm[xyz_start+i*3+1]=0;//n[1];
				this.nrm[xyz_start+i*3+2]=Math.sin(-i*6.28/res);//n[2];
			}
			else
			{
				this.nrm[xyz_start+i*3]=n[0];
				this.nrm[xyz_start+i*3+1]=n[1];
				this.nrm[xyz_start+i*3+2]=n[2];
			}
		}
	};
	
BluePrintObject.prototype._draw=function()
	{
		this.grid.getShader().updateProjection();
		this.grid.getShader().setModelView(this.camera.mvMatrix);
		this.grid.draw();

		if(this.animation_time<120)
		{
			this.animation_time+=1;
			this.grid.getShader().setUniform1f("uTimeNow",this.animation_time);
			this.canvas.renderFrame();
		}
	};
	
function VNMetaData()
{
	this.file_info={};
}

VNMetaData.prototype.onLoad=function(file_info){};

VNMetaData.prototype.load=function(file_info)
{
	this.file_info=file_info;
	this.file_info.metadata=this;
	var xmlhttp;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
  		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	var self=this;
	xmlhttp.onreadystatechange=function()
  	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			self.xml=xmlhttp.responseXML;
			self.file_info.xml=self.xml;
			self._process();
			self.onLoad(self.file_info);
		}
	}
	xmlhttp.open("GET",(('https:' == document.location.protocol) ? 'https:' : 'http:')+"//digitalepigraphy.github.io/visineat/db/"+this.file_info.id+"/meta/",true);
	xmlhttp.send();
};

VNMetaData.prototype._process=function()
{
	var xml=this.xml;
	var e=xml.getElementsByTagName('field');
	for(var i=0;i<e.length;i++)
	{
		this.file_info[e[i].getAttribute('name')]=e[i].getAttribute('value');
	}
};

VNMetaData.prototype.createWindow=function(wm)
{
	var w=wm.createWindow(wm.getWidth()-300,60,300,500);
	w.setTitle('Metadata Record');
	w.setScrollerY(true);
	w.setCanResizeX(false);
	var d=w.getContentDiv();
	d.style.backgroundColor='rgba(0,0,0,0.4)';
};

