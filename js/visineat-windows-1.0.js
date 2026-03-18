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

/**
 * This class creates and controls a window system. The window manager operates inside a given div container. You can easily create and handle window elements using the createWindow() method.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var wm=new WindowManager('my_div');<br>
 * var win=wm.createWindow(100,100,400,300);<br>
 * win.setTitle('My window');<br>
 * var window_div=win.getContentDiv();<br></font>
 * @param div A div element or the id of a div element in which the window manager will operate.
 */
function WindowManager(div)
{
	this.version='1.0';
	this.app=null;

	if(typeof div=='string')
		this.div_container=document.getElementById(div);
	else this.div_container=div;
	this.div_container.style.touchAction='none';
	this.div_container.style.overflow='hidden';
	
	this.selected_window=null;
	this.dragging_window=null;
	this.resizing_window=null;
	this.zIndex=0;
	this.windows=new Array();
	this.buttons=new Array();
	
	//block_div
	this.block_div=document.createElement('div');
	this.div_container.appendChild(this.block_div);
	this.block_div.style.position='absolute';
	this.block_div.style.width=this.getWidth()+'px';
	this.block_div.style.height=this.getHeight()+'px';
	this.block_div.style.left='0px';
	this.block_div.style.top='0px';
	this.block_div.style.touchAction='none';
	this.block_div.style.overflow='hidden';
	this.block_div.style.backgroundColor='rgba(0,0,0,0.5)';
	this.block_div.style.display='none';
	
	this.touch_operated=false;
	
	var self=this;
	this.div_container.addEventListener('mousemove',function(event){if(self.dragging_window==null && self.resizing_window==null) return;event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY; self.handleMouseMove(x,y);},false);
	this.div_container.addEventListener('mouseup',function(event){self.handleMouseUp();},false);
	this.div_container.addEventListener('touchend',function(event){self.handleMouseUp();},false);
	this.div_container.addEventListener('touchmove',function(event){if(this.dragging_window==null && self.resizing_window==null) return;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;}self.handleMouseMove(x,y);},false);
	
	this.block_div.addEventListener('mousedown',function(event){if(this.touch_operated)return;event.stopPropagation();event.preventDefault();self.blockclick();},false);
	this.block_div.addEventListener('touchstart',function(event){this.touch_operated=true;event.stopPropagation();event.preventDefault();self.blockclick();},false);
	
	this.default_title_backgroundColor='rgba(65,116,225,0.6)';
	this.default_title_backgroundColor2='rgba(73,73,98,0.6)';
	this.default_title_selectedColor='rgba(65,116,225,0.8)';
	this.default_title_selectedColor2='rgba(73,73,98,0.8)';
	this.default_title_fontColor='rgb(255,255,255)';
	this.default_title_fontFamily='"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif';
	this.default_title_fontWeight='700';
	this.default_title_fontSize='14px';
	this.default_title_textShadow='-1px -1px 0px #5b6178';//'1px 1px rgb(0,0,0)';
	this.default_close_icon='url("'+(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/img/close_window-1.0.png")';
	this.default_minimize_icon='url("'+(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/img/minimize_window-1.0.png")';
	this.default_expand_icon='url("'+(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/img/expand_window-1.0.png")';
	this.default_border_color='rgba(128,128,128,0.5)';
	
	this.default_button_backgroundColor='rgb(255,255,255)';
	this.default_button_pressedColor='rgba(160,0,0,0.5)';
	this.default_button_fontColor='rgb(128,128,128)';
	this.default_title_fontFamily='"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif';
	this.default_title_fontWeight='700';
	
	window.addEventListener('resize', function(){self.updateSize();});
};

/**
 * This method notifies the windows manager that the container div changed its size. It must be called whenever you resize the container div besides when resizing the window of the browser.
 */
WindowManager.prototype.updateSize=function()
{
	this.block_div.style.width=this.getWidth()+'px';
	this.block_div.style.height=this.getHeight()+'px';
	
	for(var i=0;i<this.windows.length;i++)
	{
		this.windows[i].setPosition(this.windows[i].left,this.windows[i].top);
	}
};

WindowManager.prototype.deleteWindow=function(w)
{
	var found=-1;
	for(var i=0;i<this.windows.length && found==-1;i++)
	{
		if(this.windows[i]==w)found=i;
	}
	if(found!=-1)
		this.windows.splice(found,1);
};

/**
 * This method returns the width of the div container in pixels.
 * @return int The width in pixels.
 */
WindowManager.prototype.getWidth=function()
{
	return parseInt(this.div_container.clientWidth);
};

/**
 * This method returns the height of the div container in pixels.
 * @return int The height in pixels.
 */
WindowManager.prototype.getHeight=function()
{
	return parseInt(this.div_container.clientHeight);
};

/**
 * This method returns the size of the div container in pixels.
 * @return Array An Array of size 2 that contains the width and height in pixels.
 */
WindowManager.prototype.getSize=function()
{
	return [this.getWidth(), this.getHeight()];
};

WindowManager.prototype.blockWindow=function(w,closeonclick)
{
	this.zIndex+=1;
	this.block_div.style.zIndex=this.zIndex;
	this.block_div.style.display='block';
	this.setSelectedWindow(w);
	var self=this;
	if(closeonclick)
	{
		w.onClose=function(win){self.unblock();return true;};
		this.blockclick=function(){w.close();self.unblock();};
	}
	else 
	{
		w.onClose=function(win){self.unblock();return true;};
		this.blockclick=function(){};
	}
};

WindowManager.prototype.unblock=function()
{
	this.block_div.style.display='none';
};

WindowManager.prototype.blockclick=function(){};

/**
 * This method creates a new window at the specified position and size.
 * @param x The x-coordinate of the upper left corner of the window.
 * @param y The y-coordinate of the upper left corner of the window.
 * @param w The width of the window in pixels.
 * @param h The height of the window in pixels.
 * @return VNWindow The window that was created.
 */
WindowManager.prototype.createWindow=function(x,y,w,h)
{
	var w_=new VNWindow(this,x,y,w,h);
	w_.setOnTop();
	this.windows[this.windows.length]=w_;
	return w_;
};

/**
 * This method creates a new info window with the specified size and title. The info window, is centered, blocks the other windows, and closes if you click outside the window.
 * @param w The width of the window in pixels.
 * @param h The height of the window in pixels.
 * @param title The title of the window.
 * @return VNWindow The window that was created.
 */
WindowManager.prototype.infoWindow=function(w,h,title)
{
	 var w_=this.createWindow(0,0,w,h);
	 w_.setCanClose(true);
	 w_.setTitle(title);
	 this.blockWindow(w_,true);
     w_.center();
	 return w_;
};

WindowManager.prototype.openFileWindow=function(title,txt,onOpen)
{
	var w=this.createWindow(0,0,400,200);
	w.setCanClose(true);
	w.setTitle(title);
	this.blockWindow(w,false);
    w.center();
	
	var dv=w.getContentDiv();
	var d=document.createElement('div');
	dv.appendChild(d);
	dv.style.backgroundColor='rgba(128,128,128,0.8)';
	d.style.top='10px';
	d.style.width='100%';
	d.style.position='absolute';
	d.style.touchAction='none';
	
	
	var dnd=document.createElement('div');
	dnd.style.position='absolute';
	dnd.style.width='100px';
	dnd.style.height='100px';
	dnd.style.top='5px';
	dnd.style.left='5px';
	dnd.style.backgroundColor='rgb(255,255,255)';
	dnd.style.border='2px';
	dnd.style.borderStyle='dashed';
	dv.appendChild(dnd);
	
	
	var button=document.createElement('div');
	button.style.background='url("'+(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/img/upload_icon.png")';
	button.style.backgroundSize='cover';
	button.style.overflow='hidden';
	button.style.width='50px';
	button.style.height='50px';
	button.style.left='30px'
	button.style.top='27px';
	button.style.position='absolute';
	button.style.cursor='pointer';
	dnd.appendChild(button);
	
	var inp=document.createElement('input');
	inp.type='file';
	inp.name='upload';
	inp.multiple='1';
	inp.style.display='block';
    inp.style.opacity='0';
    inp.style.overflow='hidden';
	inp.style.width='50px';
	inp.style.height='50px';
	inp.style.cursor='pointer';
	inp.onchange=function(){dnd.style.background = 'rgb(116,116,225)';var files = event.target.files;onOpen(files);};
	button.appendChild(inp);
	
	var text=document.createElement('div');
	text.style.position='absolute';
	text.style.top='5px';
	text.style.left='114px';
	text.style.width='281px';
	text.style.height='104px';
	text.style.textAlign='center';
	text.style.lineHeight='14px';
	text.style.verticalAlign='middle';	
	text.style.fontFamily='Arial';
	text.style.color='rgb(255,255,255)';
	text.style.textShadow='-1px -1px 0px #5b6178';
	text.style.fontWeight='bold';
	text.style.fontSize='14px';
	text.style.textDecoration='none';
	text.innerHTML=txt;
	dv.appendChild(text);
	
	var decoration_width=w.getWidth()-parseInt(dv.clientWidth);
	var decoration_height=w.getHeight()-parseInt(dv.clientHeight);
	w.setSize(decoration_width+400,decoration_height+114);
	w.center();
	
	dnd.ondragleave=function(event){this.style.background = 'rgb(255,255,255)';button.style.background='url("'+(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/img/upload_icon.png")';button.style.backgroundSize='cover';
	};
	dnd.ondragover = function (event) { event.dataTransfer.dropEffect='copy'; this.style.background = 'rgb(116,116,225)'; button.style.background='url("'+(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/img/upload_icon_inverted.png")';button.style.backgroundSize='cover';
	 event.stopPropagation();return false; };
	dnd.ondragend = function () {  return false; };
	dnd.ondrop = function (event) {
		event.preventDefault && event.preventDefault();
		var files = event.dataTransfer.files;
		onOpen(files);
		return false;
	};

	return w;
};

WindowManager.prototype.uploadFileWindow=function(title,txt,url,onStart,onFinish)
{
	var w=this.openFileWindow(title,txt,function(files){
	
		onStart(files);
	
		var file=files[0];
		if ('name' in file) var fileName = file.name;else var fileName = file.fileName;
        if ('size' in file) var fileSize = file.size;else var fileSize = file.fileSize;
			
	
		var boundary="visineat-----------------------" + (new Date).getTime();
	var CRLF = "\r\n";
	var SEPARATOR="--"+boundary+CRLF;
	var END="--"+boundary+"--"+CRLF;
	
	var message=SEPARATOR+'Content-Disposition: form-data; name="'+"field"+'"'+CRLF+CRLF+"value"+CRLF;
		message+=SEPARATOR+'Content-Disposition: form-data; name="file"; filename="'+fileName+'"'+CRLF;
		message+="Content-Type: application/octet-stream"+CRLF+CRLF;
		//data
	var	message2=CRLF+END;
	
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4) {
		w.close();
		onFinish(xmlhttp);
        }
    };
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
	
	var reader = new FileReader();
	reader.onload = function(e) {
		var data=new Uint8Array(e.target.result);
		var ui8a=new Uint8Array(message.length+data.length+message2.length);
		for (var i = message.length-1; i>=0 ; i--) ui8a[i] = (message.charCodeAt(i) & 0xff);
		ui8a.set(data,message.length);
		var offset=message.length+data.length;
		for (var i = message2.length-1; i>=0 ; i--) ui8a[i+offset] = (message2.charCodeAt(i) & 0xff);
		var d=w.getContentDiv();
		while (d.hasChildNodes()) d.removeChild(d.lastChild);
		
		var dnd=document.createElement('div');
		dnd.style.width='100px';
		dnd.style.height='100px';
		dnd.style.margin='5px auto 0px';
		dnd.style.background='url("'+(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/img/loading.gif")';
		dnd.style.backgroundSize='cover';
		dnd.style.overflow='hidden';
		d.appendChild(dnd);
		
		
		xmlhttp.send(ui8a);
	};
	reader.readAsArrayBuffer(file);
	
	
	
	});
	
};

/**
 * This method creates a new console window at the specified position and size. The console window can printout text in a black and white console screen.
 * @param x The x-coordinate of the upper left corner of the window.
 * @param y The y-coordinate of the upper left corner of the window.
 * @param w The width of the window in pixels.
 * @param h The height of the window in pixels.
 * @return VNConsoleWindow The console window that was created.
 */
WindowManager.prototype.createConsole=function(x,y,w,h)
{
	var w_=this.createWindow(x,y,w,h);
	w_.setTitle('Console '+this.version);
	w_.setScrollerY(true);
	c=new VNConsoleWindow(w_.getContentDiv(),w_);
	return c;
};

/**
 * This method creates a new browser window at the specified position and size. The browser window contains an iframe that shows another website.
 * @param x The x-coordinate of the upper left corner of the window.
 * @param y The y-coordinate of the upper left corner of the window.
 * @param w The width of the window in pixels.
 * @param h The height of the window in pixels.
 * @param url The url of a website.
 * @return VNWindow The window that was created.
 */
WindowManager.prototype.createBrowser=function(x,y,w,h,url)
{
	var w_=this.createWindow(x,y,w,h);
	var from=0;
	if(url.indexOf('http://www.')==0)
		from=11;
	else if(url.indexOf('http://')==0)
		from=7;
		
	w_.setTitle(url.substring(from));
	var i=document.createElement('iframe');
	i.style.width='100%';
	i.style.height='100%';
	i.src=url;
	w_.iframe=i;
	w_.getContentDiv().appendChild(i);
	
	return w_;
};

/**
 * This method creates a new window with icons of apps. The window, is as large as the container of the WindowManage, it is centered, blocks the other windows, and closes if you click outside the window.
 * @param title The title of the window.
 * @return VNAppMenuWindow The window that was created.
 */
WindowManager.prototype.createIconMenuWindow=function(title)
{
	return new VNAppMenuWindow(this,title);
};

/**
 * This method installs a web app under the control of this WindowManager. The web app is given as a path to a folder that contains main.js and icon.png, which will be loaded later only when necessary.
 * @param path The path of the web app.
 * @param title An optional title of the web app.
 * @return VNApp The app object that was created.
 */
WindowManager.prototype.installApp=function(path,title)
{
	return new VNApp(this,path,title);
};

WindowManager.prototype.createDesktopButton=function(x,y,w,h)
{
	var b_=new VNButton(this,x,y,w,h);
	this.buttons[this.buttons.length]=b_;
	return b_;
};

WindowManager.prototype.createWindowToggleButton=function(x,y,w,h,win)
{
 var b=this.createDesktopButton(x,y,w,h);
 b.setIsToggleButton(true);
 b.w=win;
 win.hide();
 win.onClose=function(win){b.setToggleState(false);win.hide();return false;};
 b.onclick=function(bt)
 {
	if(bt.isPressed())
	{
		bt.w.show();
	}
	else bt.w.hide();
 };
 return b;
};

/**
 * Returns the currently selected/focused window.
 * @return VNWindow The selected window.
 */
WindowManager.prototype.getSelectedWindow=function(){return this.selected_window;};

/**
 * Sets the focus to a particular window.
 * @param w The VNWindow to be selected/focused.
 */
WindowManager.prototype.setSelectedWindow=function(w)
{
	if(this.selected_window==w) return;
	
	if(this.selected_window!=null)
	{
		this.selected_window.setSelected(false);
		this.selected_window=null;
	}
	
	if(w!=null)
	{
		if(!w.isSelected()) w.setSelected(true);
		this.selected_window=w;
		this.selected_window.setOnTop();
	}
};

WindowManager.prototype.getDraggingWindow=function(){return this.dragging_window;};

WindowManager.prototype.setDraggingWindow=function(w)
{
	this.dragging_window=w;
};

WindowManager.prototype.getResizingWindow=function(){return this.resizing_window;};

WindowManager.prototype.setResizingWindow=function(w)
{
	this.resizing_window=w;
};

WindowManager.prototype.handleMouseUp=function()
{
	this.dragging_window=null;
	this.resizing_window=null;
};

WindowManager.prototype.handleMouseMove=function(x,y)
{
	if(this.dragging_window!=null)
		this.dragging_window.handleTitleMouseMove(x,y);
	if(this.resizing_window!=null)
		this.resizing_window.handleBorderMouseMove(x,y);
};

/**
 * This method sets an optional main app object in order to be accessible from all windows controlled by the WindowManager object.
 * @param app The object of your main web app.
 */
WindowManager.prototype.setMainApp=function(app){this.app=app;};

/**
 * This method returns your main app object, which was previously set using the setMainApp().
 * @return Object The object of your main web app.
 */
WindowManager.prototype.getMainApp=function(){return this.app;};

/**
 * This class creates and handles a window. You can easily modify the content of a window using the getContentDiv() method.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var win=new VNWindow(wm,100,100,400,300);<br>
 * win.setTitle('My window');<br>
 * var window_div=win.getContentDiv();<br></font>
 * @param manager The WindowManager object that controls the window system.
 * @param x The x-coordinate of the upper left corner of the window.
 * @param y The y-coordinate of the upper left corner of the window.
 * @param w The width of the window in pixels.
 * @param h The height of the window in pixels.
 */
function VNWindow(manager,x,y,w,h)
{
	this.manager=manager;
	this.div_container=this.manager.div_container;
	
	this.border_size=15;
	this.visible_border_size=5;
	this.title_size=25;
	
	this.width=w;
	if(this.width<(this.border_size+this.title_size)*2)this.width=(this.border_size+this.title_size)*2;
	if(this.width>parseInt(this.div_container.clientWidth))this.width=parseInt(this.div_container.clientWidth);
		
	this.height=h;
	if(this.height<this.border_size+this.title_size+this.border_size-this.visible_border_size)this.height=this.border_size+this.title_size+this.border_size-this.visible_border_size;
	if(this.height>parseInt(this.div_container.clientHeight))this.height=parseInt(this.div_container.clientHeight);
	
	this.left=x;
	if(this.left+this.width>parseInt(this.div_container.clientWidth))this.left=Math.max(parseInt(this.div_container.clientWidth)-this.width,0);
	
	this.top=y;
	if(this.top+this.height>parseInt(this.div_container.clientHeight))this.top=Math.max(parseInt(this.div_container.clientHeight)-this.height,0);
	
	
	this.title='';
	this.is_selected=false;
	this.is_movable=true;
	this.is_resizableX=true;
	this.is_resizableY=true;
	this.is_closable=true;
	this.is_minimizable=false;
	this.is_minimized=false;
	
	//window_div
	this.window_div=document.createElement('div');
	this.div_container.appendChild(this.window_div);
	this.window_div.style.position='absolute';
	this.window_div.style.width=this.width+'px';
	this.window_div.style.height=this.height+'px';
	this.window_div.style.left=this.left+'px';
	this.window_div.style.top=this.top+'px';
	this.window_div.style.borderRadius='5px 5px 0px 0px';
	this.window_div.style.touchAction='none';
	this.window_div.style.overflow='hidden';
	
	//border_top_div
	this.border_top_div=document.createElement('div');
	this.window_div.appendChild(this.border_top_div);
	this.border_top_div.style.position='absolute';
	this.border_top_div.style.width=(this.width-this.border_size*4)+'px';
	this.border_top_div.style.height=(this.border_size-this.visible_border_size)+'px';
	this.border_top_div.style.left=(this.border_size*2)+'px';
	this.border_top_div.style.top='0px';
	this.border_top_div.style.touchAction='none';
	this.border_top_div.style.cursor='ns-resize';
	
	//border_top_left_div
	this.border_top_left_div=document.createElement('div');
	this.window_div.appendChild(this.border_top_left_div);
	this.border_top_left_div.style.position='absolute';
	this.border_top_left_div.style.width=(this.border_size*2)+'px';
	this.border_top_left_div.style.height=(this.border_size*2)+'px';
	this.border_top_left_div.style.left='0px';
	this.border_top_left_div.style.top='0px';
	this.border_top_left_div.style.touchAction='none';
	this.border_top_left_div.style.cursor='nw-resize';
	
	//border_top_right_div
	this.border_top_right_div=document.createElement('div');
	this.window_div.appendChild(this.border_top_right_div);
	this.border_top_right_div.style.position='absolute';
	this.border_top_right_div.style.width=(this.border_size*2)+'px';
	this.border_top_right_div.style.height=(this.border_size*2)+'px';
	this.border_top_right_div.style.left=(this.width-this.border_size*2)+'px';
	this.border_top_right_div.style.top='0px';
	this.border_top_right_div.style.touchAction='none';
	this.border_top_right_div.style.cursor='ne-resize';
	
	//title_div
	this.title_div=document.createElement('div');
	this.window_div.appendChild(this.title_div);
	this.title_div.style.position='absolute';
	this.title_div.style.width=(this.width-2*(this.border_size-this.visible_border_size)-2)+'px';
	this.title_div.style.height=(this.title_size-2)+'px';
	this.title_div.style.left=(this.border_size-this.visible_border_size)+'px';
	this.title_div.style.top=(this.border_size-this.visible_border_size)+'px';
	this.title_div.style.borderRadius='5px 5px 0px 0px';
	this.title_div.style.border='1px solid #3d3d53';
	this.title_div.style.touchAction='none';
	this.title_div.style.background='-webkit-gradient(linear, left top, left bottom, color-stop(0.05, '+this.manager.default_title_backgroundColor+'), color-stop(1, '+this.manager.default_title_backgroundColor2+'))';
	this.title_div.style.background='-moz-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
	this.title_div.style.background='-webkit-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
	this.title_div.style.background='-o-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
	this.title_div.style.background='-ms-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
	this.title_div.style.background='linear-gradient(to bottom, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
	
	//title_text_div
	this.title_text_div=document.createElement('div');
	this.title_div.appendChild(this.title_text_div);
	this.title_text_div.style.position='absolute';
	this.title_text_div.style.width=(this.width-2*(this.border_size-this.visible_border_size))+'px';
	this.title_text_div.style.height=(this.title_size-2)+'px';
	this.title_text_div.style.left='0px';
	this.title_text_div.style.top='0px';
	this.title_text_div.style.borderRadius='5px 5px 0px 0px';
	this.title_text_div.style.touchAction='none';
	this.title_text_div.style.textAlign='center';
	this.title_text_div.style.lineHeight=this.title_size+'px';
	this.title_text_div.style.verticalAlign='middle';	
	this.title_text_div.style.fontFamily='Arial';//'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif';
	this.title_text_div.style.color=this.manager.default_title_fontColor;
	this.title_text_div.style.textShadow=this.manager.default_title_textShadow;
	this.title_text_div.style.fontWeight='bold';//'700';
	this.title_text_div.style.fontSize='15px';//'14px';
	this.title_text_div.style.textDecoration='none';
	this.title_text_div.style.overflow='hidden';
	
	//title_cover_div
	this.title_cover_div=document.createElement('div');
	this.title_div.appendChild(this.title_cover_div);
	this.title_cover_div.style.position='absolute';
	this.title_cover_div.style.width=(this.width-2*(this.border_size-this.visible_border_size))+'px';
	this.title_cover_div.style.height=(this.title_size-2)+'px';
	this.title_cover_div.style.left='0px';
	this.title_cover_div.style.top='0px';
	this.title_cover_div.style.borderRadius='5px 5px 0px 0px';
	this.title_cover_div.style.touchAction='none';
	
	var close_rad=Math.floor((this.title_size-this.visible_border_size)/2);
	
	//close_div
	this.close_div=document.createElement('div');
	this.title_cover_div.appendChild(this.close_div);
	this.close_div.style.position='absolute';
	this.close_div.style.width=(close_rad*2)+'px';
	this.close_div.style.height=(close_rad*2)+'px';
	this.close_div.style.left=(this.width-2*(this.border_size-this.visible_border_size)-this.title_size)+'px';
	this.close_div.style.top=Math.floor(this.visible_border_size/2)+'px';
	this.close_div.style.backgroundImage=this.manager.default_close_icon;
	this.close_div.style.backgroundSize='contain';
	this.close_div.style.backgroundRepeat='no-repeat';
	//this.close_div.style.borderRadius=close_rad+'px';
	//this.close_div.style.borderWidth='2px';
	//this.close_div.style.borderStyle='solid';
	//this.close_div.style.borderColor='rgb(255,255,255)';
	this.close_div.style.touchAction='none';
	this.close_div.style.cursor='pointer';
	
	//minimize_div
	this.minimize_div=document.createElement('div');
	this.title_cover_div.appendChild(this.minimize_div);
	this.minimize_div.style.position='absolute';
	this.minimize_div.style.width=(close_rad*2)+'px';
	this.minimize_div.style.height=(close_rad*2)+'px';
	this.minimize_div.style.left=(this.visible_border_size)+'px';
	this.minimize_div.style.top=Math.floor(this.visible_border_size/2)+'px';
	this.minimize_div.style.backgroundImage=this.manager.default_minimize_icon;
	this.minimize_div.style.backgroundSize='contain';
	this.minimize_div.style.backgroundRepeat='no-repeat';
	//this.minimize_div.style.borderRadius=close_rad+'px';
	//this.minimize_div.style.borderWidth='2px';
	//this.minimize_div.style.borderStyle='solid';
	//this.minimize_div.style.borderColor='rgb(255,255,255)';
	this.minimize_div.style.touchAction='none';
	this.minimize_div.style.display='none';
	this.minimize_div.style.cursor='pointer';
	
	
	//visible_border_left_div
	this.visible_border_left_div=document.createElement('div');
	this.window_div.appendChild(this.visible_border_left_div);
	this.visible_border_left_div.style.position='absolute';
	this.visible_border_left_div.style.width=this.visible_border_size+'px';
	this.visible_border_left_div.style.height=(this.height-this.title_size-this.border_size-(this.border_size-this.visible_border_size))+'px';
	this.visible_border_left_div.style.left=(this.border_size-this.visible_border_size)+'px';
	this.visible_border_left_div.style.top=(this.title_size+this.border_size-this.visible_border_size)+'px';
	this.visible_border_left_div.style.backgroundColor=this.manager.default_border_color;
	this.visible_border_left_div.style.touchAction='none';
	
	//border_left_div
	this.border_left_div=document.createElement('div');
	this.window_div.appendChild(this.border_left_div);
	this.border_left_div.style.position='absolute';
	this.border_left_div.style.width=this.border_size+'px';
	this.border_left_div.style.height=(this.height-this.title_size-this.border_size*2-(this.border_size-this.visible_border_size))+'px';
	this.border_left_div.style.left='0px';
	this.border_left_div.style.top=(this.title_size+this.border_size-this.visible_border_size)+'px';
	this.border_left_div.style.touchAction='none';
	this.border_left_div.style.cursor='ew-resize';
	
	//visible_border_right_div
	this.visible_border_right_div=document.createElement('div');
	this.window_div.appendChild(this.visible_border_right_div);
	this.visible_border_right_div.style.position='absolute';
	this.visible_border_right_div.style.width=this.visible_border_size+'px';
	this.visible_border_right_div.style.height=(this.height-this.title_size-this.border_size-(this.border_size-this.visible_border_size))+'px';
	this.visible_border_right_div.style.left=(this.width-this.border_size)+'px';
	this.visible_border_right_div.style.top=(this.title_size+this.border_size-this.visible_border_size)+'px';
	this.visible_border_right_div.style.backgroundColor=this.manager.default_border_color;
	this.visible_border_right_div.style.touchAction='none';
	
	//border_right_div
	this.border_right_div=document.createElement('div');
	this.window_div.appendChild(this.border_right_div);
	this.border_right_div.style.position='absolute';
	this.border_right_div.style.width=this.border_size+'px';
	this.border_right_div.style.height=(this.height-this.title_size-this.border_size*2-(this.border_size-this.visible_border_size))+'px';
	this.border_right_div.style.left=(this.width-this.border_size)+'px';
	this.border_right_div.style.top=(this.title_size+this.border_size-this.visible_border_size)+'px';
	this.border_right_div.style.touchAction='none';
	this.border_right_div.style.cursor='ew-resize';
	
	//visible_border_bottom_div
	this.visible_border_bottom_div=document.createElement('div');
	this.window_div.appendChild(this.visible_border_bottom_div);
	this.visible_border_bottom_div.style.position='absolute';
	this.visible_border_bottom_div.style.width=(this.width-(this.border_size-this.visible_border_size)*2)+'px';
	this.visible_border_bottom_div.style.height=this.visible_border_size+'px';
	this.visible_border_bottom_div.style.left=(this.border_size-this.visible_border_size)+'px';
	this.visible_border_bottom_div.style.top=(this.height-this.border_size)+'px';
	this.visible_border_bottom_div.style.backgroundColor=this.manager.default_border_color;
	this.visible_border_bottom_div.style.touchAction='none';
	
	//border_bottom_div
	this.border_bottom_div=document.createElement('div');
	this.window_div.appendChild(this.border_bottom_div);
	this.border_bottom_div.style.position='absolute';
	this.border_bottom_div.style.width=(this.width-this.border_size*4)+'px';
	this.border_bottom_div.style.height=this.border_size+'px';
	this.border_bottom_div.style.left=(this.border_size*2)+'px';
	this.border_bottom_div.style.top=(this.height-this.border_size)+'px';
	this.border_bottom_div.style.touchAction='none';
	this.border_bottom_div.style.cursor='ns-resize';
	
	//border_bottom_left_div
	this.border_bottom_left_div=document.createElement('div');
	this.window_div.appendChild(this.border_bottom_left_div);
	this.border_bottom_left_div.style.position='absolute';
	this.border_bottom_left_div.style.width=(this.border_size*2)+'px';
	this.border_bottom_left_div.style.height=(this.border_size*2)+'px';
	this.border_bottom_left_div.style.left='0px';
	this.border_bottom_left_div.style.top=(this.height-this.border_size*2)+'px';
	this.border_bottom_left_div.style.touchAction='none';
	this.border_bottom_left_div.style.cursor='sw-resize';
	
	//border_bottom_right_div
	this.border_bottom_right_div=document.createElement('div');
	this.window_div.appendChild(this.border_bottom_right_div);
	this.border_bottom_right_div.style.position='absolute';
	this.border_bottom_right_div.style.width=(this.border_size*2)+'px';
	this.border_bottom_right_div.style.height=(this.border_size*2)+'px';
	this.border_bottom_right_div.style.left=(this.width-this.border_size*2)+'px';
	this.border_bottom_right_div.style.top=(this.height-this.border_size*2)+'px';
	this.border_bottom_right_div.style.touchAction='none';
	this.border_bottom_right_div.style.cursor='se-resize';
	
	//content_div
	this.content_div=document.createElement('div');
	this.window_div.appendChild(this.content_div);
	this.content_div.style.position='absolute';
	this.content_div.style.width=(this.width-this.border_size*2)+'px';
	this.content_div.style.height=(this.height-this.border_size-this.title_size-(this.border_size-this.visible_border_size))+'px';
	this.content_div.style.left=this.border_size+'px';
	this.content_div.style.top=(this.title_size+this.border_size-this.visible_border_size)+'px';
	this.content_div.style.backgroundColor='rgb(255,255,255)';
	this.content_div.style.overflowX='hidden';
	this.content_div.style.overflowY='hidden';
	
	this.offset_x=0;
	this.offset_y=0;
	this.memory_x=0;
	this.memory_y=0;
	this.memory_width=0;
	this.memory_height=0;
	this.is_moving=false;
	this.is_resizing=false;
	this.resizing_border_id=0;
	this.touch_operated=false;
 
	var self=this;	
	
	//title_div events:
	this.title_div.addEventListener('mousemove',function(event){event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY; self.handleTitleMouseMove(x,y);},false);
	this.title_div.addEventListener('mouseup',function(event){self.handleTitleMouseUp();},false);
	this.title_div.addEventListener('mousedown',function(event){if(this.touch_operated)return;if(event.target==self.close_div){event.preventDefault();event.stopPropagation();self.close();return;}else if(event.target==self.minimize_div){self.minmax();return;}event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY;self.handleTitleMouseDown(x,y);},false);
	this.title_div.addEventListener('touchstart',function(event){this.touch_operated=true;if(event.target==self.close_div){event.preventDefault();event.stopPropagation();self.close();return;}else if(event.target==self.minimize_div){self.minmax();return;}event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;} self.handleTitleMouseMove(x,y);self.handleTitleMouseDown(x,y);},false);
	this.title_div.addEventListener('touchend',function(event){self.handleTitleMouseUp();},false);
	this.title_div.addEventListener('touchmove',function(event){event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;}self.handleTitleMouseMove(x,y);},false);
	
	//border divs events:
	this.window_div.addEventListener('mousemove',function(event){if(!self.isBorder(event.target))return;event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY; self.handleBorderMouseMove(x,y);},false);
	this.window_div.addEventListener('mouseup',function(event){self.handleBorderMouseUp();},false);
	this.window_div.addEventListener('mousedown',function(event){self.setSelected(true);if(!self.isBorder(event.target))return;if(self.touch_operated)return;self.resizing_border_id=self.getBorderId(event.target);event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY;self.handleBorderMouseDown(x,y);},false);
	this.window_div.addEventListener('touchstart',function(event){self.setSelected(true);if(!self.isBorder(event.target))return;self.touch_operated=true;self.resizing_border_id=self.getBorderId(event.target);event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;} self.handleBorderMouseMove(x,y);self.handleBorderMouseDown(x,y);},false);
	this.window_div.addEventListener('touchend',function(event){self.handleBorderMouseUp();},false);
	this.window_div.addEventListener('touchmove',function(event){if(!self.isBorder(event.target))return;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;}self.handleBorderMouseMove(x,y);},false);
	
};

VNWindow.prototype.isBorder=function(div)
{
	if(div==this.border_left_div||div==this.border_right_div||div==this.border_bottom_div||div==this.border_bottom_left_div||div==this.border_bottom_right_div||div==this.border_top_div||div==this.border_top_left_div||div==this.border_top_right_div)
		return true;
	else
		return false;
};

VNWindow.prototype.getBorderId=function(div)
{
	if(div==this.border_left_div)
		return 1;
	else if(div==this.border_right_div)
		return 2;
	else if(div==this.border_bottom_div)
		return 3;	
	else if(div==this.border_bottom_left_div)
		return 4;
	else if(div==this.border_bottom_right_div)
		return 5;
	else if(div==this.border_top_div)
		return 6;	
	else if(div==this.border_top_left_div)
		return 7;
	else if(div==this.border_top_right_div)
		return 8;
	else
		return 0;
};

/**
 * Returns the div element inside the window.
 * @return Element The div element in which you can place the contents of this window.
 */
VNWindow.prototype.getContentDiv=function(){return this.content_div;};

/** 
 * Applies to the content div a pre-set style with black semi-transparent background and white Arial fonts. 
 */
VNWindow.prototype.applyBlackTransparentPreset=function()
{
	this.content_div.style.backgroundColor='rgba(0,0,0,0.4)';
	this.content_div.style.color='rgb(255,255,255)';
	this.content_div.style.fontFamily='Arial';
};


/** 
 * Sets this window on top of the others.
 */
VNWindow.prototype.setOnTop=function()
{
	this.manager.zIndex+=1;
	this.window_div.style.zIndex=this.manager.zIndex;
};

/** 
 * Returns a boolean that indicates if this window is movable.
 * @return boolean 
 */
VNWindow.prototype.canMove=function(){return this.is_movable;};
/** 
 * Sets if this window is movable.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setCanMove=function(flag){this.is_movable=flag;};
/** 
 * Returns a boolean that indicates if this window is resizable.
 * @return boolean 
 */
VNWindow.prototype.canResize=function(){return this.is_resizableX || this.is_resizableY;};
/** 
 * Returns a boolean that indicates if this window is resizable along X.
 * @return boolean 
 */
VNWindow.prototype.canResizeX=function(){return this.is_resizableX;};
/** 
 * Returns a boolean that indicates if this window is resizable along Y.
 * @return boolean 
 */
VNWindow.prototype.canResizeY=function(){return this.is_resizableY;};
/** 
 * Sets if this window is resizable along X.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setCanResizeX=function(flag){this.setCanResize(flag,this.is_resizableY);};
/** 
 * Sets if this window is resizable along Y.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setCanResizeY=function(flag){this.setCanResize(this.is_resizableX,flag);};
/** 
 * Sets if this window is resizable.
 * @param flagx A boolean flag that indicates if the window is resizable along x.
 * @param flagy A boolean flag that indicates if the window is resizable along y. (Optional argument) If this argument is missing then it takes the value of the first argument.
 */
VNWindow.prototype.setCanResize=function(flagx,flagy)
{
	this.is_resizableX=flagx;
	if(typeof flagy !=='undefined')
		this.is_resizableY=flagy;
	else
		this.is_resizableY=flagx;
		
	if(this.is_resizableX && this.is_resizableY)
	{
		this.border_left_div.style.cursor='ew-resize';
		this.border_right_div.style.cursor='ew-resize';
		this.border_bottom_div.style.cursor='ns-resize';
		this.border_bottom_left_div.style.cursor='sw-resize';
		this.border_bottom_right_div.style.cursor='se-resize';
		this.border_top_div.style.cursor='ns-resize';
		this.border_top_left_div.style.cursor='nw-resize';
		this.border_top_right_div.style.cursor='ne-resize';
	}
	else if(this.is_resizableX)
	{
		this.border_left_div.style.cursor='ew-resize';
		this.border_right_div.style.cursor='ew-resize';
		this.border_bottom_div.style.cursor='auto';
		this.border_bottom_left_div.style.cursor='ew-resize';
		this.border_bottom_right_div.style.cursor='ew-resize';
		this.border_top_div.style.cursor='auto';
		this.border_top_left_div.style.cursor='ew-resize';
		this.border_top_right_div.style.cursor='ew-resize';
	}
	else if(this.is_resizableY)
	{
		this.border_left_div.style.cursor='auto';
		this.border_right_div.style.cursor='auto';
		this.border_bottom_div.style.cursor='ns-resize';
		this.border_bottom_left_div.style.cursor='ns-resize';
		this.border_bottom_right_div.style.cursor='ns-resize';
		this.border_top_div.style.cursor='ns-resize';
		this.border_top_left_div.style.cursor='ns-resize';
		this.border_top_right_div.style.cursor='ns-resize';
	}
	else
	{
		this.border_left_div.style.cursor='auto';
		this.border_right_div.style.cursor='auto';
		this.border_bottom_div.style.cursor='auto';
		this.border_bottom_left_div.style.cursor='auto';
		this.border_bottom_right_div.style.cursor='auto';
		this.border_top_div.style.cursor='auto';
		this.border_top_left_div.style.cursor='auto';
		this.border_top_right_div.style.cursor='auto';
	}
};

/** 
 * Returns a boolean that indicates if this window can be closed.
 * @return boolean 
 */
VNWindow.prototype.canClose=function(){return this.is_closable;};
/** 
 * Sets if this window can be closed.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setCanClose=function(flag)
{
	this.is_closable=flag;
	if(this.is_closable)
		this.close_div.style.display='block';
	else this.close_div.style.display='none';
};
/** 
 * Toggles the minimize/maximize state of the window
 */
VNWindow.prototype.minmax=function()
{
	this.setSelected(true);
	if(this.is_minimized)
		this.expand();
	else
		this.minimize();
};

/** 
 * Minimizes the window.
 */
VNWindow.prototype.minimize=function()
{
	this.is_minimized=true;
	this.minimize_div.style.backgroundImage=this.manager.default_expand_icon;
	this.window_div.style.height=(this.title_size+this.border_size-this.visible_border_size)+'px';
	this.onMinimize(this);
};

/** 
 * A callback function that is called when a window is minimized. It is initially empty.
 */
VNWindow.prototype.onMinimize=function(w){};

/** 
 * Returns a boolean that indicates if this window can be minimized.
 * @return boolean 
 */
VNWindow.prototype.canMinimize=function(){return this.is_minimizable;};
/** 
 * Sets if this window can be minimized.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setCanMinimize=function(flag)
{
	this.is_minimizable=flag;
	if(this.is_minimizable)
		this.minimize_div.style.display='block';
	else
	{
		this.is_minimized=false;
		this.minimize_div.style.backgroundImage=this.manager.default_minimize_icon;
		this.window_div.style.height=this.height+'px';
		this.minimize_div.style.display='none';
	}
};

/** 
 * Returns a boolean that indicates if this window is minimized.
 * @return boolean 
 */
VNWindow.prototype.isMinimized=function(){return this.is_minimized;};

/** 
 * Expands the window.
 */
VNWindow.prototype.expand=function()
{
	this.is_minimized=false;
	this.minimize_div.style.backgroundImage=this.manager.default_minimize_icon;
	this.window_div.style.height=this.height+'px';
	this.onExpand(this);
};

/** 
 * A callback function that is called when a window is expanded. It is initially empty.
 */
VNWindow.prototype.onExpand=function(w){};

/** 
 * Hides the window.
 */
VNWindow.prototype.hide=function()
{
	this.window_div.style.display='none';
};

/** 
 * Shows the window.
 */
VNWindow.prototype.show=function()
{
	this.window_div.style.display='block';
};

/** 
 * Sets if this window has a scroll bar along x.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setScrollerX=function(flag)
{
	if(flag)
		this.content_div.style.overflowX='scroll';
	else
		this.content_div.style.overflowX='hidden';
};

/** 
 * Sets if this window has a scroll bar along y.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setScrollerY=function(flag)
{
	if(flag)
		this.content_div.style.overflowY='scroll';
	else
		this.content_div.style.overflowY='hidden';
};

/** 
 * Closes this window.
 */
VNWindow.prototype.close=function()
{
	if(this.onClose(this))this.destroy();
};

/** 
 * A callback function that is called when a window is closed. It is initially empty.
 * @return boolean Your function should return true if you allow the window to close, or false otherwise.
 */
VNWindow.prototype.onClose=function(w){return true;};

/** 
 * Destroys this window immediately bypassing the closing process. The onclose callback will not be called.
 */
VNWindow.prototype.destroy=function()
{
	if(this.manager.getSelectedWindow()==this)
		this.manager.setSelectedWindow(null);
	
	this.manager.deleteWindow(this);
	
	this.div_container.removeChild(this.window_div);
};

/** 
 * A callback function that is called when the window is selected. It is initially empty.
 */
VNWindow.prototype.onFocus=function(w){};

/** 
 * Sets if this window is focused.
 * @param flag A boolean flag.
 */
VNWindow.prototype.setSelected=function(flag)
{
	if(this.is_selected==flag) return;
	
	if(flag) this.onFocus(this);
	
	this.is_selected=flag;
	if(this.is_selected)
	{
		this.title_div.style.background='-webkit-gradient(linear, left top, left bottom, color-stop(0.05, '+this.manager.default_title_selectedColor+'), color-stop(1, '+this.manager.default_title_selectedColor2+'))';
		this.title_div.style.background='-moz-linear-gradient(top, '+this.manager.default_title_selectedColor+' 5%, '+this.manager.default_title_selectedColor2+' 100%)';
		this.title_div.style.background='-webkit-linear-gradient(top, '+this.manager.default_title_selectedColor+' 5%, '+this.manager.default_title_selectedColor2+' 100%)';
		this.title_div.style.background='-o-linear-gradient(top, '+this.manager.default_title_selectedColor+' 5%, '+this.manager.default_title_selectedColor2+' 100%)';
		this.title_div.style.background='-ms-linear-gradient(top, '+this.manager.default_title_selectedColor+' 5%, '+this.manager.default_title_selctedColor2+' 100%)';
		this.title_div.style.background='linear-gradient(to bottom, '+this.manager.default_title_selectedColor+' 5%, '+this.manager.default_title_selectedColor2+' 100%)';
	}
	else
	{
		this.title_div.style.background='-webkit-gradient(linear, left top, left bottom, color-stop(0.05, '+this.manager.default_title_backgroundColor+'), color-stop(1, '+this.manager.default_title_backgroundColor2+'))';
		this.title_div.style.background='-moz-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
		this.title_div.style.background='-webkit-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
		this.title_div.style.background='-o-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
		this.title_div.style.background='-ms-linear-gradient(top, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
		this.title_div.style.background='linear-gradient(to bottom, '+this.manager.default_title_backgroundColor+' 5%, '+this.manager.default_title_backgroundColor2+' 100%)';
	}	
	if(this.is_selected && this.manager!=null)
		this.manager.setSelectedWindow(this);
};

/** 
 * Returns a boolean that indicates if the window is selected/focused.
 * @return boolean.
 */
VNWindow.prototype.isSelected=function(){return this.is_selected;};

/** 
 * Sets the title of the window.
 * @param title A string that contains the title.
 */
VNWindow.prototype.setTitle=function(title)
{
	this.title=title;
	this.title_text_div.innerHTML=this.title;
};

/** 
 * Returns the current title of the window.
 * @return string The title of the window.
 */
VNWindow.prototype.getTitle=function(){return this.title;};

/** 
 * Sets the position of this window.
 * @param x The x-coordinate of the upper left corner of the window.
 * @param y The y-coordinate of the upper left corner of the window.
 */
VNWindow.prototype.setPosition=function(x,y)
{
	this.left=x;
	if(this.left+this.width>parseInt(this.div_container.clientWidth))this.left=Math.max(parseInt(this.div_container.clientWidth)-this.width,0);
	
	this.top=y;
	if(this.top+this.height>parseInt(this.div_container.clientHeight))this.top=Math.max(parseInt(this.div_container.clientHeight)-this.height,0);
	
	
	this.window_div.style.left=this.left+'px';
	this.window_div.style.top=this.top+'px';
};

/** 
 * Returns the position of the window.
 * @return Array An Array of size 2 with the x and y coordinates of the window.
 */
VNWindow.prototype.getPosition=function(){return [this.left,this.top];};

/** 
 * Sets the size of this window.
 * @param w The width of the window in pixels.
 * @param h The height of the window in pixels.
 */
VNWindow.prototype.setSize=function(w,h)
{
	this.width=w;
	if(this.width<(this.border_size+this.title_size)*2)this.width=(this.border_size+this.title_size)*2;
	if(this.width>parseInt(this.div_container.clientWidth))this.width=parseInt(this.div_container.clientWidth);
	
	this.height=h;
	if(this.height<this.border_size+this.title_size+this.border_size-this.visible_border_size)this.height=this.border_size+this.title_size+this.border_size-this.visible_border_size;
	if(this.height>parseInt(this.div_container.clientHeight))this.height=parseInt(this.div_container.clientHeight);
	
	this.window_div.style.width=this.width+'px';
	this.window_div.style.height=this.height+'px';
	
	this.border_top_div.style.width=(this.width-4*this.border_size)+'px';
	this.border_top_right_div.style.left=(this.width-this.border_size*2)+'px';
	this.title_div.style.width=(this.width-2*(this.border_size-this.visible_border_size)-2)+'px';
	this.title_cover_div.style.width=(this.width-2*(this.border_size-this.visible_border_size))+'px';
	this.title_text_div.style.width=(this.width-2*(this.border_size-this.visible_border_size))+'px';
	this.close_div.style.left=(this.width-2*(this.border_size-this.visible_border_size)-this.title_size)+'px';
	this.content_div.style.width=(this.width-this.border_size*2)+'px';
	this.content_div.style.height=(this.height-this.border_size-this.title_size-(this.border_size-this.visible_border_size))+'px';
	this.border_left_div.style.height=(this.height-this.border_size*2-this.title_size-(this.border_size-this.visible_border_size))+'px';
	this.visible_border_left_div.style.height=(this.height-this.title_size-this.border_size-(this.border_size-this.visible_border_size))+'px';
	this.border_right_div.style.height=(this.height-this.border_size*2-this.title_size-(this.border_size-this.visible_border_size))+'px';
	this.border_right_div.style.left=(this.width-this.border_size)+'px';
	this.visible_border_right_div.style.height=(this.height-this.title_size-this.border_size-(this.border_size-this.visible_border_size))+'px';
	this.visible_border_right_div.style.left=(this.width-this.border_size)+'px';
	this.border_bottom_div.style.width=(this.width-4*this.border_size)+'px';
	this.border_bottom_div.style.top=(this.height-this.border_size)+'px';
	this.visible_border_bottom_div.style.width=(this.width-(this.border_size-this.visible_border_size)*2)+'px';
	this.visible_border_bottom_div.style.top=(this.height-this.border_size)+'px';
	this.border_bottom_left_div.style.top=(this.height-this.border_size*2)+'px';
	this.border_bottom_right_div.style.top=(this.height-this.border_size*2)+'px';
	this.border_bottom_right_div.style.left=(this.width-this.border_size*2)+'px';
	
	this.onResize(this);
};

/** 
 * A callback function that is called when the window is resized. It is initially empty.
 */
VNWindow.prototype.onResize=function(w){};

/** 
 * Returns the size of the window.
 * @return Array An Array of size 2 with the width and height of the window in pixels.
 */
VNWindow.prototype.getSize=function(){return [this.width,this.height];};
/** 
 * Returns the width of the window in pixels.
 * @return int The width of the window in pixels.
 */
VNWindow.prototype.getWidth=function(){return this.width;};
/** 
 * Returns the height of the window in pixels.
 * @return int The height of the window in pixels.
 */
VNWindow.prototype.getHeight=function(){return this.height;};

/** 
 * Centers the window inside the area of the window manager.
 */
VNWindow.prototype.center=function()
{
	this.setPosition(Math.floor((this.manager.getWidth()-this.width)/2),Math.floor((this.manager.getHeight()-this.height)/2));
};

VNWindow.prototype.handleTitleMouseUp=function()
{
	this.is_moving=false;
	this.title_cover_div.style.cursor='auto';
};

VNWindow.prototype.handleTitleMouseDown=function(x,y)
{
	//this.setSelected(true);
	if(!this.is_movable)return;
	this.manager.setDraggingWindow(this);
	this.is_moving=true;
	this.title_cover_div.style.cursor='move';
	this.offset_x=x[0]-parseInt(this.window_div.style.left);
	this.offset_y=y[0]-parseInt(this.window_div.style.top);
};

VNWindow.prototype.handleTitleMouseMove=function(x,y)
{
	if(this.is_moving)
	{
		this.left=x[0]-this.offset_x;
		this.top=y[0]-this.offset_y;
		this.window_div.style.left=this.left+'px';
		this.window_div.style.top=this.top+'px';		
	}
};

VNWindow.prototype.handleBorderMouseUp=function()
{
	this.is_resizing=false;
	this.resizing_border_id=0;
};

VNWindow.prototype.handleBorderMouseDown=function(x,y)
{
	if(!this.is_resizableX && !this.is_resizableY) return;
	else if(!this.is_resizableX && (this.resizing_border_id==1 || this.resizing_border_id==2))return;
	else if(!this.is_resizableY && (this.resizing_border_id==3 || this.resizing_border_id==6))return;
	this.manager.setResizingWindow(this);
	this.memory_x=x[0];
	this.memory_y=y[0];
	this.memory_width=this.width;
	this.memory_height=this.height;
	this.is_resizing=true;
	this.offset_x=x[0]-parseInt(this.window_div.style.left);
	this.offset_y=y[0]-parseInt(this.window_div.style.top);
};

VNWindow.prototype.handleBorderMouseMove=function(x,y)
{
	if(this.is_resizing)
	{
		if(this.resizing_border_id==1)
		{
			var w=this.width;
			this.setSize(this.memory_width-x[0]+this.memory_x,this.memory_height);
			if(w!=this.width) this.window_div.style.left=(x[0]-this.offset_x)+'px';
		}
		else if(this.resizing_border_id==2)
		{
			this.setSize(this.memory_width+x[0]-this.memory_x,this.memory_height);
		}
		else if(this.resizing_border_id==3)
		{
			this.setSize(this.memory_width,this.memory_height+y[0]-this.memory_y);
		}
		else if(this.resizing_border_id==4)
		{
			if(!this.is_resizableX) x[0]=this.memory_x;
			if(!this.is_resizableY) y[0]=this.memory_y;
			var w=this.width;
			this.setSize(this.memory_width-x[0]+this.memory_x,this.memory_height+y[0]-this.memory_y);
			if(w!=this.width) this.window_div.style.left=(x[0]-this.offset_x)+'px';
		}
		else if(this.resizing_border_id==5)
		{
			if(!this.is_resizableX) x[0]=this.memory_x;
			if(!this.is_resizableY) y[0]=this.memory_y;
			this.setSize(this.memory_width+x[0]-this.memory_x,this.memory_height+y[0]-this.memory_y);
		}
		else if(this.resizing_border_id==6)
		{
			var h=this.height;
			this.setSize(this.memory_width,this.memory_height-y[0]+this.memory_y);
			if(h!=this.height) this.window_div.style.top=(y[0]-this.offset_y)+'px';
		}
		else if(this.resizing_border_id==7)
		{
			if(!this.is_resizableX) x[0]=this.memory_x;
			if(!this.is_resizableY) y[0]=this.memory_y;
			var h=this.height;
			var w=this.width;
			this.setSize(this.memory_width-x[0]+this.memory_x,this.memory_height-y[0]+this.memory_y);
			if(h!=this.height) this.window_div.style.top=(y[0]-this.offset_y)+'px';
			if(w!=this.width) this.window_div.style.left=(x[0]-this.offset_x)+'px';
		}
		else if(this.resizing_border_id==8)
		{
			if(!this.is_resizableX) x[0]=this.memory_x;
			if(!this.is_resizableY) y[0]=this.memory_y;
			var h=this.height;
			this.setSize(this.memory_width+x[0]-this.memory_x,this.memory_height-y[0]+this.memory_y);
			if(h!=this.height) this.window_div.style.top=(y[0]-this.offset_y)+'px';
		}
	}
};

/**
 * This class creates and handles a console window. You can print to the console using the println method.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var c=new VNConsoleWindow(div);<br>
 * c.println('Hello World!');<br></font>
 * @param div_container The div Element that will contain the console.
 * @param wind The VNWindow object that contains the console. (Optional argument)
 */
function VNConsoleWindow(div_container,wind)
{
	this.div_container=div_container;
	this.win=null;
	if (typeof wind !== "undefined") this.win=wind;
	this.div_container.style.backgroundColor='rgb(0,0,0)';
	this.div_container.style.cursor='text';
	this.text_container=document.createElement('div');
	this.text_container.style.fontFamily='"Courier New", Courier, monospace';
	this.text_container.style.fontSize='14px';
	this.text_container.style.color='rgb(255,255,255)';
	this.div_container.appendChild(this.text_container);
	

	this.text_input=document.createElement('input');
	this.text_input.style.height='18px';
	
	this.text_input.style.width='100%';
	this.text_input.style.padding='0px';
	this.text_input.style.border='0px';
	this.text_input.style.fontFamily='"Courier New", Courier, monospace';
	this.text_input.style.fontSize='14px';
	this.text_input.style.color='rgb(255,255,255)';
	this.text_input.style.backgroundColor='rgb(0,0,0)';
	this.text_input.style.outline='none';
	this.text_input.style.webkitAppearance='none';
	this.text_input.setAttribute( "autocomplete", "off" );
	this.text_input.setAttribute( "autocorrect", "off" );
	this.text_input.setAttribute( "autocapitalize", "off" );
	this.text_input.setAttribute( "spellcheck", "false" );
	this.text_input.value='> ';
	var self=this;
	this.text_input.onkeydown=function(e){return self.onkeydown(e);};
	this.div_container.appendChild(this.text_input);
	
	this.div_container.onclick=function(e){if(e.target==self.div_container)self.text_input.focus();};
	
	this.console_lines=null;
	this.echo_in_console=false;
	this.last_command_typed=new Array();
	this.last_command_index=0;
	this.print_commands=true;
	this.init();
}

VNConsoleWindow.prototype.getCaretPosition=function() 
{

  // Initialize
  var iCaretPos = 0;

  // IE Support
  if (document.selection) {

    // To get cursor position, get empty selection range
    var oSel = document.selection.createRange();

    // Move selection start to 0 position
    oSel.moveStart('character', -this.text_input.value.length);

    // The caret position is selection length
    iCaretPos = oSel.text.length;
  }

  // Firefox support
  else if (this.text_input.selectionStart || this.text_input.selectionStart == '0')
    iCaretPos = this.text_input.selectionStart;

  // Return results
  return iCaretPos;
};

VNConsoleWindow.prototype.focus=function()
{
	/*if(this.getCaretPosition()<2)
	{
		if(this.text_input.createTextRange) {
			this.text_input.focus();
			var range = this.text_input.createTextRange();
            range.move('character', 2);
            range.select();
	    }
        else {
            if(this.text_input.selectionStart) {
                this.text_input.focus();
                this.text_input.setSelectionRange(2, 2);
	        }
            else
                this.text_input.focus();
        }
	}
	else*/ this.text_input.focus();
};

VNConsoleWindow.prototype.onkeydown=function(e)
{
	if(this.getCaretPosition()<2)
		return false;
	
	if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
	if (keyCode == '13'){//enter
		if(this.print_commands)this.println(this.text_input.value);
		this.div_container.scrollTop = this.div_container.scrollHeight;
		this.last_command_typed.push(this.text_input.value.substring(2));
		this.last_command_index=0;
		if(!this.onCommandEntered(this.last_command_typed[this.last_command_typed.length-1]))
			this.error('Unknown command: '+this.last_command_typed[this.last_command_typed.length-1]);
		this.text_input.value='> ';
		this.div_container.scrollTop = this.div_container.scrollHeight
		return false;
	}
	else if(keyCode == '38'){//up
		if(this.last_command_typed.length==0) return false;
		this.last_command_index+=1;
		if(this.last_command_typed.length<this.last_command_index)this.last_command_index=this.last_command_typed.length;
		this.text_input.value='> '+this.last_command_typed[this.last_command_typed.length-this.last_command_index];
		return false;
	}
	else if(keyCode == '40'){//down
		if(this.last_command_typed.length==0) return false;
		this.last_command_index-=1;
		if(this.last_command_index<=0){this.last_command_index=0; this.text_input.value='> ';return false;}
		this.text_input.value='> '+this.last_command_typed[this.last_command_typed.length-this.last_command_index];
		return false;
	}
	else if(keyCode == '37'){//left
		if(this.getCaretPosition()<3)return false;
	}
	else if(keyCode == '8'){//back space
		if(this.getCaretPosition()<3)return false;
	}
	else if(keyCode == '8'){//back space
    	if(this.text_input.value.length==2)
			return false;
	}
};

/**
 * Sends a POST http request to a given URL address with a set of input arguments and the response is expected in XML format. A custom callback function is called when the response is received.
 * @param url A string with the URL.
 * @param data An array of input arguments with values given as [['arg1','value1'],['arg2','value2'],...]
 * @param callback A callback function that will be notified when the response is received. The received XML object is passed as argument in the callback function.
 */
VNConsoleWindow.prototype.postCommand=function(url,data,callback)
{
	var xmlhttp;
	if (window.XMLHttpRequest) xmlhttp=new XMLHttpRequest();
	else xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	xmlhttp.onreadystatechange=function()
  	{
		if (xmlhttp.readyState==4)
		{
			if(xmlhttp.status==200) callback(xmlhttp.responseXML);
			else callback(null);
		}
	};
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	var msg="";
	if(typeof data!=='undefined' && data.length>0)
	{
		msg=data[0][0]+"="+data[0][1];
		for(var i=1;i<data.length;i++)
		msg+="&"+data[i][0]+"="+data[i][1];
	}
    xmlhttp.send(msg);
};

/**
 * Enables or disables the command prompt. The default value is true.
 * @param flag A boolean that contains the desired status.
 */
VNConsoleWindow.prototype.setPromptEnabled=function(flag){if(flag){this.text_input.style.display='block';this.text_input.focus();}else this.text_input.style.display='none';};

/** 
 * A callback function that is called when a command is typed by the user in the command prompt. It is initially empty.
 * @param command A string that contains the command typed by the user.
 * @return boolean Return false if the command is unknown, otherwise return true.
 */
VNConsoleWindow.prototype.onCommandEntered=function(command){return true;};

/**
 * Enables or disables the printing of entered commands. The default value is true.
 * @param flag A boolean that contains the desired status.
 */
VNConsoleWindow.prototype.setPrintCommandsEntered=function(flag){this.print_commands=flag;};

/**
 * Returns the window object of the console.
 * @return VNWindow
 */
VNConsoleWindow.prototype.getWindow=function(){return this.win;};

/**
 * Enables/disables the echo of the println messages to the JavaScript console.
 * @param flag boolean 
 */
VNConsoleWindow.prototype.setEchoInConsole=function(flag){this.echo_in_console=flag;};

/**
 * Returns the width of the console in pixels.
 * @return int The width in pixels.
 */
VNConsoleWindow.prototype.getWidth=function()
{
	return this.div_container.clientWidth;
};

/**
 * Returns the height of the console in pixels.
 * @return int The height in pixels.
 */
VNConsoleWindow.prototype.getHeight=function()
{
	return this.div_container.clientHeight;
};

/**
 * Prints the given text in the console and then brakes the line.
 * @param txt The text to be printed.
 */
VNConsoleWindow.prototype.println=function(txt)
{
	this.text_container.innerHTML+=txt+"<br>";
	//this.div_container.scrollTop = this.div_container.scrollHeight;
};

/**
 * Prints the given error message in the console and then brakes the line.
 * @param txt The text to be printed as an error message.
 */
VNConsoleWindow.prototype.error=function(txt)
{
	this.text_container.innerHTML+="<span style='color:rgb(255,128,128);'> ERROR> "+txt+"<br>";
};

/**
 * Clears the console window.
 */
VNConsoleWindow.prototype.clear=function()
{
	this.text_container.innerHTML="";
};

VNConsoleWindow.prototype.init=function()
{
	var self=this;
	window.addEventListener('error', function(e) { 
		  self.error(e.message+' '+e.filename.substring(e.filename.lastIndexOf('/')+1)+' '+e.lineno+' '+e.colno);
		  console.log(e);
		  return true;
		}, false);
	
	
	var d=''+new Date();
	var i=d.indexOf('GMT');
	if(i>-1) d=d.substring(0,i-1);
	this.println(d);
	this.println('---- Console started ----');
};
	

function VNButton(manager,x,y,w,h)
{
	this.manager=manager;
	this.div_container=this.manager.div_container;
	
	this.width=w;
	this.height=h;
	
	this.left=x;
	this.top=y;
	this.label='';
		
	this.is_toggle_button=false;
	this.toggle_state=false;
	
	//shadow_div
	this.shadow_div=document.createElement('div');
	this.div_container.appendChild(this.shadow_div);
	this.shadow_div.style.position='absolute';
	this.shadow_div.style.width=(this.width+1)+'px';
	this.shadow_div.style.height=(this.height+1)+'px';
	this.shadow_div.style.left=(this.left+2)+'px';
	this.shadow_div.style.top=(this.top+2)+'px';
	var rad=Math.min(Math.floor(this.width/2),Math.floor(this.height/2));
	this.shadow_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
	this.shadow_div.style.touchAction='none';
	this.shadow_div.style.overflow='hidden';
	this.shadow_div.style.backgroundColor='rgba(128,128,128,0.5)';
	this.shadow_div.style.zIndex=0;
	
	//button_div
	this.button_div=document.createElement('div');
	this.div_container.appendChild(this.button_div);
	this.button_div.style.position='absolute';
	this.button_div.style.width=this.width+'px';
	this.button_div.style.height=this.height+'px';
	this.button_div.style.left=this.left+'px';
	this.button_div.style.top=this.top+'px';
	this.button_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
	this.button_div.style.touchAction='none';
	this.button_div.style.overflow='hidden';
	this.button_div.style.backgroundColor=this.manager.default_button_backgroundColor;
	this.shadow_div.style.zIndex=0;
	
		//text_div
	this.text_div=document.createElement('div');
	this.button_div.appendChild(this.text_div);
	this.text_div.style.position='absolute';
	this.text_div.style.width=this.width+'px';
	this.text_div.style.height=this.height+'px';
	this.text_div.style.left='0px';
	this.text_div.style.top='0px';
	this.text_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
	this.text_div.style.touchAction='none';
	this.text_div.style.textAlign='center';
	this.text_div.style.lineHeight=this.height+'px';
	this.text_div.style.verticalAlign='middle';
	this.text_div.style.fontFamily=this.manager.default_button_fontFamily;
	this.text_div.style.color=this.manager.default_button_fontColor;
	this.text_div.style.fontWeight=this.manager.default_button_fontWeight;
	this.text_div.style.fontSize=Math.floor(this.height/2)+'px';
	
	//cover_div
	this.cover_div=document.createElement('div');
	this.button_div.appendChild(this.cover_div);
	this.cover_div.style.position='absolute';
	this.cover_div.style.width=this.width+'px';
	this.cover_div.style.height=this.height+'px';
	this.cover_div.style.left='0px';
	this.cover_div.style.top='0px';
	this.cover_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
	this.cover_div.style.touchAction='none';
	
	this.touch_operated=false;
	var self=this;	
	
	this.cover_div.addEventListener('mousedown',function(event){if(this.touch_operated)return;event.preventDefault();self.click();},false);
	this.cover_div.addEventListener('touchstart',function(event){this.touch_operated=true;event.preventDefault();self.click();},false);
};

VNButton.prototype.isToggleButton=function(){return this.is_toggle_button;};

VNButton.prototype.setPosition=function(x,y)
{
	this.left=x;
	this.top=y;
	this.button_div.style.left=this.left+'px';
	this.button_div.style.top=this.top+'px';
	this.shadow_div.style.left=(this.left+2)+'px';
	this.shadow_div.style.top=(this.top+2)+'px';
};

VNButton.prototype.setImage=function(value)
{
	this.button_div.style.backgroundImage=value;
	this.button_div.style.backgroundSize='cover';
};

VNButton.prototype.square=function()
{
	this.shadow_div.style.borderRadius='0px 0px 0px 0px';
	this.button_div.style.borderRadius='0px 0px 0px 0px';
	this.text_div.style.borderRadius='0px 0px 0px 0px';
	this.cover_div.style.borderRadius='0px 0px 0px 0px';
};

VNButton.prototype.round=function()
{
	var rad=Math.min(Math.floor(this.width/2),Math.floor(this.height/2));
	this.shadow_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
	this.button_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
	this.text_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
	this.cover_div.style.borderRadius=rad+'px '+rad+'px '+rad+'px '+rad+'px';
};

VNButton.prototype.setIsToggleButton=function(flag)
{
	this.is_toggle_button=flag;
	this.toggle_state=false;
	this.cover_div.style.backgroundColor='';
};

VNButton.prototype.isPressed=function(){return this.toggle_state;};


VNButton.prototype.setToggleState=function(flag)
{
	if(this.is_toggle_button)
	{
		if(!flag)
		{
			this.toggle_state=false;
			this.cover_div.style.backgroundColor='';
		}
		else
		{
			this.toggle_state=true;
			this.cover_div.style.backgroundColor=this.manager.default_button_pressedColor;
		}
	}
}

VNButton.prototype.click=function()
{
	if(this.is_toggle_button)
	{
		if(this.toggle_state)
		{
			this.toggle_state=false;
			this.cover_div.style.backgroundColor='';
		}
		else
		{
			this.toggle_state=true;
			this.cover_div.style.backgroundColor=this.manager.default_button_pressedColor;
		}
	}
	else this.cover_div.style.backgroundColor=this.manager.default_button_pressedColor;
	this.onclick(this);
	var self=this;
	if(!this.is_toggle_button) setTimeout(function(){self.cover_div.style.backgroundColor='';}, 200);
};

VNButton.prototype.onclick=function(b){};

VNButton.prototype.setLabel=function(label)
{
	this.label=label;
	this.text_div.innerHTML=this.label;
};

/**
 * This class implements a web app. The web app is given as a path to a folder that contains main.js and icon.png, which will be loaded later only when necessary.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var wm=new WindowManager('my_div');<br>
 * var app=wm.installApp('http://www.visineat.com/js/apps/system_info/','System Info');<br>
 * app.start(function(app){new SystemInfoApp(app);});<br></font>
 * @param wm The WindowManager that will control this app.
 * @param path The path of the web app.
 * @param title An optional title of the web app.
 */
function VNApp(wm,path,title)
{
	this.wm=wm;
	this.title=title;
	this.path=path;
	this.src=this.path+'main.js';
	this.icon=this.path+'icon.png';
	if(typeof this.wm.apps !== 'undefined'){}
	else{this.wm.apps=new Object();}
}
/** 
 * This method sets the path of the folder that contains the web app.
 * @param url The path of the web app.
 */
VNApp.prototype.setPath=function(url){this.path=url;this.src=this.path+'main.js';this.icon=this.path+'icon.png';};
/** 
 * This method sets the icon of the web app.
 * @param url The path of the image.
 */
VNApp.prototype.setIcon=function(url){this.icon=url;};
/** 
 * This method sets the url of the main JavaScript of the web app.
 * @param url The path of the JavaScript file.
 */
VNApp.prototype.setSrc=function(url){this.src=url;};
/** 
 * This method returns the WindowManager object that controls this app.
 * @return WindowManager The WindowManager object.
 */
VNApp.prototype.getWindowManager=function(){return this.wm;};
/**
 * This method returns your main app object, which was previously set using the WindowManager.setMainApp().
 * @return Object The object of your main web app.
 */
VNApp.prototype.getMainApp=function(){return this.wm.getMainApp();};
/**
 * This method starts the web app. If this is the first time that the app runs, it first downloads the corresponding JavaScript file and then calls the given callback function.
 * @param onLoad The callback function that will be called in order to start your web app. 
 */
VNApp.prototype.start=function(onLoad)
{
  if(typeof this.wm.apps[this.src]!=='undefined')
  {
	onLoad(this);
	return;
  }
  
  var self=this;
  var s,
      r,
      t;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.onload = s.onreadystatechange = function() {
    if ( !r && (!this.readyState || this.readyState == 'complete') )
    {
	  self.wm.apps[self.src]=new Object();
      r = true;
      onLoad(self);
    }
  };
  s.src = this.src;
  t = document.getElementsByTagName('script')[0];
  t.parentNode.insertBefore(s, t);
};

/**
 * This class creates a window with web app icons.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var wm=new WindowManager('my_div');<br>
 * var menu=wm.createIconMenuWindow('App Menu');<br>
 * menu.addIcon('demo_icon.png','Demo App',function(){start_demo();});<br>
 * menu.addApp('http://www.visineat.com/js/apps/system_info/','System Info',function(app){new SystemInfoApp(app);});<br></font>
 * @param window_manager The WindowManager object that controls this window.
 * @param title The title of the window to be created.
 */
function VNAppMenuWindow(window_manager,title)
{
	this.wm=window_manager;
	var appwin=window_manager.createWindow(0,0,window_manager.getWidth()-40,window_manager.getHeight()-40);
	window_manager.blockWindow(appwin,true);
	appwin.setTitle(title);
	appwin.setCanResize(false);
	appwin.setCanMove(false);
	appwin.setScrollerY(true);
	this.win=appwin;
	this.div_container=appwin.getContentDiv();
	this.div_container.style.backgroundColor='rgba(0,0,0,0.4)';
	
	var decoration_width=appwin.getWidth()-parseInt(this.div_container.clientWidth);
	var rem=(appwin.getWidth()-decoration_width)%120;
	appwin.setSize(appwin.getWidth()-rem,appwin.getHeight());
	appwin.center();
	this.win=appwin;
}
/**
 * Returns the window object of the VNAppMenuWindow.
 * @return VNWindow
 */
VNAppMenuWindow.prototype.getWindow=function(){return this.win;};
/** 
 * This method returns the WindowManager object that controls this app.
 * @return WindowManager The WindowManager object.
 */
VNAppMenuWindow.prototype.getWindowManager=function(){return this.wm;};
/** 
 * This adds a new icon to the VNAppMenuWindow using the given image and label.
 * @param icon_url The URL of the image
 * @param label The label of the icon.
 * @param onstart The callback function that will be called when the user clicks the icon.
 * @return VNAppMenuItem The object that was created.
 */
VNAppMenuWindow.prototype.addIcon=function(icon_url,label,onstart)
{
	var a=new VNAppMenuItem(this,icon_url,label);
	if(typeof onstart !== 'undefined') a.onStart=onstart;
	return a;
};
/** 
 * This adds a new web app to the VNAppMenuWindow using the given path and label.
 * @param path The path to the folder that contains the web app, including the main.js and icon.png 
 * @param label The title of the web app.
 * @param onstart The callback function that will be called when the user starts the web app.
 * @return VNApp The VNApp object that was created.
 */
VNAppMenuWindow.prototype.addApp=function(path,label,onstart)
{
	var a=this.getWindowManager().installApp(path,label);
	var b=new VNAppMenuItem(this,path+'icon.png',label);
	if(typeof onstart !== 'undefined') b.onStart=function(){a.start(onstart);};
	return a;
};

function VNAppMenuItem(app_menu,icon_url,label)
{
	this.app_menu=app_menu;
	var d=document.createElement('div');
	d.style.float='left';
	d.style.width='120px';
	d.style.height='120px';
	this.div_container=d;
	app_menu.div_container.appendChild(this.div_container);
	this.icon_url=icon_url;
	d=document.createElement('div');
	d.style.position='absolute';
	d.style.width='70px';
	d.style.height='70px';
	d.style.backgroundColor='rgba(0,0,0,0.1)';
	d.style.backgroundImage='url('+icon_url+')';
	d.style.backgroundSize='contain';
	d.style.backgroundRepeat='no-repeat';
	d.style.borderRadius='10px';
	d.style.margin='25px';
	d.style.cursor='pointer';
	this.div_container.appendChild(d);
	this.image_div=d;
	var self=this;
	this.image_div.addEventListener('click',function(event){event.stopPropagation();self.app_menu.win.close();self.onStart(self);},false);
	
	d=document.createElement('div');
	d.style.top='0px';
	d.style.left='0px';
	d.style.width='110px';
	d.style.touchAction='none';
	d.style.textAlign='center';
	d.style.lineHeight='12px';
	d.style.verticalAlign='middle';	
	d.style.fontFamily='Arial';
	d.style.color='rgb(255,255,255)';
	d.style.textShadow='-1px -1px 0px #5b6178';
	d.style.fontWeight='bold';
	d.style.fontSize='12px';
	d.style.textDecoration='none';
	d.style.margin='95px 5px 5px 5px';
	d.innerHTML=label;
	this.div_container.appendChild(d);
	this.label_div=d;
}

VNAppMenuItem.prototype.onStart=function(){};