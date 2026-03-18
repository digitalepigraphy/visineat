/* V1.14
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
 * This is the main class of the VN API. One global object of this class is created and accessible under the name "vn". 
 * Therefore, all methods of this class are accessible by "vn.methodname". To run an application with the fully loaded VN API,
 * you need to run it using "vn.run(my_applicaton);", where "my_application" is the main function of your application.
 */
function VisiNeatAPI()
{
	this.libs={};
	this.hostname="www.visineat.com";
	this.hosturl=(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+this.hostname+'/';
	//this.hosturl='';//uncomment this line to run it locally from a folder js and subfolder js/vn/
	this.version='1.14';
	this.cloud_threads=4;
	this.lib_versions={
	"vn.utils":"1",
	"vn.cloud":"6",
	"vn.webgl":"5",
	"vn.windows":"6",
	"vn.gui":"4",
	"vn.server":"3",
	"vn.media":"3",
	"vn.kinect":"3",
	"vn.human-avatar":"3",
	"vn.text-editor":"6",
	"vn.animation":"1",
	"vn.documentation":"3",
	"vn.gui-tree":"2",
	"vn.gui-circles":"1",
	"vn.cloud-encoder":"1"
	};
	
	this.lib_index=[
	"vn.utils",
	"vn.webgl",
	"vn.windows",
	"vn.gui",
	"vn.server",
	"vn.media",
	"vn.gui-tree",
	"vn.cloud"
	];
	
	this.progress=new VNProgress();
}

VisiNeatAPI.prototype._init=function()
{
	this.cloud=new VNCloud();
};
/**
 * This method returns the default window manager object (if exists) which creates and controls a window system. 
 * You can easily create and handle window elements using the createWindow() method (see WindowManager class). 
 * A default window manager is automatically created when the body of your HTML document is empty. 
 * Otherwise a window manager is generated after calling the method setScreen(). <br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var wm=vn.getWindowManager();<br>
 * var win=wm.createWindow({left:100,top:100,width:400,height:300});<br>
 * win.setTitle('My window');<br>
 * var window_div=win.getContentDiv();<br></font>
 * @return WindowManager The default window manager object, if exists. If not, the method setScreen() must be called prior to getWindowManager().
 */
VisiNeatAPI.prototype.getWindowManager=function(){
	if(this._wm){}
	else
	{
	   document.body.style.margin='0px';
	   this._screen=document.createElement('div');
	   vn.set(this._screen.style,{position:'absolute',top:'0px',left:'0px',right:'0px',bottom:'0px',overflow:'hidden',backgroundColor:'rgb(0,0,0)'});
	   document.body.appendChild(this._screen);
	   this._wm=new WindowManager(this._screen);
	}
	
	return this._wm;};
/**
 * This method sets a div element as the main area for the VN API and creates a WindowManager to operate within this area.
 * @param div A div element or a string with the id of an existing element.
 */
VisiNeatAPI.prototype.setScreen=function(div){
	if(typeof div=='string')this._screen=document.getElementById(div);
	else this._screen=div;
	this._wm=new WindowManager(this._screen);
};
/**
 * This method returns the div container that covers the entire area of the browser window or another area that you have set using setScreen(). You can use it to append children elements to it.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var div=vn.getScreen();<br></font>
 * @return div A div element that covers the entire area of the browser window.
 */
VisiNeatAPI.prototype.getScreen=function(){
	
	if(this._screen){}
	else
	{
	   document.body.style.margin='0px';
	   this._screen=document.createElement('div');
	   vn.set(this._screen.style,{position:'absolute',top:'0px',left:'0px',right:'0px',bottom:'0px',overflow:'hidden',backgroundColor:'rgb(0,0,0)'});
	   document.body.appendChild(this._screen);
	   this._wm=new WindowManager(this._screen);
	}
	
	return this._screen;
};
/**
 * This method runs asynchronously a given function after having loaded first the core components of the VN API. It can be used in the onload attribute of the html body element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * &lt;body onload="vn.run(my_application);"&gt;<br></font>
 * @param program A given function, which is typically the main function of an application.
 */
VisiNeatAPI.prototype.run=function(program,options){
	
  var opt=options||{};

  if(opt.loadingLogo||opt.loadingLogoWhite)
  {
	  var l=document.createElement('div');
	  vn.set(l.style,{
	  position:'absolute',
	  left:'0px',
	  top:'0px',
	  bottom:'0px',
	  right:'0px',
	  overflow:'hidden',
	  background:'#000000'
	  });
	  if(opt.loadingLogoWhite)l.style.background='#ffffff';
	  document.body.appendChild(l);
	  var c=document.createElement('div');
	  vn.set(c.style,{
	  position:'absolute',
	  left:'50%',
	  top:'50%',
	  width:'100%',
	  height:'100%'
	  });
	  l.appendChild(c);
	  var a=document.createElement('div');
	  vn.set(a.style,{position:'absolute',
	  width:'128px',
	  height:'128px',
	  top:'-64px',
	  left:'-64px'});
	  c.appendChild(a);  
	 
	  var i=document.createElement('img');
	  i.src=vn.hosturl+"js/img/VNlogo128.gif";
	  if(opt.loadingLogoWhite)i.src=vn.hosturl+"js/img/VNlogo128white.gif";
	  a.appendChild(i);
	  
	  var t=document.createElement('div');
	  vn.set(t.style,{width:'100%',height:'20px',textAlign:'center',color:'#ffffff',fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif'});
	  if(opt.loadingLogoWhite)t.style.color='#000000';
	  t.innerHTML='Loading...';
	  a.appendChild(t);
	  
	 
	  var p=document.createElement('div');
	  vn.set(p.style,{width:'100%',height:'3px',background:'#222222',position:'absolute',margin:'10px 0px',boxShadow:'0px 0px 5px white'});
	  if(opt.loadingLogoWhite)p.style.background='#aaaaaa';
	  a.appendChild(p);
	  
	  var p2=document.createElement('div');
	  vn.set(p2.style,{width:'0%',height:'3px',background:'rgb(128,98,165)',position:'absolute',left:'0px',top:'0px'});
	  p.appendChild(p2);
	  
	  var pr=vn.getProgress();
	  pr.whenProgress().then(function(p)
	  {
			p2.style.width=(p.getValue()+p.getIncrement())*99+'%';
			p2.style.display='block';
			//t.innerHTML='Loading... '+Math.floor((p.getValue()+p.getIncrement())*99)+'%';
	  });
		
	  pr.whenDone().then(function(p)
	  {
		 p2.style.display='none';
	  });
	  this.removeLoadingLogo=function(){document.body.removeChild(l);};
  }
  else this.removeLoadingLogo=function(){};
	
	var self=this;
	vn.progress.oneMoreToDo();
	vn.http(vn.hosturl+'js/vn/cloud-encoder-'+this.lib_versions['vn.cloud-encoder']+'.js').then(function(request){
		vn.progress.oneMoreDone();
		self._cloud_encoder=URL.createObjectURL(new Blob([request.response]));
		self.init_p=self.init_p||self._import();self.init_p.then(function(){self._init();program();});
	});
	
	};

/**
 * This method returns a global progress object that can be used to track the overall cumulative status of several asynchronous processes.
 * @return VNProgress A global progress object.
 */
VisiNeatAPI.prototype.getProgress=function(){return this.progress;};
/**
 * This method imports one or more JS files to your application and returns a promise object that is triggered when the importing process has finished. All non-core VN libraries can be imported as "vn.libname".
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * vn.import(["vn.kinect","my_library.js","another_script.js"]).then(function(){<br>
 * ...<br>
 * }).catch(function(){<br>
 * ...<br>
 * });<br></font>
 * @param libs A string, or an array of strings with the paths or URLs to the script files.
 * @return VNPromise A promise object that is triggered with the completion of the import process. 
 */
VisiNeatAPI.prototype.import=function(src){return this._import(src,true);};

VisiNeatAPI.prototype._import=function(src,first)
{
	var p=new VNPromise();
	if(typeof src==='undefined')
	{
		if(document.location.hostname==this.hostname)
		{
			vn.progress.oneMoreToDo(this.lib_index.length);
			this._import(this.lib_index).then(function(){p.callThen();}).catch(function(){p.callCatch();});
			return p;
		}
		else 
		{
			vn.progress.oneMoreToDo(this.lib_index.length);
			this._import(this.lib_index).then(function(){p.callThen();}).catch(function(){p.callCatch();});
			return p;
		}
	}
	else
	{
	if(typeof src==='string') 
	{
		if(first)vn.progress.oneMoreToDo();
		this.importSingleScript(src).then(function(){vn.progress.oneMoreDone();p.callThen();}).catch(function(){vn.progress.oneMoreDone();p.callCatch();});
		return p;
	}
	else
	{
		if(src.length==1)
		{
			if(first)vn.progress.oneMoreToDo();
			this.importSingleScript(src[0]).then(function(){vn.progress.oneMoreDone();p.callThen();}).catch(function(){vn.progress.oneMoreDone();p.callCatch();});
		 	return p;
		 }
		else
		{
			if(first)vn.progress.oneMoreToDo(src.length);
			var src1=src[0];
			var src2=[];
			for(var i=1;i<src.length;i++)src2.push(src[i]);
			var self=this;
			this.importSingleScript(src1).then(function(){vn.progress.oneMoreDone();self._import(src2).then(function(){p.callThen();}).catch(function(){p.callCatch();});}).catch(function(){vn.progress.oneMoreDone();self._import(src).then(function(){p.callCatch();}).catch(function(){p.callCatch();});});
			return p;
		}
	}
	}
};

/**
 * This method returns true if a given JS file has been imported to your application. 
 * @param lib A string with the path or URL to a script file.
 * @return Boolean The loading status of this script file. 
 */
VisiNeatAPI.prototype.imported=function(src)
{
  if(typeof this.libs[src]!=='undefined') return true; else return false;
};

VisiNeatAPI.prototype.importSingleLib=function(src)
{
	var s=src;
	if(this.lib_versions[src])s+='-'+this.lib_versions[src];
	return this.importSingleScript(this.hosturl+'js/'+s.replace('.','/')+'.js');
};

VisiNeatAPI.prototype.importSingleScript=function(src)
{
  if(src.indexOf('vn.')==0)
  {
	  return this.importSingleLib(src);
  }

	
  var p=new VNPromise();
   
  if(typeof this.libs[src]!=='undefined')
  {
	p.callThen();
	return p;
  }
  var self=this;
  var s,
      r,
      t;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.onerror= function(){
	p.callCatch();  
  };
  s.onload = s.onreadystatechange = function() {
	if ( !r && (!document.readyState || document.readyState == 'complete' || document.readyState == 'loaded') )
    {
	  self.libs[src]=new Object();
      r = true;
      p.callThen();
    }
  };
  s.src = src;
  t = document.getElementsByTagName('script')[0];
  t.parentNode.insertBefore(s, t);
  return p;
};

/**
 * This method extends one Class into another by inheriting all the methods of the superclass. Both classes must be defined (loaded) prior to the call of extend().
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var ClassA=function(arguments){<br>
 * ...<br>	 
 * };<br>
 * var ClassB=function(arguments){<br>
 * ClassA.call(this,arguments);<br>
 * ...<br>
 * };<br>
 * vn.extend(ClassA,ClassB);<br></font>
 * @param superclass The class to be extended.
 * @param subclass The class that will inherit the methods of the superclass.
 */
VisiNeatAPI.prototype.extend=function(base, sub) {
   var tmp = sub.prototype;
  sub.prototype =Object.create(base.prototype);
  vn.set(sub.prototype,tmp);
  sub.prototype.constructor = sub;
}

/**
 * This method sets the values of specific properties in an object. If the object does not have such properties they will be automatically defined.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * vn.set(my_div.style,{position:'absolute',color:'black'});<br>
 * //The position and color properties of the style object will be updated with these new values.<br></font>
 * @param object The object to be updated.
 * @param properties An object with the properties-values to be updated.
 */
VisiNeatAPI.prototype.set=function(dst,src)
{
	for(v in src)
		dst[v]=src[v];
};

/**
 * This method defines new properties in an object and initializes them with their default values. The properties that already exist in the object will not be modified.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * vn.default(my_div.style,{display:'block',color:'black'});<br>
 * //If the style object does not have the display or color properties, they will be defined and take their default values.<br></font>
 * @param object The object to be updated.
 * @param properties An object with the properties-values to be defined.
 */
VisiNeatAPI.prototype.default=function(dst,src)
{
	for(v in src)
		if(typeof dst[v]==='undefined')dst[v]=src[v];
};

/**
 * This method loads a file using the http request protocol. The request can be send using the "GET" or "POST" methods and can contain 
 * variables as well as file attachments. This method can be used to download static files, send requests to php scripts, upload data to a server etc.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * vn.http("my_script.php",{method:'post',data:{a_variable:'a value', variable2:'value'}}).then(function(request){<br>
 * ...<br>
 * //do something with the response, such as: JSON.parse(request.responseText);<br>
 * }).catch(function(request){<br>
 * ...<br>
 * });<br></font>
 * @param filename A string with the path/URL of the file to be requested.
 * @param options An optional object that may contain the following parameters: "method" with values "get" or "post", "data" with an object that contains the variable parameters to be sent, "files" with an array of binary files to be uploaded as Uint8Array objects, "mime" with a string that contains a mime type such as "text/xml", "responseType" with a string that contains a return data type such as "arraybuffer".
 * @return VNPromise A promise object that is triggered with the completion of the loading process. 
 */
VisiNeatAPI.prototype.http=function(filename,options)
{
	if(typeof options==="undefined")return vn.getHttp(filename);
	var opt=options||{};
	vn.default(opt,{method:"GET"});
	if(opt.files)
		return vn.postHttpBinary(filename,opt.data,opt.files,opt.mime,opt.responseType,opt.withCredentials,opt.timeout);
	else if(opt.method.toUpperCase() === "POST")
		return vn.postHttp(filename,opt.data,opt.mime,opt.responseType,opt.withCredentials,opt.timeout);
	else return vn.getHttp(filename,opt.data,opt.mime,opt.responseType,opt.withCredentials,opt.timeout);
};

/**
 * This method loads one or more files from the VN cloud. The requested files are loaded as variables with the requested name and datatypes such as "app", "string", "blob", "url", and others.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * vn.load([{id:'nywy62fi8x30n8od',type:'app'},{id:'nywy62fi8x30n8od',type:'string',name:'the_code'}]).then(function(data){<br>
 * ...<br>
 * //the requested items are loaded as fields in the variable "data", such as: data.the_code<br>
 * });<br></font>
 * @param input An object or an array of objects with the fields: "id" with the VN ID of an cloud object, "type" with the desired type, and optionally "name" with the preferred name. 
 * @param options An optional object with one or more of the fields: "progress" with a VNProgress object to track the progress of the loading process.
 * @return VNPromise A promise object that is triggered with the completion of the loading process. 
 */
VisiNeatAPI.prototype.load=function(input,options)
{	
	var opt=options||{}; 
	var p=new VNPromise();
	var done=0;
	var must_do=0;
	var out={};
	var last_out=null;
	var one_done=function()
	{
		done+=1;
		if(opt.progress)opt.progress.oneMoreDone();
		if(opt.caller)opt.caller.getProgress().oneMoreDone();
		if(done>=must_do)
		{
			//vn.wait is used here in order callThen to be called from a fresh event free of previous evals and thus be able to catch errors if any
			if((input instanceof Array) || must_do>1) vn.wait().then(function(){p.callThen({object:out});});
			else vn.wait().then(function(){p.callThen({object:last_out});});
		}
	};
	
	var do_one=function(o)
	{
		var op=o||{};
		if(typeof op.id==='undefined')
		{
			one_done();
			return;
		}
		if(op.type=='app')
		{
			var app=new VNApp(opt.caller);
			app.load(op.id).then(function(data){
				for(var c in data)
				{
					if(op.name)
						out[op.name]=data[c];
					else
						out[c]=data[c];
				}
				last_out=data;
				one_done();
			});
		}
		else if(op.type=='string')
		{
			vn.cloud.download(op.id,{type:'string',mime:op.mime,version:op.version}).then(function(data,request){
				if(op.name)
					out[op.name]=data;
				else out['string'+(done+1)]=data;
				last_out=data;
				one_done();
			});
		}
		else if(op.type=='url')
		{
			vn.cloud.download(op.id,{type:'url',mime:op.mime,version:op.version}).then(function(data,request){
				if(op.name)
					out[op.name]=data;
				else out['url'+(done+1)]=data;
				last_out=data;
				one_done();
			});
		}
		else if(op.type=='blob')
		{
			vn.cloud.download(op.id,{type:'blob',mime:op.mime,version:op.version}).then(function(data,request){
				if(op.name)
					out[op.name]=data;
				else out['blob'+(done+1)]=data;
				last_out=data;
				one_done();
			});
		}
		else //Uint8Array
		{
			vn.cloud.download(op.id,{mime:op.mime,version:op.version}).then(function(data,request){
				if(op.name)
					out[op.name]=data;
				else out['data'+(done+1)]=data;
				last_out=data;
				one_done();
			});
		}
	};
	
	
	
	if(input instanceof Array)
	{
		must_do=input.length;
		if(must_do==0)
		{
			p.callThen({object:{}});
			return p;
		}
		if(opt.progress)opt.progress.oneMoreToDo(must_do);
		if(opt.caller)opt.caller.getProgress().oneMoreToDo(must_do);
		for(var i=0;i<must_do;i++)
			do_one(input[i]);
	}
	else
	{
		must_do=1;
		if(opt.progress)opt.progress.oneMoreToDo();
		if(opt.caller)opt.caller.getProgress().oneMoreToDo();
		do_one(input);
	}
	return p;
};

VisiNeatAPI.prototype.postHttp=function(url,data,mime,responseType,withCredentials,timeout)
{
	var file_request=new XMLHttpRequest();
	var p=new VNPromise(file_request);
	p.catch(function(){console.log('E');});
	file_request.open("POST",url,true);
	if(timeout)
	{
		file_request.timeout = 10000;
		file_request.ontimeout=function(){p.callCatch();};
	}
	file_request.onreadystatechange=function()
	{
		if (file_request.readyState==4)
		{
			if(file_request.status==200)
			{
				vn.progress.oneMoreDone();
				p.callThen();
			}
			else
			{
				vn.progress.oneMoreDone();
				p.callCatch();
			}
		}
	}
	if(mime) file_request.overrideMimeType(mime);
	else file_request.overrideMimeType("text/plain; charset=x-user-defined");
	if(responseType)file_request.responseType=responseType;
	if(withCredentials)file_request.withCredentials=true;
	file_request.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	var msg="";
	if(typeof data!=='undefined')
	{
		var i=0;
		for(v in data)
		{
			if(i==0){msg=v+"="+data[v];i+=1}
			else msg+="&"+v+"="+data[v];
		}
	}
	vn.progress.oneMoreToDo();
	file_request.send(msg);
	return p;
};

VisiNeatAPI.prototype.postHttpBinary=function(url,data,files,mime,responseType,withCredentials,timeout)
{
	var file_request=new XMLHttpRequest();
	var p=new VNPromise(file_request);
	p.catch(function(){console.log('E');});
	file_request.open("POST",url,true);
	if(timeout)
	{
		file_request.timeout = 10000;
		file_request.ontimeout=function(){p.callCatch();};
	}
	file_request.onreadystatechange=function()
	{
		if (file_request.readyState==4)
		{
			if(file_request.status==200)
			{
				vn.progress.oneMoreDone();
				p.callThen();
			}
			else
			{
				vn.progress.oneMoreDone();
				p.callCatch();
			}
		}
	}
	if(mime) file_request.overrideMimeType(mime);
	else file_request.overrideMimeType("text/plain; charset=x-user-defined");
	if(responseType)file_request.responseType=responseType;
	if(withCredentials)file_request.withCredentials=true;
	
	var boundary="visineat-----------------------" + (new Date).getTime();
	var CRLF = "\r\n";
	var SEPARATOR="--"+boundary+CRLF;
	var END="--"+boundary+"--"+CRLF;
	
	var message="";
	if(typeof data!=='undefined')
	{
		var i=0;
		for(v in data)
		{
			message+=SEPARATOR+'Content-Disposition: form-data; name="'+v+'"'+CRLF+CRLF+data[v]+CRLF;
		}
	}
	
	var file_data={};
	if(files)
	{
		if(Array.isArray(files))
		{
			for(var i=0;i<files.length;i++)
			{
				if(files[i] instanceof Uint8Array)
				{
					file_data['file'+i]={filename:'file'+i,data:files[i]};
				}
				else file_data['file'+i]=files[i];
			}
		}
		else
		{
			if(files instanceof Uint8Array)
				file_data['file0']={filename:'file0',data:files};
			else if(files.data)
				file_data['file0']=files;
			else file_data=files;
		}
	}
	
	var file_message={};
	var file_message_length=0;
	for(f in file_data)
	{
		file_message[f]=SEPARATOR+'Content-Disposition: form-data; name="'+f+'"; filename="'+((file_data[f].filename)||f)+'"'+CRLF;
		file_message[f]+="Content-Type: application/octet-stream"+CRLF+CRLF;
		file_message_length+=file_message[f].length;
		file_message_length+=file_data[f].data.length;
		file_message_length+=2;//CRLF
	}
		//data
	
	file_request.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
	
	var bin=new Uint8Array(message.length+file_message_length+END.length);
	for (var i = message.length-1; i>=0 ; i--) bin[i] = (message.charCodeAt(i) & 0xff);
	var offset=message.length;
	for(f in file_data)
	{
		for (var j = file_message[f].length-1; j>=0 ; j--) bin[j+offset] = (file_message[f].charCodeAt(j) & 0xff);
		offset+=file_message[f].length;
		bin.set(file_data[f].data,offset);
		offset+=file_data[f].data.length;
		for (var j = 1; j>=0 ; j--) bin[j+offset] = (CRLF.charCodeAt(j) & 0xff);
		offset+=2;
	}
	for (var i = END.length-1; i>=0 ; i--) bin[i+offset] = (END.charCodeAt(i) & 0xff);
	vn.progress.oneMoreToDo();
	file_request.send(bin);
	return p;
};

VisiNeatAPI.prototype.getHttp=function(url,data,mime,responseType,withCredentials,timeout)
{
	var file_request=new XMLHttpRequest();
	var p=new VNPromise(file_request);
	p.catch(function(){console.log('E');});
	var msg="";
	if(typeof data!=='undefined')
	{
		var i=0;
		for(v in data)
		{
			if(i==0){msg="?"+v+"="+data[v];i+=1}
			else msg+="&"+v+"="+data[v];
		}
	}
	file_request.open("GET",url+msg,true);
	if(timeout)
	{
		file_request.timeout = 10000;
		file_request.ontimeout=function(){p.callCatch();};
	}
	file_request.onreadystatechange=function()
	{
		if (file_request.readyState==4)
		{
			if(file_request.status==200)
			{
				vn.progress.oneMoreDone();
				p.callThen();
			}
			else
			{
				vn.progress.oneMoreDone();
				p.callCatch();
			}
		}
	}
	if(mime) file_request.overrideMimeType(mime);
	else file_request.overrideMimeType("text/plain; charset=x-user-defined");
	if(responseType){file_request.responseType=responseType;}
	if(withCredentials)file_request.withCredentials=true;
	vn.progress.oneMoreToDo();
	file_request.send();
	return p;
};

/**
 * This method parses a URI string and returns an object with the variable parameters contained in the URI.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var params=vn.getURIComponents('http://www.example.com/?a=1&b=2&c=3');<br>
 * //The variable "params" is an object with the parameters a,b,c and their values.<br></font>
 * @param url The URL to be parsed.
 * @return Object An object with the parsed parameters and their values.
 */
VisiNeatAPI.prototype.getURIComponents=function(uri) {
	var qs=uri || document.location.search;
    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
};

/**
 * This method returns a promise object that will be triggered after a specific period of time.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * vn.wait({seconds:5}).then(function(){<br>
 * ...<br>
 * });<br></font>
 * @param options An object with one or more of the following fields: milliseconds, seconds, minutes.
 * @return VNPromise The promise object that is triggered with after this period of time.
 */
VisiNeatAPI.prototype.wait=function(options)
{
	var t=0;
	if(options)
	{
		if(options.seconds)t+=options.seconds*1000;
		if(options.milliseconds)t+=options.milliseconds;
		if(options.minutes)t+=options.minutes*1000*60;
	}
	var p=new VNPromise();
	window.setTimeout(function(){p.callThen();},t);
	return p;
};
 
VisiNeatAPI.prototype.debug=function(method)
{
	var self=this;
	
	if(typeof method==='string')
	{
		if(typeof self._debug_w==='undefined')
		{
			self._debug_w=vn.getWindowManager().createConsole();
			self._debug_w.setTitle('Debug console');
			self._debug_w.whenClosed().then(function(w){w.cancelClosing();w.hide();});
		}
		self._debug_w.show();
		self._debug_w.setSelected(true);
		self._debug_w.println(method);
		return;
	}
	
	var showError=function(err,prmt)
	{
		if(typeof self._debug_w==='undefined')
		{
			self._debug_w=vn.getWindowManager().createConsole();
			self._debug_w.setTitle('Debug console');
			self._debug_w.whenClosed().then(function(w){w.cancelClosing();w.hide();});
		}
		self._debug_w.show();
		self._debug_w.setSelected(true);
		self._debug_w.error(err,prmt);
	};
	
	if(typeof this.err_callback==='undefined')
	{
		this.err_callback=function(e) { 
			showError(e.message+" line:"+e.lineno+" column:"+e.colno,"Syntax Error");
			return true;
		};
		window.addEventListener('error',this.err_callback, false);
	}

	if(typeof method!=='undefined')
	vn.wait().then(function()
	{
		try{method();}
		catch(e)
		{
			var s=''+e.stack;
			var i=s.indexOf('<anonymous>:');
			var line=-1;
			if(i!=-1)//chrome
			{
				line=parseInt(s.substring(i+12,s.indexOf(':',i+12)));
			}
			else
			{
				i=s.indexOf('eval:');
				if(i!=-1)//firefox
				{
					line=parseInt(s.substring(i+5,s.indexOf(':',i+5)));
				}
			}
			if(line>0)
			{
				showError(e.message+" line:"+line,"Run Time Error");
			}
			else
			{
				showError(e.message,"Run Time Error");
			}
		}
	});
};
 
/**
 * This class implements a progress counter that can be used to track the progress of multiple asynchronous processes such as the 
 * downloading of multiple files, or the uploading of a file to a server. It uses a simple API with two main methods "oneMoreToDo" and "oneMoreDone"
 * that update the status of the progress accordingly.
 */
function VNProgress()
{
	this.max_value=100;
	this.value=100;
	this.last_time=0;
	this.pr_progress=new VNPromise(this);
	this.pr_done=new VNPromise(this);
	this.pr_onetodo=new VNPromise(this);
	this.pr_onedone=new VNPromise(this);
}

/**
 * This method declares that there is one more job to be done, i.e. increases the "to do" list of the progress counter.
 * @param jobs An optional argument with the number of jobs you are setting (if more than one).
 */
VNProgress.prototype.oneMoreToDo=function(jobs)
{
	var n=jobs||1;
	this.pr_onetodo.callThen({object:n});
	var now=new Date().getTime();	
	if(this.value==this.max_value && now-this.last_time>5000)
	{
		this.setProgress(0);
		this.setMaximumProgress(n);
	}
	else
		this.setMaximumProgress(this.max_value+n);
	this.last_time=now;
};

/**
 * This method declares that there is one more job done, i.e. increases the "done" list of the progress counter.
 * @param jobs An optional argument with the number of jobs you are setting (if more than one).
 */
VNProgress.prototype.oneMoreDone=function(jobs)
{
	var n=jobs||1;
	this.pr_onedone.callThen({object:n});
	this.setProgress(this.value+n);
	//this.last_time=new Date().getTime();
};

/**
 * This method returns the percentage value that corresponds to a single job in the current job load.
 * @return number The current percentage value of 1 job in the range [0-1].
 */
VNProgress.prototype.getIncrement=function(){return 1/(this.max_value+1);};

/**
 * This method returns the current progress value.
 * @return number The progress value as a real number in the range [0-1].
 */
VNProgress.prototype.getValue=function(){return (this.value+1)/(this.max_value+1);};

VNProgress.prototype.setProgress=function(value)
 {
 	var v=value;
 	if(v>this.max_value) v=this.max_value;
 	else if(v<0)c=0;
 	if(v!=this.value)
 	{
 		this.value=v;
		this.pr_progress.callThen();
		if(this.value==this.max_value)
			this.pr_done.callThen();
 	}
 };
  
VNProgress.prototype.setMaximumProgress=function(value)
 {
	 
 	var v=value;
 	if(v<=0) return;
 	if(v!=this.max_value)
 	{
		
 		if(this.value>v) this.value=v;
 		this.max_value=v;
		this.pr_progress.callThen();
		if(this.value==this.max_value)
			this.pr_done.callThen();
 	}
 };
 
 /**
 * This method returns a promise that is triggered when there is one more todo.
 * @return VNPromise A promise object that is triggered with any change in the todo number. 
 */
 VNProgress.prototype.whenOneMoreToDo=function(){this.pr_onetodo.reset();return this.pr_onetodo};

 /**
 * This method returns a promise that is triggered when one more is done.
 * @return VNPromise A promise object that is triggered with any change in the done number. 
 */
 VNProgress.prototype.whenOneMoreDone=function(){this.pr_onedone.reset();return this.pr_onedone};
 
/**
 * This method returns a promise that is triggered when there has been a change in the progress value.
 * @return VNPromise A promise object that is triggered with any change in the progress value. 
 */
 VNProgress.prototype.whenProgress=function(){this.pr_progress.reset();return this.pr_progress};
 
/**
 * This method returns a promise that is triggered when the progress value goes to 1, i.e. when all jobs have been completed.
 * @return VNPromise A promise object that is triggered with any change in the progress value. 
 */
 VNProgress.prototype.whenDone=function(){return this.pr_done};

/** This class offers a convenient way to handle asynchronous processes by setting two callback functions "then" and "otherwise" that 
 * will be called when the particular asynchronous process successfully finishes or fails respectively.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var promise=vn.import("my_library.js");<br>
 * promise.then(function(){<br>
 * ...<br>
 * }).otherwise(function(){<br>
 * ...<br>
 * });<br></font>
 * @param Object An optional object that will be provided as input argument to the "then" or "catch" callback functions.
 */
 function VNPromise(object)
{
	this.object=object;
	this.event=null;
	this.do_not_call_twice=false;
	this.thenCallback=[];
	this.catchCallback=[];
	this.abortCallback=[];
	this.thenCalled=false;
	this.catchCalled=false;
	this.abortCalled=false;
	this.allow_recursion=false;//to call a callback from inside the callback using callThen() inside the callback
}

/**
 * With this method you can set if a callback can be called more than one times, or if it should be removed after its first call. The default value is true. 
 * @param flag A Boolean value that corresponds to the desired behaviour of the promise.
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.allowMultipleCalls=function(flag)
{
	this.do_not_call_twice=!flag;
	return this;
};
/**
 * With this method you can set if a callback can be called from inside the callback using callThen(). The default value is false. When set to true, the programer should be careful not to cause an infinite loop due to recursion.
 * @param flag A Boolean value that corresponds to the desired behaviour of the promise.
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.allowRecursion=function(flag)
{
	this.allow_recursion=flag;
	return this;
};
/**
 * This method sets the object to be provided as input argument to the "then" or "catch" callback functions.
 * @param Object An object that will be provided as input argument to the "then" or "catch" callback functions.
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.setObject=function(object)
{
	this.object=object;
	return this;
};

/**
 * This method sets the system event object associated with the current call of "then" or "catch" callback functions.
 * @param event The system event object associated with the current call of "then" or "catch" callback functions.
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.setEvent=function(event)
{
	this.event=event;
	return this;
};

VNPromise.prototype.callAll=function(cb)
{
	var c=cb.slice();//copy the callback array in order to avoid calling new callbacks that will be added from inside the callbacks, i.e. if a callback contains reference to the method then(...) of the same promise.
	//console.log('Call All:'+c.length);
	for(var i=0;i<c.length;i++)
	{
		this.call(cb,c[i]);
	}
};

VNPromise.prototype.call=function(cb,c)
{
	if(!this.allow_recursion)
	{
		var ind=cb.indexOf(c);
		if(ind>-1)cb.splice(ind,1);//remove it from the cb array 
		//Note that it is removed before it is called, so that we avoid an infinite loop due to recursion in the case that the callback containes reference to the method then(...) of the same promise.
	}
	if(c(this.object,this.event,this)||this.do_not_call_twice){
		if(this.allow_recursion)
		{
			var ind=cb.indexOf(c);
			if(ind>-1)cb.splice(ind,1);//remove it from the cb array 
		}
	}//if returns true, this callback is not called anymore.
	else
	{
		if(!this.allow_recursion)cb.push(c);//put it back in the cb array if it returns true.
	}
};

/**
 * This method calls all "then" callbacks that have been set to this promise using the method "then". You can use 
 * this function when an asynchronous process is sucessfully completed.
 * @param options An optional object with one or more of the following fields: event (the corresponding system event object if any), object (an input object to be provided to the calls of then).
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.callThen=function(options)
{
	this.thenCalled=true;
	if(options&&typeof options.object!=='undefined')this.setObject(options.object);
	if(options&&options.event)this.setEvent(options.event);
	this.callAll(this.thenCallback);
	
	return this;
};

/**
 * This method calls all "catch" callbacks that have been set to this promise using the method "catch". You can use 
 * this function when an asynchronous process fails.
 * @param options An optional object with one or more of the following fields: event (the corresponding system event object if any), object (an input object to be provided to the calls of catch).
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.callOtherwise=function(options)
{
	this.catchCalled=true;
	if(options&&options.object)this.setObject(options.object);
	if(options&&options.event)this.setEvent(options.event);
	this.callAll(this.catchCallback);
	
	return this;
};

VNPromise.prototype.callCatch=VNPromise.prototype.callOtherwise;

/**
 * This method can be used to abort the corresponding asynchronous process. This method calls all "whenAborted" callbacks that have been set to this promise. 
 * @param options An optional object with one or more of the following fields: event (the corresponding system event object if any), object (an input object to be provided to the calls of then).
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.abort=function(options)
{
	this.abortCalled=true;
	if(options&&typeof options.object!=='undefined')this.setObject(options.object);
	if(options&&options.event)this.setEvent(options.event);
	this.callAll(this.abortCallback);
	
	return this;
};

/**
 * This method method resets the promise so that new callbacks will not be called for previously triggered then or catch.
 * You can use this function right after the methods callThen or callCatch.
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.reset=function()
{
	this.catchCalled=false;
	this.thenCalled=false;
	this.abortCalled=false;
	
	return this;
};

/**
 * This method removes all callback functions associated with this promise object.
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.clear=function()
{
	this.thenCallback=[];
	this.catchCallback=[];
	this.abortCallback=[];
	return this;
};

/**
 * With this method you can set a function that will be called when an asynchronous process is succesfully completed. The provided callback function when called may be provided with 2 input arguments, an object and an event.
 * The callback can be called multiple times if this is the nature of the process, e.g. whenProgress().then(function(object,event){...}). If you want to stop a callback
 * from being called again in the future, the callback must return true.
 * @param callback A function to be called when this promise is successfully fulfilled.
 * @return VNPromise The same promise object is returned in order to define an "otherwise" callback function after defining a "then" callback.
 */
VNPromise.prototype.then=function(callback)
{
	this.thenCallback.push(callback);
	if(this.thenCalled)
		this.call(this.thenCallback,callback);

	return this;
};

/**
 * With this method you can set a function that will be called when an asynchronous process fails. The provided callback function when called may be provided with 2 input arguments, an object and an event.
 * The callback can be called multiple times if this is the nature of the process. If you want to stop a callback
 * from being called again in the future, the callback must return true.
 * @param callback A function to be called when this promise is unsuccessfully fulfilled (cancelled).
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.otherwise=function(callback)
{
	this.catchCallback.push(callback);
	if(this.catchCalled)
		this.call(this.catchCallback,callback);
	
	return this;
};
VNPromise.prototype.catch=VNPromise.prototype.otherwise;
 
/**
 * With this method you can set a function that will be called when an asynchronous process is aborted. The provided callback function when called may be provided with 2 input arguments, an object and an event.
 * The callback can be called multiple times if this is the nature of the process. If you want to stop a callback
 * from being called again in the future, the callback must return true.
 * @param callback A function to be called when this promise is aborted.
 * @return VNPromise The same promise object is returned in order to chain the call of multiple methods.
 */
VNPromise.prototype.ifAborted=function(callback)
{
	this.abortCallback.push(callback);
	if(this.abortCalled)
		this.call(this.abortCallback,callback);
	
	return this;
};
 
var vn=vn||new VisiNeatAPI();

/**
 * This class implements a generic file loader. It can be extended to implement any particular file format reader, by properly processing the loaded data.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var f=new MyFormatFile();<br>
 * //We assume that a class MyFormatFile extends VNFile, and it contains the method "handleLoadedFile" which processes the data.
 * f.load("my_filename").then(function(f){<br>
 * ...<br>
 * }).otherwise(function(f){<br>
 * ...<br>
 * });<br></font>
 */
function VNFile()
{
	this.filename='';
	this.loaded=false;
	this.failed=false;
}

/**
 * This method will be called when the file is loaded in order to process the data, i.e. read the format etc. It is initially empty. 
 */
VNFile.prototype.handleLoadedFile=function(request){};

/**
 * This method starts the asynchronous loading of a file.
 * @param url A string with the path/URL of the file to be loaded.
 * @return VNPromise A promise object that is triggered when the file is loaded and processed. 
 */
VNFile.prototype.load=function(url)
{
	this.loaded=false;
	this.failed=false;
	this.filename=url;
	var p=new VNPromise(this);
	var self=this;
	vn.progress.oneMoreToDo();
	vn.load(this.filename).then(function(request)
	{
		vn.progress.oneMoreDone();
		self.request=request;
		self.handleLoadedFile(request);
		self.loaded=true;
		p.callThen();
	}).catch(function(request)
	{
		vn.progress.oneMoreDone();
		self.request=request;
		self.failed=true;
		p.callCatch();
	});
	return p;
};

function VNDocsDemo(div_id,title,program,type)
{
	this.div_id=div_id;
	this.title=title;
	this.own_div=null;
	this.program=program;
	this.type=type;
	this.window=null;
}

VNDocsDemo.prototype.run=function()
{
	var self=this;
	vn.run(function(){
		if(vn_demo_wm==null)
		{
			var d=document.getElementById("vn_demo_wm");
			if(d)
			{
				vn_demo_wm=new WindowManager(d);
				vn_demo_wm.zIndex=10000;
				
				//vn_demo_wm.console=vn_demo_wm.createConsole({width:300,height:300});
			}
		}
		var div=document.getElementById(self.div_id);
		div.innerHTML="";
		div.style.backgroundColor='';
		div.style.border='1px dashed';
		self.own_div=document.createElement('div');
		vn.set(self.own_div.style,{width:'100%',height:'100%'});
		div.appendChild(self.own_div);
		var c=null;
		if(self.type=='canvas')
		{
			c=new GLCanvas(self.own_div);
			self.program(c);
		}
		else self.program(self.own_div);
			
		
		var gui=new GUIManager(self.own_div);
		var message_area=gui.createNotificationArea();
		var toolbar=gui.createRetractableToolbar(50,1);
		
	if(self.type=='canvas')
	{
	var projector_menu=new RetractableToolbarButton(toolbar);
	projector_menu.setLabel('Change viewing mode');
		
	var cross_eyes_button=new RetractableToolbarButton(projector_menu);
	cross_eyes_button.setIcon(vn.hosturl+'js/img/crossed_eyes_icon.png');
	cross_eyes_button.setLabel('Crossed eyes');
	
	var parallel_eyes_button=new RetractableToolbarButton(projector_menu);
	parallel_eyes_button.setIcon(vn.hosturl+'js/img/parallel_eyes_icon.png');
	parallel_eyes_button.setLabel('Parallel eyes');
	
	var red_blue_button=new RetractableToolbarButton(projector_menu);
	red_blue_button.setIcon(vn.hosturl+'js/img/red_cyan_icon.png');
	red_blue_button.setLabel('Red/Cyan glasses');
	
	var side_by_side_button=new RetractableToolbarButton(projector_menu);
	side_by_side_button.setIcon(vn.hosturl+'js/img/3dtv_icon.png');
	side_by_side_button.setLabel('3D TV display');
	
	var oculus_button=new RetractableToolbarButton(projector_menu);
	oculus_button.setIcon(vn.hosturl+'js/img/oculus_icon.png');
	oculus_button.setLabel('Oculus head mounted display');
	
	var eyes_button=new RetractableToolbarButton(projector_menu);
	eyes_button.setIcon(vn.hosturl+'js/img/eye_icon.png');
	eyes_button.setLabel('Bare eye vision');
	projector_menu.setSelectedOption(eyes_button);
	
	projector_menu.onSelect=function(opt)
	{
		if(opt==eyes_button)
		{
			c.useRegularProjector();
		}
		else if(opt==oculus_button)
		{
			c.useOculusProjector();
			//self.setFullScreen(true);
		}
		else if(opt==side_by_side_button)
		{
			c.useSideBySideProjector(true,false);
			//self.setFullScreen(true);
		}
		else if(opt==red_blue_button)
		{
			c.useRedCyanProjector();
		}
		else if(opt==parallel_eyes_button)
		{
			c.useSideBySideProjector(false,false);
		}
		else if(opt==cross_eyes_button)
		{
			c.useSideBySideProjector(false,true);
		}
	};
	
	c.onTap=function(e){if(gui.isExpanded())gui.retract();else gui.expand();};
	c.onMove=function(e){	if(!e.mouse_pressed){gui.expand();}};
	c.onDragStart=function(e){gui.retract();};
	c.onDragEnd=function(e){gui.expand();};
	
	}//canvas
	else
	{ 
		self.own_div.addEventListener('touchstart',function(e){if(e.target==self.own_div)e.preventDefault();},false);
		self.own_div.addEventListener('mousemove',function(){gui.expand();},false);
		self.own_div.addEventListener('touchmove',function(){gui.expand();},false);
	}
			
	var button1=new RetractableToolbarButton(toolbar);
		button1.setIcon(vn.hosturl+'js/img/fullscreen_icon.png');
		button1.setLabel('Window mode on/off');
		button1.setLink('');
		button1.onClick=function(b){
			if(self.window)
			{
				self.window.close();
				return;
			}
			
			var w=vn_demo_wm.createWindow(100,100,600,400);
			w.setIcon('/js/img/VNlogo256.png');
			w.setSelected(true);
			w.setTitle(self.title);
			w.getContentDiv().appendChild(self.own_div);
			w.whenDestroyed().then(function(){
				div.appendChild(self.own_div);
				self.window=null;
				});
			self.window=w;
			};
		
		
	});
};

function VNApp(caller)
{
	this._run_p=new VNPromise(this);
	this._error_p=new VNPromise(this);
	this._terminate_p=new VNPromise(this);
	this._progress=new VNProgress();
	this._id=null;
	if(caller)
	{
		this._progress.whenOneMoreToDo().then(function(n){caller.getProgress().oneMoreToDo(n);});
		this._progress.whenOneMoreDone().then(function(n){caller.getProgress().oneMoreDone(n);});
	}
}

VNApp.prototype.getId=function()
{
	return this._id;
};
VNApp.prototype.setId=function(id)
{
	this._id=id;
};

VNApp.prototype.setContentDiv=function(div)
{
	this.content_div=div;
};

VNApp.prototype.getContentDiv=function()
{
	if(this.content_div)return this.content_div;
	else if(this.window)return this.window.getContentDiv();
	else 
	{
		return this.getWindow().getContentDiv();
	}
};

VNApp.prototype.showLoading=function()
{
	this.clearContents();
	var logo_container=document.createElement('div');
	this.getContentDiv().appendChild(logo_container);
	if(this.isWindowed())this.getContentDiv().style.backgroundColor='rgba(0,0,255,0.2)';
	vn.set(logo_container.style,{
		position:'absolute',
		bottom:'0px',
		top:'0px',
		width:'100%',
		overflow:'hidden'
	});
	var logo=document.createElement('div');
	logo_container.appendChild(logo);
	vn.set(logo.style,{
		position:'absolute',
		left:'50%',
		top:'50%',
		width:'100%',
		height:'100%'
	});
	var a=document.createElement('div');
	vn.set(a.style,{position:'absolute',
		width:'128px',
		height:'128px',
		top:'-64px',
		left:'-64px'});
	logo.appendChild(a);
	var i=document.createElement('img');
	i.src=vn.hosturl+"js/img/VNlogo256transparent.gif";
	i.style.width='128px';
	i.style.height='128px';
	a.appendChild(i);
	  
	var t=document.createElement('div');
	vn.set(t.style,{width:'100%',height:'20px',textAlign:'center',color:'#ffffff',textShadow:'black 0px 0px 5px',fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif'});
	  t.innerHTML='Loading...';
	  a.appendChild(t);
	 
	  var p=document.createElement('div');
	  vn.set(p.style,{width:'100%',height:'3px',background:'#CCCCCC',position:'absolute',margin:'10px 0px',boxShadow:'0px 0px 5px black'});
	  a.appendChild(p);
	  
	  var p2=document.createElement('div');
	  vn.set(p2.style,{width:'0%',height:'3px',background:'rgb(128,98,165)',position:'absolute',left:'0px',top:'0px'});
	  p.appendChild(p2);
	  
	  var pr=this.getProgress();
	  pr.whenProgress().then(function(p)
	  {
			p2.style.width=(p.getValue()+p.getIncrement())*99+'%';
			p2.style.display='block';
			t.innerHTML='Loading... '+Math.floor(Math.min((p.getValue()+p.getIncrement())*99,100))+'%';
	  });
		
	  pr.whenDone().then(function(p)
	  {
		 p2.style.display='none';
	  });
};

VNApp.prototype.clearContents=function()
{
	var div=this.getContentDiv();
	while(div.firstChild)div.removeChild(div.firstChild);
	if(this.isWindowed())this.getContentDiv().style.backgroundColor='#ffffff';
};

VNApp.prototype.setWindow=function(w)
{
	this.window=w;
	var self=this;
	this.window.whenDestroyed().then(function(){
		self.terminate();
	});
};

VNApp.prototype.getWindow=function()
{
	if(this.window)return this.window;
	else 
	{
		this.window=vn.getWindowManager().createWindow();
		if(this.content_div)
		{
			this.window.hide();
			var self=this;
			this.window.getContentDiv=function(){return self.content_div;};
		}
		else
		{
			var self=this;
			this.window.whenDestroyed().then(function(){
				self.terminate();
			});
	
			if(this.cloudObject&&this.cloudObject.info&&this.cloudObject.info.VN_NAME)
				this.window.setTitle(this.cloudObject.info.VN_NAME);
		}
		return this.window;
	}
};

VNApp.prototype.isWindowed=function()
{
	if(this.content_div)return false;
	else return true;
};

VNApp.prototype.getProgress=function(){return this._progress;};

VNApp.codifyAssets=function(AssetsString)
{
	var out='var __Asset='+AssetsString+';';
	if(typeof AssetsString==='undefined')out='var __Asset={};';
	
	out+='var AssetID=function(a){if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);return __Asset[a].id};';
	out+='var AssetType=function(a){if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);return __Asset[a].type};';
	out+='var loadImage=function(a){if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);return vn.load({id:AssetID(a),type:"url"});};';
	out+='var loadTexture=function(a,c){if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);var t=new GLTexture(c); vn.load({id:AssetID(a),type:"url"}).then(function(url){t.load(url)});return t;};';
	out+='var loadObject=function(a,c){if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);var o=new GLObject(c);o.load(AssetID(a)).then(function(){o.setShader(new GLShader(c,{map:true,uv:true,diffuse:true,specular:true}))});return o;};';
	out+='var imageAsset=loadImage;';
	
	out+='var loadAsset=function(a,op){if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);var o=op||{};';
	out+='if(__Asset[a].type=="Image" && typeof o.type=="undefined")return vn.load({id:__Asset[a].id,type:"url"},{progress:o.progress});';
	out+='else if(__Asset[a].type=="SVG" && typeof o.type=="undefined")return vn.load({id:__Asset[a].id,type:"url",mime:"image/svg+xml"},{progress:o.progress});';
	out+='else if(__Asset[a].type=="Audio" && typeof o.type=="undefined")return vn.load({id:__Asset[a].id,type:"url",mime:"audio/mpeg"},{progress:o.progress});';
	out+='else if(__Asset[a].type=="AppData" && typeof o.type=="undefined")return vn.load({id:__Asset[a].id,type:"app"},{progress:o.progress});';
	out+='else if(typeof o.type=="undefined") return vn.load({id:__Asset[a].id,type:"url"},{progress:o.progress});';
	out+='else return vn.load({id:__Asset[a].id,type:o.type},{progress:o.progress});};';
	
	out+='var loadAssets=function(A,op){var o=op||{};var d=[];for(var i in A){var a=A[i];';
	out+='if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);';
	out+='else if(__Asset[a].type=="Image"&&(typeof o.only=="undefined"||o.only=="Image"))d.push({id:__Asset[a].id,type:"url",name:a});';
	out+='else if(__Asset[a].type=="SVG"&&(typeof o.only=="undefined"||o.only=="Image"))d.push({id:__Asset[a].id,type:"url",name:a,mime:"image/svg+xml"});';
	out+='else if(__Asset[a].type=="Audio"&&(typeof o.only=="undefined"||o.only=="Audio"))d.push({id:__Asset[a].id,type:"url",name:a,mime:"audio/mpeg"});';
	out+='else if(__Asset[a].type=="AppData"&&(typeof o.only=="undefined"||o.only=="AppData"||o.only=="Code"))d.push({id:__Asset[a].id,type:"app"});';
	out+='else if(typeof o.only=="undefined")d.push({id:__Asset[a].id,type:"url",name:a});';
	out+='}return vn.load(d,{progress:o.progress});};';
	
	out+='var loadAllAssets=function(op){var o=op||{};var d=[];for(var a in __Asset)';
	out+='if(typeof __Asset[a]=="undefined")throw new Error("Unknown Asset: "+a);';
	out+='else if(__Asset[a].type=="Image"&&(typeof o.only=="undefined"||o.only=="Image"))d.push({id:__Asset[a].id,type:"url",name:a});';
	out+='else if(__Asset[a].type=="SVG"&&(typeof o.only=="undefined"||o.only=="Image"))d.push({id:__Asset[a].id,type:"url",name:a,mime:"image/svg+xml"});';
	out+='else if(__Asset[a].type=="Audio"&&(typeof o.only=="undefined"||o.only=="Audio"))d.push({id:__Asset[a].id,type:"url",name:a,mime:"audio/mpeg"});';
	out+='else if(__Asset[a].type=="AppData"&&(typeof o.only=="undefined"||o.only=="AppData"||o.only=="Code"))d.push({id:__Asset[a].id,type:"app"});';
	out+='else if(typeof o.only=="undefined")d.push({id:__Asset[a].id,type:"url",name:a});';
	out+='return vn.load(d,{progress:o.progress});};';
	return out;
};

VNApp.prototype.load=function(id,options)
{
	var self=this;
	this.cloudObject=vn.cloud.getObject(id);
	this.cloudObject.whenReady().then(function(o){
		self.setId(o.info.VN_OID);
		o.download({type:'string'}).then(function(data,request){
			console.log("Running "+o.info.VN_NAME);
			var app=VNApp.pack({id:o.info.VN_OID,assets:o.info.Assets,code:data});
			vn.wait().then(function()
			{
				self.run(app,options);
			});
		});
	});
	return this.whenStarted();
};

VNApp.prototype.getUserData=function(options)
{
	var opt=options||{};
	var p=new VNPromise();
	var started=false;
	var self=this;
	var me=vn.cloud.getMe();
	var getD=function(){
		var user_data=me.getAppDataInstalled(self.getId());
		user_data.whenReady().then(function(){
			if(started)return;
			started=true;
			p.callThen({object:user_data});
		});
	};
	me.whenReady().then(function(){
		getD();
	}).catch(function(){
		if(opt.mustLogin) vn.cloud.getMe().login();
		else {
			if(started)return;
			started=true;
			p.callThen({object:null});
		}
	});

	me.whenLogin().then(function(){
		getD();
	});
	
	return p;
};

VNApp.pack=function(options)
{
	var opt=options||{};
	return eval("(function(_vn_inp,vn,window,VNApp){\"use strict\";var VN_OID=\""+opt.id+"\";var exportData=function(r){_vn_inp.api.whenStarted().callThen({object:r});};"+VNApp.codifyAssets(opt.assets)+opt.code+"\nmain(_vn_inp);})");
};

VNApp.prototype.run=function(app,options)
{
	var self=this;
	var opt=options||{};
	opt.api=this;
	opt.app=this;
				
	var newvn={};
	vn.set(newvn,vn);
	//overriding...
	newvn.load=function(input,options){var op=options||{};op.caller=self;return vn.load(input,op);};
	
	var newwindow={};
	var p=Object.getOwnPropertyNames(window);
	for(var i in p)
	{
		newwindow[p[i]]=window[p[i]];
		if(typeof window[p[i]]=='function')
		{
			var f=function(name)
			{
				return function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o){return window[name](a,b,c,d,e,f,g,h,i,j,k,l,m,n,o);};
			};
			newwindow[p[i]]=f(p[i]);
		}
	}
	if(newwindow.window)delete newwindow.window;
	
	var VNApp_=function(c){var cc=c||self;VNApp.call(this,cc);};
	vn.extend(VNApp,VNApp_);
	VNApp_.codifyAssets=VNApp.codifyAssets;
	VNApp_.pack=VNApp.pack;
	
	if(opt.catchErrors)
	{
		try
		{
			app(opt,newvn,newwindow,VNApp_);}
		catch(e){self.whenStarted().callThen();}
	}
	else app(opt,newvn,newwindow,VNApp_);
};

VNApp.prototype.whenStarted=function(){return this._run_p;};
VNApp.prototype.whenError=function(){return this._error_p;};
VNApp.prototype.whenTerminated=function(){return this._terminate_p;};

VNApp.prototype.terminate=function(){
	this._terminate_p.callThen();
};