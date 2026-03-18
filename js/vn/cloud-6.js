/* V6
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
 
/** This class is the entry point to the VN Cloud API. An object of this class is automatically created and can be accessed as vn.cloud . The VN Cloud API offers functionality to read and write files to the VN cloud storage. Each file has a section to define and retrieve metadata fields as well a file component that holds the data of a file (such as image, text, etc). Part of the functionality requires authentication using the login/logout methods provided in the VNCloudUser class.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var me=vn.cloud.getMe();	<br>
 * <br>
 *	me.whenReady().then(function(){<br>
 *		console.log('already logged in');<br>
 *	}).otherwise(function(){<br>
 *		console.log('not logged in');<br>
 *  //here you can prompt login with me.login<br>
 *	});<br>
 *	<br>
 *	me.whenLogin().then(function(){<br>
 *		console.log('just logged in');<br>
 *	});<br>
 *	<br>
 *	me.whenLogout().then(function(){<br>
 *		console.log('just logged out');	<br>
 *	});<br>
 *	<br>
 *	me.whenAuthenticationRequired().then(function(){<br>
 *		console.log('authentication required');<br>
 *	});<br></font>
 */
function VNCloud(){
	
	this.encoder=new VNCloudEncoder();
	
	this._me=null;
	this._use=null;
	
	this._system_lists={
		"root":"j9m2ar5btgyb867r",
		"trash":"eeen9g42w3velyo7",
		"desktop":"c31zkxvsrfd6ayev"
	};
	
	var self=this;
	this.setObjectForUse=function(o)
	{
		var p=new VNPromise(o);
		if(self._use)
			self._use.p.callOtherwise();
		if(o)self._use={p:p,object:p};else self._use=null;
		return p;
	};
	
	var intrv=null;
	
	var upd=function()
	{
		var me=new VNCloudUser();
		me.reset();
		me.whenReady().then(function(){
			if(me.getId()!=self._me.getId())
			{
				console.log('USER AUTHENTICATION CHANGED ERROR!'+new Date().getTime());
				self._me=me;
			}
			if(intrv){window.clearInterval(intrv);intrv=null;}
		}).otherwise(function(o,e){
			console.log('.');
			console.log(o);
			console.log(e);
			me.login().then(function()
			{
				console.log('reauthenticated');
				self._me=me;
				if(intrv){window.clearInterval(intrv);intrv=null;}
			});
		});
	};
	
	var update=function()
	{
		if(self._me && self._me.info)
		{
			var me=new VNCloudUser();
			me.reset();
			me.whenReady().then(function(){
				if(me.getId()!=self._me.getId())
				{
					console.log('USER AUTHENTICATION CHANGED ERROR!');
					self._me=me;
				}
			}).otherwise(function(){
				console.log('USER AUTHENTICATION RENEWAL ERROR!');
				upd();
			});
		}
	};
	
	window.setInterval(update, 1000*60*30);
	
	var update2=function()
	{
		if(self._me)
		{
			console.log('online')
			var me=new VNCloudUser();
			me.reset();
			me.whenReady().then(function(){
				if(me.getId()!=self._me.getId())
				{
					console.log('USER AUTHENTICATION CHANGED ERROR!');
					self._me=me;
				}
			}).otherwise(function(){
				console.log('USER AUTHENTICATION RENEWAL ERROR!');
				me.login().then(function()
				{
					console.log('reauthenticated');
					self._me=me;
				});
			});
		}
	};
	
	window.addEventListener('online',  update2);
}

/**
 * This method returns the last cloud object placed on the clip board of the user using the object.pick() or null if there is no object in the clipboard. This allows the use of files accross applications within VN. 
 * @return VNCloudObject The last cloud object placed on the clipboard by the user or null.
 */
VNCloud.prototype.use=function()
{
	if(this._use)
	{
		this._use.p.callThen();
		return this._use.object;
	}
	else return null;
};

/**
 * This method returns the user object that contains the information and functionality of the current user.
 * @return VNCloudUser The user object that contains the information of this user.
 */
VNCloud.prototype.getMe=function()
{
	if(this._me)return this._me;
	
	var o=new VNCloudUser();
	this._me=o;
	o.reset();
	o.whenReady().then(function(){
		vn.load({id:'ft30f42tck1l73ow',type:'app'});
	});
	
	o.whenLogin().then(function(){
		vn.load({id:'ft30f42tck1l73ow',type:'app'});
	});
	return o;
};

/**
 * This method returns the user object that contains the information and functionality of another user with a given ID.
 * @param id A string with the ID of the user.
 * @return VNCloudUser The user object that contains the information of this user.
 */
VNCloud.prototype.getUser=function(id)
{
	var o=new VNCloudUser(id);
	o.reset();
	return o;
};

/**
 * This method downloads the data file of a particular cloud object.
 * @param oid The ID of the desired cloud object.
 * @param options An optional object with one or more of the following fields: version (a number with the requested version of the file; the last version will be assumed if not specified), type (a string with the desired format of data delivery such as "string","blob","url". The default format is Uint8Array.).
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloud.prototype.download=function(oid,options)
{
	var opt=options||{};
	var p=new VNPromise();
	if(oid){}else{p.callCatch();return p;}
	
	var version='';
	if(opt.version)version='.'+opt.version;
	
	vn.http(vn.hosturl+'file/'+oid+version+'/data'+'?client='+location.hostname,{responseType:'arraybuffer'}).then(function(request){
		if(request.getResponseHeader('Content-Language')=='deflate_shift1')
		{
			var e=vn.cloud.encoder;
			e.decode(request.response,opt).then(function(b){
				p.callThen({object:b,event:request});
			}).catch(function(e){
				p.callCatch({object:request.response,event:e});
			});
		}
		else 
		{
			var e=vn.cloud.encoder;
			e.format(request.response,opt).then(function(b){
				p.callThen({object:b,event:request});
			}).catch(function(e){
				p.callCatch({object:request.response,event:e});
			});
		}
	}).otherwise(function(request){p.callCatch({event:request});});;
	
	return p;
};

VNCloud.prototype.downloadLocal=function(oid,options)
{
	var opt=options||{};
	var p=new VNPromise();
	if(oid){}else{p.callCatch();return p;}
	
	var version='';
	if(opt.version)version='.'+opt.version;
	
	vn.http(vn.hosturl+'Assets/'+oid+'/data',{responseType:'arraybuffer'}).then(function(request){
		/*try{
			p.callThen({object:format(request.response),event:request});
		}catch(e){p.callCatch({object:request.response,event:e});} */
		
		var e=vn.cloud.encoder;
			e.format(request.response,opt).then(function(b){
				p.callThen({object:b,event:request});
			}).catch(function(e){
				p.callCatch({object:request.response,event:e});
			});
		
	}).otherwise(function(request){p.callCatch({event:request});});;
	
	return p;
};

/**
 * This method loads a cloud object with a given ID.
 * @param string A string with the ID of the object to be loaded. 
 * @return VNCloudObject The cloud object associated with the result of this request.
 */
VNCloud.prototype.getObject=function(oid)
{
	var o=new VNCloudObject();
	vn.http(vn.hosturl+'file/info.php',{method:'post',withCredentials:true,data:{VN_OID:oid}}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS===false)
		{
			if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
			o.whenReady().setObject(r);
			o.whenReady().callCatch();
		}
		else 
		{
			o.info=r;
			o.whenReady().callThen();
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	return o;
};

VNCloud.prototype.getObjectLocal=function(oid)
{
	var o=new VNCloudObject();
	vn.http(vn.hosturl+'Assets/'+oid+'/info.json').then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS===false)
		{
			if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
			o.whenReady().setObject(r);
			o.whenReady().callCatch();
		}
		else 
		{
			o.info=r;
			o.whenReady().callThen();
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	return o;
};
 
VNCloud.prototype.getHistory=function(oid)
{
	var p=new VNPromise(this);
	vn.http(vn.hosturl+'file/history.php',{method:'post',withCredentials:true,data:{VN_OID:oid}}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS===false)
		{
			if(r.VN_COMMENTS=='Authentication required.')
			{
				var ar=vn.cloud.getMe().whenAuthenticationRequired();
				ar.callThen();
				ar.reset();
			}
			p.setObject(r);
			p.callCatch();
		}
		else 
		{
			p.callThen({object:r});
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	return p;
};

VNCloud.prototype.getFeed=function(oid,postid)
{
	var data={VN_OID:oid};
	if(postid)data.VN_POST=postid;
	var p=new VNPromise(this);
	vn.http(vn.hosturl+'file/feed.php',{method:'post',withCredentials:true,data:data}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS===false)
		{
			if(r.VN_COMMENTS=='Authentication required.')
			{
				var ar=vn.cloud.getMe().whenAuthenticationRequired();
				ar.callThen();
				ar.reset();
			}
			p.setObject(r);
			p.callCatch();
		}
		else 
		{
			p.callThen({object:r});
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	return p;
};

VNCloud.prototype.getClones=function(oid)
{
	var p=new VNPromise(this);
	vn.http(vn.hosturl+'file/clones.php',{method:'post',withCredentials:true,data:{VN_OID:oid}}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS===false)
		{
			if(r.VN_COMMENTS=='Authentication required.')
			{
				var ar=vn.cloud.getMe().whenAuthenticationRequired();
				ar.callThen();
				ar.reset();
			}
			p.setObject(r);
			p.callCatch();
		}
		else 
		{
			p.callThen({object:r});
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	return p;
};

/** This class handles the reading and writing of a file object in the VN cloud. Objects of this class are generated by vn.cloud.getObject or other methods such as vn.cloud.getMe().newObject. A file in the VN cloud has a list of metadata fields that can be edited using this class, and possibly a data file (such as a binary or a text file). In addition a file may contain other files and thus behave as a folder.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var file=vn.cloud.getObject('the id of an object');<br>
 * file.whenReady().then(function(){<br>
 * ...<br>
 * }).otherwise(function(event){<br>
 * ...<br>
 * });<br></font>
 */
function VNCloudObject()
{
	this._reset();
}

VNCloudObject.prototype._reset=function()
{
	this.ready_promise=new VNPromise(this);
	delete this.info;
};

/**
 * This method returns a promise that is triggered when a textual description of this object have been loaded and is ready to be used.
 * @return VNPromise A promise object that is triggered when the description is loaded. The description is provided as a string to the call of the "then" method of this promise. 
 */
VNCloudObject.prototype.getDescription=function()
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
	vn.http(vn.hosturl+'file/'+self.getId()+'/description').then(function(request){
		p.setObject(request.responseText);
		p.callThen();
	}).catch(function(){
		p.callCatch();
	});
	});
	return p;
};

/**
 * This method copies a reference of this object to the user's cloud clipboard so that the user can use it in other parts of your application using the method vn.cloud.use().
 * This allows the use of files accross applications within VN.
 */
VNCloudObject.prototype.pick=function()
{
	return vn.cloud.setObjectForUse(this);
};

/**
 * This method returns a promise that is triggered when the metadata of the object have been loaded and is ready to be used.
 * @return VNPromise A promise object that is triggered when the object has been loaded and is ready to be used. 
 */
VNCloudObject.prototype.whenReady=function(){return this.ready_promise;};

/**
 * This method returns the id of this cloud object.
 * @return string A string with the id of this object. 
 */
VNCloudObject.prototype.getId=function(){if(this.info)return this.info.VN_OID;};

VNCloudObject.prototype.applyDiff=function(diff){
	if(typeof this.info==='undefined')
		this.info={};
	vn.set(this.info,diff);
	for(v in diff)
		if(diff[v]==='') delete this.info[v];
};

/**
 * This method updates the metadata fields of this object. The fields to be updated should be given as an input object. If you want to delete a field of the file you can set it's value to a string of zero length.
 * Example: file.setFields({name:'Angelos', lastname: 'Barmpoutis', score: '50', deprecated_field:''});
 * @param data An object with the fields to be updated.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.setFields=function(data){
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		var dat={VN_OID:self.getId()};
			var i=0;
			for(f in data)
			{
				dat['f'+i]=f;
				dat['v'+i]=data[f];
				i+=1;
			}
		vn.http(vn.hosturl+'file/setfield.php',{method:'post',withCredentials:true,data:dat}).then(function(request){

				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					self.applyDiff(r.VN_DATA.VN_DIFF);
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){
				
				p.callCatch();
			});
	});return p;
};

/**
 *This method returns the metadata fields of this object. Make sure that the file has been loaded (using whenReady) before calling this method.
 *@return object An object with the metadata of this file.
 */
VNCloudObject.prototype.getFields=function(){return this.info;};

/**
 * This method updates the name (metadata field VN_NAME) of this file.
 * @param name A string with the new name of this file.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.rename=function(name){
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/rename.php',{method:'post',withCredentials:true,data:{VN_OID:self.getId(),VN_NAME:name}}).then(function(request){

				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					self.applyDiff(r.VN_DATA.VN_DIFF);
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){
				
				p.callCatch();
			});
	});return p;
};

/**
 * This method archives a file.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.archive=function()
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/archive.php',{method:'post',withCredentials:true,data:{VN_OID:self.getId()}}).then(function(request){

				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					self._reset();
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}

			}).catch(function(request){
				
				p.callCatch();
			});
	});return p;
};

/**
 * This method creates a new cloud object as a clone of this object.
 * @return VNCloudObject The cloud object that was created after this request.
 */
VNCloudObject.prototype.clone=function()
{
	var o=new VNCloudObject();
	var self=this;
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/clone.php',{method:'post',withCredentials:true,data:{VN_OID:self.getId()}}).then(function(request){
			var r=JSON.parse(request.responseText);
			if(r.VN_SUCCESS)
			{
				o.applyDiff(r.VN_DATA.VN_DIFF);		
				o.whenReady().callThen();
			}
			else 
			{
				if(r.VN_COMMENTS=='Authentication required.')
				{
					var ar=vn.cloud.getMe().whenAuthenticationRequired();
					ar.callThen();
					ar.reset();
				}
				o.whenReady().setObject(r);
				o.whenReady().callCatch();
			}
		}).catch(function(request){		
			o.whenReady().callCatch();
		});
	});
	return o;
};

/**
 * This method evolves this object as a clone of another object.
 * @param object The VNCloudObject to be cloned.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.evolve=function(object)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
	object.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/evolve.php',{method:'post',withCredentials:true,data:{VN_OID:self.getId(),VN_OID2:object.getId()}}).then(function(request){
			var r=JSON.parse(request.responseText);
			if(r.VN_SUCCESS)
			{
				self.applyDiff(r.VN_DATA.VN_DIFF);
				p.callThen();
			}
			else 
			{
				if(r.VN_COMMENTS=='Authentication required.')
				{
					var ar=vn.cloud.getMe().whenAuthenticationRequired();
					ar.callThen();
					ar.reset();
				}
				p.setObject(r);
				p.callCatch();
			}
		}).catch(function(request){
			p.callCatch();
		});
	});});return p;
};

/**
 * This method evolves this object as a clone of another object.
 * @param id A string with the id of the object to be cloned.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.evolveById=function(id)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/evolve.php',{method:'post',withCredentials:true,data:{VN_OID:self.getId(),VN_OID2:id}}).then(function(request){
			var r=JSON.parse(request.responseText);
			if(r.VN_SUCCESS)
			{
				self.applyDiff(r.VN_DATA.VN_DIFF);
				p.callThen();
			}
			else 
			{
				if(r.VN_COMMENTS=='Authentication required.')
				{
					var ar=vn.cloud.getMe().whenAuthenticationRequired();
					ar.callThen();
					ar.reset();
				}
				p.setObject(r);
				p.callCatch();
			}
		}).catch(function(request){
			p.callCatch();
		});
	});return p;
};

VNCloudObject.prototype.getHistory=function()
{
	return vn.cloud.getHistory(this.getId());
};

VNCloudObject.prototype.getFeed=function(postid)
{
	return vn.cloud.getFeed(this.getId(),postid);
};

VNCloudObject.prototype.getClones=function()
{
	return vn.cloud.getClones(this.getId());
};

/**
 * This method appends a given text to the log data of this file.
 * @param log A string with the name of the log index to be appended.
 * @param data A string with the information to be logged.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.log=function(log,data)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/log.php',{method:'post',withCredentials:true,data:{VN_OID:self.getId(),LOG_NAME:log,LOG_DATA:data}}).then(function(request){

				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.callCatch();
				}

			}).catch(function(request){
				
				p.callCatch();
			});
	});return p;
};

/**
 * This method uploads a data file to this cloud object.
 * @param options An object with one or more of the following fields: file (a JavaScript File object to be uploaded, or a string with the contents of a text to be uploaded), mime (a string with the MIME of the uploaded file), progress (a VNProgress object to be updated with the progress of this request).
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.upload=function(options)
{
	var opt=options||{};
	var file=opt.file;
	var mime=opt.mime;
	var progress=opt.progress;
	var filename=''; if(opt.filename)filename=opt.filename;
	var lastmodified=null;
	var originalfilesize=null;
	var self=this;
	var p=new VNPromise(this);
	if(typeof progress==='undefined')progress=new VNProgress();
	if(progress!=vn.getProgress()){
		progress.whenOneMoreToDo().then(function(n){vn.getProgress().oneMoreToDo(n);});
		progress.whenOneMoreDone().then(function(n){vn.getProgress().oneMoreDone(n);});	
	}
	var chunk_size=100000;	
	var VN_FILE_ENCODING='none';
	
	var upload=function(buffer)
	{
		progress.oneMoreDone();
		var sent=0;
		var chunk_id=0;
		var t0=new Date().getTime();
		var sz=buffer.byteLength;
		progress.oneMoreToDo(Math.ceil(sz/chunk_size)+1);
				
		function upload_chunk()
		{
			if(sent>=buffer.byteLength)
			{
				var d={method:'post',withCredentials:true,data:{VN_OID:self.getId()}};
				if(opt.mime)d.data.VN_FILE_MIME=opt.mime;
				if(filename.length>0)d.data.VN_FILE_NAME=filename;
				if(lastmodified)d.data.VN_FILE_MODIFIED=lastmodified;
				d.data.VN_FILE_ENCODING=VN_FILE_ENCODING;
				if(originalfilesize)d.data.VN_ORIGINAL_FILE_SIZE=originalfilesize;
				vn.http(vn.hosturl+"file/mergeparts.php",d).
				then(function(request){
					var r=JSON.parse(request.responseText);
					if(r.VN_SUCCESS)
					{
						self.applyDiff(r.VN_DATA.VN_DIFF);
						progress.oneMoreDone();
						p.callThen();
					}
					else 
					{
						if(r.VN_COMMENTS=='Authentication required.')
						{
							var ar=vn.cloud.getMe().whenAuthenticationRequired();
							ar.callThen();
							ar.reset();
						}
						p.setObject(r);
						p.callCatch();
						return;
					}
				}).catch(function(){p.callCatch();});
			}
			else
			{
				var chunk_file={filename:filename,data:new Uint8Array(buffer,sent,Math.min(chunk_size,buffer.byteLength-sent))};
				var files={};files['part'+chunk_id]=chunk_file;
				vn.http(vn.hosturl+"file/uploadfilepart.php",{method:'post',withCredentials:true,data:{VN_OID:self.getId()},files:files}).
				then(function(request){
					progress.oneMoreDone();
					
					
					var r=JSON.parse(request.responseText);
					if(r.VN_SUCCESS){}
					else
					{
						if(r.VN_COMMENTS=='Authentication required.')
						{
							var ar=vn.cloud.getMe().whenAuthenticationRequired();
							ar.callThen();
							ar.reset();
						}
						p.setObject(r);
						p.callCatch();
						return;
					}
					chunk_id+=1;
					sent+=chunk_size;
					
					var t=Math.round((new Date().getTime()-t0)/1000);
					var rem=Math.floor(Math.max(0,t*(sz-sent)/sent));
					
					//if(rem>=60) c.println(Math.ceil(rem/60)+' min. remaining.');
					//else if(rem>5) c.println(rem+' sec. remaining.');
					//else c.println('Almost done.');
					
					upload_chunk();
				}).
				catch(function(request){
					p.callCatch();
				});
			}
		}//end of upload_chunk() 
		upload_chunk();
	};
	
	var do_upload=function(buffer)
	{
		originalfilesize=buffer.byteLength;
		
		var e=vn.cloud.encoder;
		e.encode(buffer).then(function(b){
			VN_FILE_ENCODING='deflate_shift1'; 
			upload(b);
		});
	};
	
	var init_upload=function()
	{
	
		
		if(file instanceof File)
		{
			var reader = new FileReader();
			reader.onload = function(event) {
				if ('name' in file)filename=file.name;
				if('lastModified' in file) lastmodified=file.lastModified;		
				do_upload(event.target.result);
			}
			reader.readAsArrayBuffer(file);
		}
		else if(file instanceof ArrayBuffer)
		{
			do_upload(file);
		}
		else if(file instanceof Uint8Array)
		{
			var buffer = new ArrayBuffer(file);
			var bufView = new Uint8Array(buffer);
			for (var i=0, strLen=file.length; i<strLen; i++) {
				bufView[i] = file[i];
			}
			do_upload(buffer);
		}
		else if(typeof file === 'string')
		{
			
			function toUTF8Array(str) {
				var utf8 = [];
				for (var i=0; i < str.length; i++) {
					var charcode = str.charCodeAt(i);
					if (charcode < 0x80) utf8.push(charcode);
					else if (charcode < 0x800) {
						utf8.push(0xc0 | (charcode >> 6), 
								  0x80 | (charcode & 0x3f));
					}
					else if (charcode < 0xd800 || charcode >= 0xe000) {
						utf8.push(0xe0 | (charcode >> 12), 
								  0x80 | ((charcode>>6) & 0x3f), 
								  0x80 | (charcode & 0x3f));
					}
					// surrogate pair
					else {
						i++;
						// UTF-16 encodes 0x10000-0x10FFFF by
						// subtracting 0x10000 and splitting the
						// 20 bits of 0x0-0xFFFFF into two halves
						charcode = 0x10000 + (((charcode & 0x3ff)<<10)
								  | (str.charCodeAt(i) & 0x3ff));
						utf8.push(0xf0 | (charcode >>18), 
								  0x80 | ((charcode>>12) & 0x3f), 
								  0x80 | ((charcode>>6) & 0x3f), 
								  0x80 | (charcode & 0x3f));
					}
				}
				return utf8;
			}
			var utf8=toUTF8Array(file);
			var buffer = new ArrayBuffer(utf8.length);
			var bufView = new Uint8Array(buffer);
			for (var i=0, strLen=utf8.length; i<strLen; i++) {
				bufView[i] = utf8[i];
			}
			do_upload(buffer);
		}
	};
	
	this.whenReady().then(function(){
		progress.oneMoreToDo();
		init_upload();
	
	});
	return p;
};

VNCloudObject.prototype.uploadChildren=function(files,options)
{
	var opt=options||{};
	
	var progress=opt.progress;
	var p=new VNPromise(this);
	if(typeof progress==='undefined')progress=new VNProgress();
	if(progress!=vn.getProgress()){
		progress.whenOneMoreToDo().then(function(n){vn.getProgress().oneMoreToDo(n);});
		progress.whenOneMoreDone().then(function(n){vn.getProgress().oneMoreDone(n);});
	}	
	var s=this;
	
	
	function perform_upload(file)
	{	
	var o=vn.cloud.getMe().newObject();//We request from the server to create a new object
	progress.oneMoreToDo(4);
	o.whenReady().then(function(o){//when the server creates the object
		progress.oneMoreDone();
		o.rename(file.name).then(function(){//we request from the server to rename the object
			progress.oneMoreDone();
			s.add(o).then(function(){//we request from the server to add this file into a particular folder
				progress.oneMoreDone();

				//We send the binary data from the file to the server
				o.upload({file:file,progress:progress}).then(function()
				{
					progress.oneMoreDone();
					s.update();
					p.setObject(o);
					p.callThen();
				}).catch(function(){
					progress.oneMoreDone();
				});
				
			}).catch(function(){
				progress.oneMoreDone(2);
			});
		}).catch(function(){
			progress.oneMoreDone(3);
		});
	}).catch(function(){
		progress.oneMoreDone(4);
		
		//if permission denied prompt login
		
	});	
	}
	
	for(var i=0;i<files.length;i++)
	{
		perform_upload(files[i]);
	}
	return p;
};

/**
 * This method downloads the data file of this cloud object.
 * @param options An optional object with one or more of the following fields: type (a string with the desired format of data delivery such as "string","blob","url". The default format is Uint8Array.).
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.download=function(options)
{
	if(this.info && this.info.VN_FILE_MIME)vn.default(options,{mime:this.info.VN_FILE_MIME});
	return vn.cloud.download(this.getId(),options);
};

/**
 * This method updates list of the children objects contained in this cloud object.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.update=function()
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/updatelist.php',{method:'post',withCredentials:true,data:{VN_LID:self.getId()}}).then(function(request){
			var r=JSON.parse(request.responseText);
			if(r.VN_SUCCESS)
			{
				if(typeof self.info.VN_LIST==='undefined') self.info.VN_LIST=[];
				self.applyDiff(r.VN_DATA.VN_DIFF);
				p.callThen();
			}
			else 
			{
				if(r.VN_COMMENTS=='Authentication required.')
				{
					var ar=vn.cloud.getMe().whenAuthenticationRequired();
					ar.callThen();
					ar.reset();
				}
				p.setObject(r);
				p.callCatch();
			}
		}).catch(function(request){		
			p.callCatch();
		});
	});return p;
};

/**
 *This method returns the list of the children cloud objects of this object. Make sure that the file has been loaded (using whenReady) before calling this method.
 *@return object An associative list with the children objects of this file indexed by their IDs.
 */
VNCloudObject.prototype.getContentList=function()
{
	return this.info.VN_LIST;
};

/**
 *This method returns a child cloud object with a given ID. Make sure that the file has been loaded (using whenReady) before calling this method.
 *@return VNCloudObject The desired child cloud object or null if this ID does not correspond to a child of this object.
 */
VNCloudObject.prototype.getChildById=function(id)
{
	if(this.info.VN_LIST[id]) return vn.cloud.getObject(id);
	else return null;
};

/**
 *This method returns the ID of a child cloud object with a given name. Make sure that the file has been loaded (using whenReady) before calling this method.
 *@return string The ID of the desired child cloud object or null if this name does not correspond to a child of this object.
 */
VNCloudObject.prototype.getChildIdByName=function(name)
{
	for(var id in this.info.VN_LIST)
	{
		if(this.info.VN_LIST[id].VN_NAME==name)
			return id;
	}
	return null;
};

/**
 *This method returns a child cloud object with a given name. Make sure that the file has been loaded (using whenReady) before calling this method.
 *@return VNCloudObject The desired child cloud object or null if this name does not correspond to a child of this object.
 */
VNCloudObject.prototype.getChildByName=function(name)
{
	var id=this.getChildIdByName(name);
	if(id)return vn.cloud.getObject(id);
	return null;
};

/**
 * This method adds a given cloud object as a child of this object.
 * @param VNCloudObject Another cloud object to be added as a child of this object.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.add=function(obj)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
	obj.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/addtolist.php',{method:'post',withCredentials:true,data:{VN_OID:obj.getId(),VN_LID:self.getId()}}).then(function(request){
				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					if(typeof self.info.VN_LIST==='undefined') self.info.VN_LIST=[];
					self.info.VN_LIST[obj.getId()]={VN_CLASS:obj.info.VN_CLASS||"",VN_NAME:obj.info.VN_NAME||""};
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){		
				p.callCatch();
			});
	});});return p;
};

/**
 * This method adds a given cloud object as a child of this object.
 * @param string A string with the unique ID of a cloud object to be added as a child of this object.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.addById=function(obj_oid)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/addtolist.php',{method:'post',withCredentials:true,data:{VN_OID:obj_oid,VN_LID:self.getId()}}).then(function(request){
				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					if(typeof self.info.VN_LIST==='undefined') self.info.VN_LIST=[];
					self.info.VN_LIST[obj_oid]={VN_CLASS:"",VN_NAME:""};
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){		
				p.callCatch();
			});
	});return p;
};

/**
 * This method removes a given cloud object from the children of this object.
 * @param VNCloudObject A cloud object to be removed from the children of this object.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.remove=function(obj)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
	obj.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/removefromlist.php',{method:'post',withCredentials:true,data:{VN_OID:obj.getId(),VN_LID:self.getId()}}).then(function(request){
				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					if(self.info.VN_LIST[obj.getId()])
						delete self.info.VN_LIST[obj.getId()];
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){		
				p.callCatch();
			});
	});});return p;
};

/**
 * This method removes a given cloud object from the children of this object.
 * @param string A string with the unique ID of the cloud object to be removed from the children of this object.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.removeById=function(obj_oid)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/removefromlist.php',{method:'post',withCredentials:true,data:{VN_OID:obj_oid,VN_LID:self.getId()}}).then(function(request){
				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					if(self.info.VN_LIST[obj_oid])
						delete self.info.VN_LIST[obj_oid];
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){		
				p.callCatch();
			});
	});return p;
};

/**
 * This method posts a given cloud object to the feed of this object.
 * @param VNCloudObject Another cloud object to be posted in the feed of this object.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.post=function(obj)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
	obj.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/post.php',{method:'post',withCredentials:true,data:{VN_OID:obj.getId(),VN_TID:self.getId()}}).then(function(request){
				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					self.applyDiff(r.VN_DATA.VN_DIFF);
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){		
				p.callCatch();
			});
	});});return p;
};

/**
 * This method posts a given cloud object to the feed of this object.
 * @param string A string with the unique ID of the cloud object to be posted to the feed of this object.
 * @return VNPromise A promise object associated with the result of this request.
 */
VNCloudObject.prototype.postById=function(obj_oid)
{
	var self=this;
	var p=new VNPromise(this);
	this.whenReady().then(
	function(){
		vn.http(vn.hosturl+'file/addtolist.php',{method:'post',withCredentials:true,data:{VN_OID:obj_oid,VN_TID:self.getId()}}).then(function(request){
				var r=JSON.parse(request.responseText);
				if(r.VN_SUCCESS)
				{
					self.applyDiff(r.VN_DATA.VN_DIFF);
					p.callThen();
				}
				else 
				{
					if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
					p.setObject(r);
					p.callCatch();
				}
			}).catch(function(request){		
				p.callCatch();
			});
	});return p;
};

/** 
 * This class contains the information and functionality of a VN cloud user. Objects of this class are generated by vn.cloud.getObject or other methods such as vn.cloud.getMe().newObject. A file in the VN cloud has a list of metadata fields that can be edited using this class, and possibly a data file (such as a binary or a text file). In addition a file may contain other files and thus behave as a folder.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var me=vn.cloud.getMe();	<br>
 * <br>
 *	me.whenReady().then(function(){<br>
 *		console.log('already logged in');<br>
 *	}).otherwise(function(){<br>
 *		console.log('not logged in');<br>
 * //here you can prompt login with me.login<br>
 *	});<br>
 *	<br>
 *	me.whenLogin().then(function(){<br>
 *		console.log('just logged in');<br>
 *	});<br>
 *	<br>
 *	me.whenLogout().then(function(){<br>
 *		console.log('just logged out');	<br>
 *	});<br>
 *	<br>
 *	me.whenAuthenticationRequired().then(function(){<br>
 *		console.log('authentication required');<br>
 *	});<br></font>
 */
function VNCloudUser(id)
{
	VNCloudObject.call(this);
	
	this._login_w=null;
	this._login_p=new VNPromise();
	this._logout_p=new VNPromise();
	this._auth_p=new VNPromise();
	this._system_list={};
	if(id) this._uid=id;
}

/**
 * This method resets the user object by dowloading again the metadata and creating a new promise object for whenReady. 
 */
VNCloudUser.prototype.reset=function()
{
	this.ready_promise=new VNPromise(this);
	delete this.info;
	this._system_list={};
	
	var o=this;
	if(typeof this._uid==='undefined')
	vn.http(vn.hosturl+'file/me.php',{method:'get',withCredentials:true,withCredentials:true}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS)
		{
			o.info=r.VN_DATA['VN_INFO'];
			o.whenReady().callThen();
		}
		else 
		{
			o.whenReady().setObject(r);
			o.whenReady().callCatch();
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	else
	vn.http(vn.hosturl+'file/info.php',{method:'post',withCredentials:true,data:{VN_OID:this._uid}}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS===false)
		{
			if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
			o.whenReady().setObject(r);
			o.whenReady().callCatch();
		}
		else 
		{
			o.info=r;
			o.whenReady().callThen();
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
};

/**
 * This method returns a system data file of this user such as root, trash, desktop, etc.
 * @param list_name A string with the name of the data file. Case sensitive.
 * @return VNCloudObject The cloud object that corresponds to this request.
 */
VNCloudUser.prototype.getSystemData=function(list_name)
{
	if(typeof vn.cloud._system_lists[list_name]==='undefined')return;	
	if(this._system_list[list_name])return this._system_list[list_name];
	
	var o=new VNCloudObject();
	this._system_list[list_name]=o;
	var self=this;
	
		var o2=self.getAppData(vn.cloud._system_lists[list_name]);
		o2.whenReady().then(function(){
			self._system_list[list_name]=o;
			
			o.info=o2.info;
			o.whenReady().callThen();
			
			}).otherwise(function(e){	
			
			if(e.VN_COMMENTS=='Application data not installed.')
			{
				//if first time then install
				var o3=self.installAppData(vn.cloud._system_lists[list_name]);
				o3.whenReady().then(function(){
					console.log(list_name+' installed');
					o.info=o3.info;
					o.whenReady().callThen();
				}).otherwise(function(e){
					o.whenReady().setObject(e);
					o.whenReady().callOtherwise();
				});
			}
			else 
			{
				o.whenReady().setObject(e);
				o.whenReady().callOtherwise();
			}
		});
	
	return o;
};

/**
 * This method creates a new cloud object.
 * @param VN_CLASS An optional parameter with a string that contains the type of the object, such as "List", "AppData", etc. Case sensitive.
 * @return VNCloudObject The cloud object that was created after this request.
 */
VNCloudUser.prototype.newObject=function(VN_CLASS)
{
	var o=new VNCloudObject();
	var data={};
	var f='new.php';
	if(VN_CLASS)
	{
		data.VN_CLASS=VN_CLASS;
		if(VN_CLASS=='List')f='newlist.php';
		else if(VN_CLASS=='AppData')f='newappdata.php';
		else if(VN_CLASS=='Post')f='newpost.php';
		else if(VN_CLASS=='3D Model')f='new3dmodel.php';
	}
	vn.http(vn.hosturl+'file/'+f,{method:'post',withCredentials:true,data:data}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS)
		{
			o.applyDiff(r.VN_DATA.VN_DIFF);		
			o.whenReady().callThen();
		}
		else 
		{
			if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
			o.whenReady().setObject(r);
			o.whenReady().callCatch();
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	return o;
};

/**
 * If this is the first time that this user attempts to access this data file, a new data file is created for this user and returned. If the user has already such data file, the installation fails (whenReady().otherwise() will be called in the returned object). 
 * @param oid A string with the ID of the app data object.
 * @return VNCloudObject The cloud object that corresponds to this request.
 */
VNCloudUser.prototype.installAppData=function(oid)
{
	var o=new VNCloudObject();
	if(typeof this._uid==='undefined')
	vn.http(vn.hosturl+'file/installappdata.php',{method:'post',withCredentials:true,data:{VN_OID:oid}}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS)
		{
			o.applyDiff(r.VN_DATA.VN_DIFF);		
			o.whenReady().callThen();
		}
		else 
		{
			if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
			o.whenReady().setObject(r);
			o.whenReady().callCatch();
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	else o.whenReady().callCatch();
		
	return o;
};

/**
 * This method returns an application data file of this user. If this user does not have such a file, this request will fail (whenReady().otherwise() will be called in the returned object).
 * @param oid A string with the ID of the app data object.
 * @return VNCloudObject The cloud object that corresponds to this request.
 */
VNCloudUser.prototype.getAppData=function(oid)
{
	var o=new VNCloudObject();
	var data={VN_OID:oid};
	if(typeof this._uid!=='undefined')
		data.VN_UID=this._uid;
	
	vn.http(vn.hosturl+'file/getappdata.php',{method:'post',withCredentials:true,data:data}).then(function(request){
		var r=JSON.parse(request.responseText);
		if(r.VN_SUCCESS===false)
		{
			if(r.VN_COMMENTS=='Authentication required.')
					{
						var ar=vn.cloud.getMe().whenAuthenticationRequired();
						ar.callThen();
						ar.reset();
					}
			o.whenReady().setObject(r);
			o.whenReady().callCatch();
		}
		else 
		{
			o.info=r;
			o.whenReady().callThen();
		}
	}).catch(function(request){		
		o.whenReady().callCatch();
	});
	return o;
};

/**
 * This method returns an application data file of this user. If this is the first time that this user attempts to access this data file, a new data file is created for this user and returned.
 * @param oid A string with the ID of the app data object.
 * @return VNCloudObject The cloud object that corresponds to this request.
 */
VNCloudUser.prototype.getAppDataInstalled=function(oid)
{
	var o=new VNCloudObject();
	var self=this;
	
		var o2=self.getAppData(oid);
		o2.whenReady().then(function(){
			
			o.info=o2.info;
			o.whenReady().callThen();
			
		}).catch(function(e){	
		
			//if first time then install
			if(e.VN_COMMENTS=='Application data not installed.')
			{
				var o3=self.installAppData(oid);
				o3.whenReady().then(function(){
					console.log(oid+' installed');
					
					o.info=o3.info;
					o.whenReady().callThen();
					}).otherwise(function(e){	
					o.whenReady().setObject(e);
					o.whenReady().callOtherwise();
				});
			}
			else 
			{
				o.whenReady().setObject(e);
				o.whenReady().callOtherwise();
			}
		});
	
	return o;
};

/**
 * This method returns a window object to be shown when the session of the user expires. This method guarantees that the same one window will be shown even if the whenAuthenticationRequired event is handled by more than one callback functions. 
 * @param wm A WindowManager object that will handle the window to be generated.
 * @return VNWindow The generated window. It is hidden by default.
 */
VNCloudUser.prototype.getSessionExpiredWindow=function(wm)
{
	if(this._expwin)return this._expwin;
	
	if(typeof wm=='undefined')wm=vn.getWindowManager();
	var w_=wm.createWindow({width:330,height:120});
	w_.block(false);
	w_.setCanClose(false);
	w_.setCanMinimize(false);
	w_.setCanMaximize(false);
	w_.setCanResize(false);
	w_.setIcon(vn.hosturl+'js/img/VNlogo256.png');
	w_.hide();
	this._expwin=w_;
	return w_;
};

/**
 * This method returns a window object to be shown when the user logs out. 
 * @param wm A WindowManager object that will handle the window to be generated.
 * @return VNWindow The generated window.
 */
VNCloudUser.prototype.showLoggedOutWindow=function(wm)
{
	if(typeof wm=='undefined')wm=vn.getWindowManager();
	
	var w=this.getSessionExpiredWindow(wm);
	w.setTitle('Logged out.');
	w.getContentDiv().style.background='rgba(0,0,0,0)';
	w.show();
	wm.createNotification('Logged out.',{background:'rgb(128,98,165)'});

	vn.wait({seconds:3}).then(function(){window.location.reload();});
	
	var requestMethod=document.exitFullscreen||document.webkitExitFullscreen||document.mozExitFullscreen||document.msExitFullscreen;
	if(requestMethod)requestMethod.call(document);
	return w;
};

/**
 * This method logs in the user so that various VN cloud operations can be performed such as create new files, or modify existing ones. If this request is successful, the whenLogin event will be triggered.
 * @param wm A WindowManager object that will handle the login window if shown.
 * @param directly An optional boolean parameter that forces the login window to be open, even if the user is already logged in. By default this parameter is false, which bypasses the window if the user is already logged in. 
 * @return VNPromise A promise object that corresponds to the result of this request.
 */
VNCloudUser.prototype.login=function(wm,directly)
{
	if(this._login_w)
		return this._login_w;
	
	var opt={wm:wm,directly:directly};
	if(typeof opt.wm==='undefined')opt.wm=vn.getWindowManager();
	
	this._login_w=new VNPromise();
	var p=this._login_w;
	var self=this;
	p.then(function(){self._login_w=null;self.reset();self.whenReady().then(function(){self._login_p.callThen();self._login_p.reset();});}).catch(function(){self._login_w=null;});
	function create_win(url)
	{
		if(typeof opt.wm=='undefined')return;
		var w_=opt.wm.createWindow({width:330,height:180});
		w_.block(false);
		w_.setCanClose(true);
		w_.setCanMinimize(false);
		w_.setCanMaximize(false);
		w_.setCanResize(false);
		w_.setTitle('Login');
		w_.setIcon(vn.hosturl+'js/img/VNlogo256.png');
		var i=document.createElement('iframe');
		i.style.width='100%';
		i.style.height='100%';
		i.style.border='0px';
		i.src=url;
		w_.iframe=i;
		var d=w_.getContentDiv();
		d.appendChild(i);
		
		var decoration_width=w_.getWidth()-parseInt(d.clientWidth);
		var decoration_height=w_.getHeight()-parseInt(d.clientHeight);
		w_.setSize(330+decoration_width,180+decoration_height);
		w_.center();
		
		w_.whenClosed().then(function(){
			i.src=url;
			w_.cancelClosing();
		});
		
		function receiveMessage(evt)
		{
			if(evt.data=='ggl'||evt.data=='fb'||evt.data=='vn') 
			{
				w_.destroy();window.removeEventListener("message",receiveMessage);
				p.callThen();
			}
			else if(evt.data.indexOf('VN_SID=')==0)
			{
						
				w_.getContentDiv().removeChild(i);
				var div=document.createElement('div');
				w_.getContentDiv().appendChild(div);
				vn.set(div.style,{position:'absolute',height:'100%',width:'100%',display:'table',backgroundColor:'black'});
				var div2=document.createElement('div');
				div.appendChild(div2);
				vn.set(div2.style,{position:'relative',verticalAlign:'middle',display:'table-cell'});
				var div3=document.createElement('div');
				div2.appendChild(div3);
				vn.set(div3.style,{position:'relative',width:'100%',height:'50px',color:'white',textAlign:'center',background:'rgb(128,98,165)',borderRadius:'9px',fontFamily:'Arial',fontSize:'30px',cursor:'pointer',lineSize:'50px',border:'5px solid black',boxSizing:'border-box'});
				div3.innerHTML='Enter';
				
				
				div3.addEventListener('click',function(){
					window.open(vn.hosturl+'file/session.php?'+evt.data,'_blank');
					
					var check=function()
					{
						
						var me=new VNCloudUser();
						me.reset();
						me.whenReady().then(function(){
							w_.destroy();window.removeEventListener("message",receiveMessage);
							p.callThen();
						}).otherwise(function(){
							vn.wait({seconds:1}).then(check);
						});							
					};
					vn.wait({seconds:1}).then(check);
				});
			}
		}
		
		window.addEventListener("message", receiveMessage, false);
		
	}
	if(document.location.origin+'/'===vn.hosturl){}else directly=true;
	if(directly)
	{
		create_win(vn.hosturl+'file/login.php');
	}
	else this.renew_authentication().then(function(){p.callThen();}).catch(function(){create_win(vn.hosturl+'file/login.php');});
	return p;
};

VNCloudUser.prototype.renew_authentication=function()
{
	var p_out=new VNPromise();
	var p=new VNPromise();
	var catch_count=0;
	p.then(function(){p_out.callThen();}).catch(function(){
	 catch_count+=1;if(catch_count==2)p_out.callCatch();});
	 function fb(){
  vn.import("https://connect.facebook.net/en_US/sdk.js").then(function() {
FB.init({
    appId      : '1776868085935475',
    cookie     : true,  // enable cookies to allow the server to access 
                        // the session
    xfbml      : true,  // parse social plugins on this page
    version    : 'v2.2' // use graph api version 2.5
  });


  FB.getLoginStatus(function(response) {
	statusChangeCallback(response);
  });

  }).catch(function(){
	  p.callCatch();
  });
	 

 function statusChangeCallback(response) {
	if (response.status === 'connected') {
      
	  vn.http(vn.hosturl+"file/login.php",{method:"post",withCredentials:true,data:{fb_token:true}}).then(function(request){
		  var r=JSON.parse(request.responseText);
		  if(r.VN_SUCCESS)p.callThen();
		  else p.callCatch();
		  }).catch(function(response){console.log('error');p.callCatch();});
	  
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
	  p.callCatch();
     
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
	 p.callCatch();
    }
  }
	 }
	 
	 function ggl()
	{
		vn.import("https://apis.google.com/js/api.js").then(function(){
			gapi.load('client:auth2', function(){
        
	    if(gapi.auth2.getAuthInstance())
		{
			if(gapi.auth2.getAuthInstance().isSignedIn.get())
				onSignIn(gapi.auth2.getAuthInstance().currentUser.get());
			else p.callCatch();
		}
	    else gapi.auth2.init({
            client_id: '553026211426-ihogu6a3ncrlg2nrgaotdaegmm5u398q.apps.googleusercontent.com',
			scope:'profile email'
        }).then(function () {
	// Listen for sign-in state changes.
    //gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    if(gapi.auth2.getAuthInstance().isSignedIn.get())
		onSignIn(gapi.auth2.getAuthInstance().currentUser.get());
	else p.callCatch();
  
    //signinButton.addEventListener("click", handleSigninClick);
    //signoutButton.addEventListener("click", handleSignoutClick);
  });	
		  });
			
		}).catch(function(){
	  p.callCatch();
	});
		
		function onSignIn(googleUser) {
        var id_token = googleUser.getAuthResponse().id_token;
		vn.http(vn.hosturl+"file/login.php",{method:"post",withCredentials:true,data:{id_token:id_token}}).then(function(request){
			var r=JSON.parse(request.responseText);
		  if(r.VN_SUCCESS)p.callThen();
		  else p.callCatch();}).catch(function(response){
			  //console.log('error');
			  p.callCatch();
			  });
      };
	}

	
	this.reset();
	  this.whenReady().then(function(){p.callThen();}).catch(function(e){
		if(e.VN_COMMENTS=='Authentication required.')
		{
			fb();
			ggl();
		}
	});
	 
	 return p_out;
	 
};

/**
 * This method logs out the user from an existing VN cloud session. If this request is successful, the whenLogout event will be triggered.
 * @return VNPromise A promise object that corresponds to the result of this request.
 */
VNCloudUser.prototype.logout=function(wm)
{
	var p=new VNPromise();
	var opt={wm:wm};
	if(typeof opt.wm==='undefined')opt.wm=vn.getWindowManager();
	
	var self=this;
	p.then(function(){self.reset();self._logout_p.callThen();self._logout_p.reset();});
	function create_win(url)
	{
		if(typeof opt.wm=='undefined')return;
		var w_=opt.wm.createWindow({width:330,height:180});
		w_.block(false);
		w_.setCanClose(false);
		w_.setCanMinimize(false);
		w_.setCanMaximize(false);
		w_.setCanResize(false);
		w_.setTitle('Logout');
		w_.setIcon(vn.hosturl+'js/img/VNlogo256.png');
		var i=document.createElement('iframe');
		i.style.width='100%';
		i.style.height='100%';
		i.style.border='0px';
		i.src=url;
		w_.iframe=i;
		var d=w_.getContentDiv();
		d.appendChild(i);
		
		var decoration_width=w_.getWidth()-parseInt(d.clientWidth);
		var decoration_height=w_.getHeight()-parseInt(d.clientHeight);
		w_.setSize(330+decoration_width,40+decoration_height);
		w_.center();
		function receiveMessage(evt)
		{
			if(evt.data=='ggl'||evt.data=='fb'||evt.data=='vn') 
			{
				w_.close();window.removeEventListener("message",receiveMessage);
				p.callThen();
			}
		}
	
		window.addEventListener("message", receiveMessage, false);
	}
	
	create_win(vn.hosturl+'file/logout.php');
	return p;
}

/** 
 * This method returns a promise object that is triggered when this user logs in.
 * @return VNPromise The promise object that is associated with this event. 
 */
VNCloudUser.prototype.whenLogin=function(){return this._login_p;};
/** 
 * This method returns a promise object that is triggered when this user logs out.
 * @return VNPromise The promise object that is associated with this event. 
 */
VNCloudUser.prototype.whenLogout=function(){return this._logout_p;};
/** 
 * This method returns a promise object that is triggered when this user needs to authenticate because the existing session expired.
 * @return VNPromise The promise object that is associated with this event. 
 */
VNCloudUser.prototype.whenAuthenticationRequired=function(){return this._auth_p;};

vn.extend(VNCloudObject,VNCloudUser);
VNCloudUser.prototype.upload=undefined;

function MetadataViewerWindow(cloud_object,wm,options)
{
	VNWindow.call(this,wm,{width:600,height:600});
	var self=this;
	this.setTitle('Metadata Viewer - '+cloud_object.info['VN_NAME']);
	vn.import('vn.file-viewers').then(function()
	{
		self.getContentDiv().appendChild(new DefaultFileViewer(cloud_object).getDiv());
	});
}
vn.extend(VNWindow,MetadataViewerWindow);

function CloudTreeFileObject(oid)
{
	TreeFileObject.call(this);
	this.oid=oid;
	
	this.whenSelected().then(function(object){
		var root=object.getRoot();
	
		object.cloudObject=vn.cloud.getObject(object.oid);
		object.cloudObject.clientObject=object;
		
		if(root)root.getProgress().oneMoreToDo();
		object.cloudObject.whenReady().then(function(){
			
			if(root)root.getProgress().oneMoreDone();
			if(root && root.whenCloudObjectSelected)
			{
				root.whenCloudObjectSelected().callThen({object:object.cloudObject});
			}		
		}).catch(function(){
			if(root)root.getProgress().oneMoreDone();
		});
		
	});
}

CloudTreeFileObject.prototype.glue=function(cloud_object)
{
	cloud_object.clientObject=this;
	this.cloudObject=cloud_object;
	this.oid=cloud_object.getId();
};

CloudTreeFileObject.prototype._makeAdd=function(info,cloudObject)
{
	if(info.VN_CLASS=='List')
	{
		var f=new CloudTreeFolderObject(info.VN_OID);
		f.setName(info.VN_NAME);
		f.VN_CLASS=info.VN_CLASS;
		if(cloudObject){
			f.glue(cloudObject);
			f.removeAll();
			if(cloudObject.info.VN_LIST)
			for(var VN_OID in cloudObject.info.VN_LIST)
			{
				f._makeAdd({VN_OID:VN_OID,VN_CLASS:cloudObject.info.VN_LIST[VN_OID].VN_CLASS,VN_NAME:cloudObject.info.VN_LIST[VN_OID].VN_NAME});
			}
			f.sort();
			f.populate();
		}
		this.add(f);
		return f;
	}
	else 
	{
		var f=new CloudTreeFileObject(info.VN_OID);
		if(info.VN_CLASS=='AppData')
		{
			f.setIcon(vn.hosturl+'js/img/app-icon.png');
		}
		else if(info.VN_CLASS=='Image'||info.VN_CLASS=='SVG')
			f.setIcon(vn.hosturl+'file/'+info.VN_OID+'/thumb.jpg');
		else if(info.VN_CLASS=='Audio')
			f.setIcon(vn.hosturl+'js/img/audio-icon.png');
		else if(info.VN_CLASS=='User')
			f.setIcon(vn.hosturl+'file/'+info.VN_OID+'/picture.jpg');
		f.setName(info.VN_NAME);
		f.VN_CLASS=info.VN_CLASS;
		if(cloudObject)f.glue(cloudObject);
		this.add(f);
		return f;
	}
};


CloudTreeFileObject.prototype.pick=function()
{
	this.cloudObject.pick();
};

CloudTreeFileObject.prototype.rename=function(name)
{
	var root=this.getRoot();
	var self=this;
	
	if(name.length==0)return;
	if(name==this.getName())return;//name did not change
	
	var o=this.cloudObject||vn.cloud.getObject(this.oid);
	root.getProgress().oneMoreToDo(2);
	o.rename(name).then(function(o){
		root.getProgress().oneMoreDone();
		self.setName(o.info.VN_NAME);
		delete o._viewer;
		if(root.whenCloudObjectSelected)root.whenCloudObjectSelected().callThen({object:o});
		self.getParent().cloudObject.update().then(function(l){
			root.getProgress().oneMoreDone();
		}).catch(function(){
			root.getProgress().oneMoreDone();
		});
	}).catch(function(){
		root.getProgress().oneMoreDone(2);
	});
};

CloudTreeFileObject.prototype.moveToTrash=function(trash)
{
	var root=this.getRoot();
	var self=this;
	
	var p=this.getParent();
	root.getProgress().oneMoreToDo();
	p.cloudObject.removeById(this.oid).then(function(){
		root.getProgress().oneMoreDone();
		p.remove(self);

		if(trash instanceof VNCloudObject)
			trash.addById(self.oid).then(function(){});
		else trash.cloudObject.addById(self.oid).then(function(){
			trash.add(self);
		});
		
	}).catch(function(){
		root.getProgress().oneMoreDone();
	});
};

CloudTreeFileObject.prototype.purge=function()
{
	var root=this.getRoot();
	var self=this;
	
	root.getProgress().oneMoreToDo();
	var p=this.getParent();
	p.cloudObject.removeById(this.oid).then(function(){
		root.getProgress().oneMoreDone();
		p.remove(self);
		}).catch(function(){
		root.getProgress().oneMoreDone();
	});
};

CloudTreeFileObject.prototype.clone=function(alternative_folder)
{
	var root=this.getRoot();
	var folder=alternative_folder||this.getParent();
	var p=new VNPromise(this);
	var o=this.cloudObject.clone();
	root.getProgress().oneMoreToDo(2);
	o.whenReady().then(function(){
		root.getProgress().oneMoreDone();
		folder.cloudObject.add(o).then(function(){
			root.getProgress().oneMoreDone();
			var f=folder._makeAdd({VN_OID:o.getId(),VN_CLASS:o.info.VN_CLASS,VN_NAME:o.info.VN_NAME},o);	
			folder.expand();
			f.select();
			p.callThen();
		}).catch(function(){
			root.getProgress().oneMoreDone();
			p.callCatch();
		});
	}).catch(function(){
		root.getProgress().oneMoreDone(3);
		p.callCatch();
	});
	return p;
};

CloudTreeFileObject.prototype.evolve=function(id)
{
	var root=this.getRoot();
	var self=this;
	var p=new VNPromise(this);
	var o=this.cloudObject||vn.cloud.getObject(this.oid);
	root.getProgress().oneMoreToDo(2);
	o.evolveById(id).then(function(o){
		root.getProgress().oneMoreDone();
		self.setName(o.info.VN_NAME);
		delete o._viewer;
		if(root.whenCloudObjectSelected)root.whenCloudObjectSelected().callThen({object:o});
		self.getParent().cloudObject.update().then(function(l){
			root.getProgress().oneMoreDone();
			p.callThen();
		}).catch(function(){
			root.getProgress().oneMoreDone();
			p.callCatch();
		});
	}).catch(function(){
		root.getProgress().oneMoreDone(2);
		p.callCatch();
	});
	return p;
};

vn.extend(TreeFileObject,CloudTreeFileObject);

function CloudTreeFolderObject(oid,div)
{
	TreeFolderObject.call(this,div);
	this.oid=oid;
	
	this.whenSelected().then(function(object){
		var root=object.getRoot();
	
		object.cloudObject=vn.cloud.getObject(object.oid);
		object.cloudObject.clientObject=object;
		
		if(root)root.getProgress().oneMoreToDo();
		object.cloudObject.whenReady().then(function(){
			if(root)root.getProgress().oneMoreDone();
			if(root && root.whenCloudObjectSelected)
			{
				root.whenCloudObjectSelected().callThen({object:object.cloudObject});
			}		
		}).catch(function(){
			if(root)root.getProgress().oneMoreDone();
		});
		
	});
	
  this.whenExpanded().then(function(object){
	 object.populate(); 
  });
  
  this.loading_file=(new TreeFileObject()).setName('Loading...');//.setIcon(vn.hosturl+'js/img/VNlogo128.gif');
  this.loading_file.title_text_div.style.fontStyle='italic';
  this.loading_file.title_text_div.style.color='rgb(128,128,128)';
  this.add(this.loading_file);
}

CloudTreeFolderObject.prototype.removeLoading=function()
{
	this.remove(this.loading_file);
};

CloudTreeFolderObject.prototype.move=function(object,options)
{
	var opt=options||{};
	
	if(opt.ifDestinationUnder && !this.isPredecessor(opt.ifDestinationUnder)&&this!=opt.ifDestinationUnder){object.cancelMove(); return;}
	if(opt.ifObjectUnder && !object.isPredecessor(opt.ifObjectUnder)){object.cancelMove(); return;}
	if(object==this)return;
	if(object.getParent()==this)return;//do not change anything on the cloud
	//console.log('Move '+object.getId()+' into '+this.getId() );
	var root=this.getRoot();
	var root2=object.getRoot();
	if(root && root2 && root!=root2)
	{
		this.useHereById(object.oid);
		object.cancelMove();
		return;
	}
	
	var s=object.getParent();
	if(root)root.getProgress().oneMoreToDo(2);
	
		if(object.cloudObject)//if object.cloudObject has been loaded. This should be always the case for folders.
			this.cloudObject.add(object.cloudObject).then(function(){//request from the server to add the object to the list "into"
				if(root)root.getProgress().oneMoreDone();
				
				s.cloudObject.removeById(object.oid).then(function(){//request from the server to remove the object from list "s"
					if(root)root.getProgress().oneMoreDone();
				}).catch(function(){
					if(root)root.getProgress().oneMoreDone();
				});
				
			}).catch(function(){
				if(root)root.getProgress().oneMoreDone(2);
				//console.log('ERROR');
			});
		else this.cloudObject.addById(object.getId()).then(function(){
				if(root)root.getProgress().oneMoreDone();
				
				s.cloudObject.removeById(object.oid).then(function(){//request from the server to remove the object from list "s"
					if(root)root.getProgress().oneMoreDone();
				}).catch(function(){
					if(root)root.getProgress().oneMoreDone();
				});
				
			}).catch(function(){
				if(root)root.getProgress().oneMoreDone(2);
				//console.log('ERROR');
			});
	
};

CloudTreeFolderObject.prototype.upload=function(files,options)
{
	var opt=options||{};
	
	var s=this;
	if(opt.ifDestinationUnder && s!=opt.ifDestinationUnder && !s.isPredecessor(opt.ifDestinationUnder))return;
	if(s.cloudObject){}else return;//there is no cloudObject? Normally, this "return" should never be called.

	var root=this.getRoot();
	
	function perform_upload(file)
	{	
	var o=vn.cloud.getMe().newObject();//We request from the server to create a new object
	if(root)root.getProgress().oneMoreToDo(4);
	o.whenReady().then(function(o){//when the server creates the object
		if(root)root.getProgress().oneMoreDone();
		o.rename(file.name).then(function(){//we request from the server to rename the object
			if(root)root.getProgress().oneMoreDone();
			s.cloudObject.add(o).then(function(){//we request from the server to add this file into a particular folder
				if(root)root.getProgress().oneMoreDone();
				//we visualy present the result in the client (as divs)
				var f=new CloudTreeFileObject();
				f.setName(o.info.VN_NAME);
				f.glue(o);
				s.addLast(f);
				s.expand();
				f.select();

				//We send the binary data from the file to the server
				o.upload({file:file,progress:root.getProgress()}).then(function()
				{
					if(root)root.getProgress().oneMoreDone();
					if(o._viewer) delete o._viewer;
					s.cloudObject.update();
					f.setIcon(vn.hosturl+vn.hosturl+'js/img/file-icon.png');
					f.setIcon(vn.hosturl+'file/'+o.getId()+'/thumb.jpg');
					if(root.whenCloudObjectSelected)
					{
						var p=root.whenCloudObjectSelected();
						p.setObject(o);
						p.callThen();
					}
				}).catch(function(){
					if(root)root.getProgress().oneMoreDone();
				});
				
			}).catch(function(){
				if(root)root.getProgress().oneMoreDone(2);
			});
		}).catch(function(){
			if(root)root.getProgress().oneMoreDone(3);
		});
	}).catch(function(){
		if(root)root.getProgress().oneMoreDone(4);
		
		//if permission denied prompt login
		
	});	
	}
	
	for(var i=0;i<files.length;i++)
	{
		perform_upload(files[i]);
	}
};

CloudTreeFolderObject.prototype.newObject=function(name,VN_CLASS)
{
	if(name.length==0)return;
	var root=this.getRoot();
	var self=this;
	
	var o=vn.cloud.getMe().newObject(VN_CLASS);
	root.getProgress().oneMoreToDo(3);
	o.whenReady().then(function(){
		root.getProgress().oneMoreDone();
		
		var perform_add=function()
		{
		self.cloudObject.add(o).then(function(){
			root.getProgress().oneMoreDone();
			var f=self._makeAdd({VN_OID:o.getId(),VN_CLASS:o.info.VN_CLASS,VN_NAME:o.info.VN_NAME},o);	
			self.expand();
			f.select();
		}).catch(function(){
			root.getProgress().oneMoreDone();
		});
		};
		
		if(name.length>0)
		{
			o.rename(name).then(function(){
				root.getProgress().oneMoreDone();
				perform_add();
			}).catch(function(){
				root.getProgress().oneMoreDone(2);
			});
		}
		else
		{
			root.getProgress().oneMoreDone();
			perform_add();
		}
	}).catch(function(){
		root.getProgress().oneMoreDone(3);
	});
};

CloudTreeFolderObject.prototype.newFolder=function(name)
{
	if(name.length==0)return;
	var root=this.getRoot();
	var self=this;
	
	var o=vn.cloud.getMe().newObject('List');
	root.getProgress().oneMoreToDo(3);
	o.whenReady().then(function(){
		root.getProgress().oneMoreDone();
		
		var perform_add=function()
		{
			self.cloudObject.add(o).then(function(){
				root.getProgress().oneMoreDone();
				var f=self._makeAdd({VN_OID:o.getId(),VN_CLASS:o.info.VN_CLASS,VN_NAME:o.info.VN_NAME},o);	
				self.expand();
				f.select();
			}).catch(function(){
				root.getProgress().oneMoreDone();
			});
		};
		
		if(name.length>0)
		{
			o.rename(name).then(function(){
				root.getProgress().oneMoreDone();
				perform_add();
			}).catch(function(){
				root.getProgress().oneMoreDone(2);
			});
		}
		else
		{
			root.getProgress().oneMoreDone();
			perform_add();
		}
	}).catch(function(){
		root.getProgress().oneMoreDone(3);
	});
};

CloudTreeFolderObject.prototype.pick=function()
{
	this.cloudObject.pick();
};

CloudTreeFolderObject.prototype.useHere=function()
{
	var u=vn.cloud.use();
	if(u==null)return;
	this.useHereById(u.object.getId());
};

CloudTreeFolderObject.prototype.useHereById=function(id)
{
	if(id.length==0)return;
	var root=this.getRoot();
	var self=this;
		
	var o=vn.cloud.getObject(id);
	root.getProgress().oneMoreToDo(2);
	o.whenReady().then(function(){
		root.getProgress().oneMoreDone();
		
		self.cloudObject.add(o).then(function(){
			root.getProgress().oneMoreDone();
			var f=self._makeAdd({VN_OID:o.getId(),VN_CLASS:o.info.VN_CLASS,VN_NAME:o.info.VN_NAME},o);		
			self.expand();
			f.select();
		}).catch(function(){
			root.getProgress().oneMoreDone();
		});
		
	}).catch(function(){
		root.getProgress().oneMoreDone(2);
	});
};

CloudTreeFolderObject.prototype.rename=function(name)
{
	var root=this.getRoot();
	var self=this;
	
	if(name.length==0)return;
	if(name==this.getName())return;//name did not change
	
	var o=this.cloudObject||vn.cloud.getObject(this.oid);
	root.getProgress().oneMoreToDo(2);
	o.rename(name).then(function(o){
		root.getProgress().oneMoreDone();
		self.setName(o.info.VN_NAME);
		delete o._viewer;
		if(root.whenCloudObjectSelected)root.whenCloudObjectSelected().callThen({object:o});
		self.getParent().cloudObject.update().then(function(l){
			root.getProgress().oneMoreDone();
		}).catch(function(){
			root.getProgress().oneMoreDone();
		});
	}).catch(function(){
		root.getProgress().oneMoreDone(2);
	});
};

CloudTreeFolderObject.prototype.moveToTrash=function(trash)
{
	var root=this.getRoot();
	var self=this;
	
	var p=this.getParent();
	root.getProgress().oneMoreToDo();
	p.cloudObject.removeById(this.oid).then(function(){
		root.getProgress().oneMoreDone();
		p.remove(self);

		trash.cloudObject.addById(self.oid).then(function(){
			trash.add(self);
		});
		
	}).catch(function(){
		root.getProgress().oneMoreDone();
	});
};

CloudTreeFolderObject.prototype.purge=function()
{
	var root=this.getRoot();
	var self=this;
	
	root.getProgress().oneMoreToDo();
	var p=this.getParent();
	p.cloudObject.removeById(this.oid).then(function(){
		root.getProgress().oneMoreDone();
		p.remove(self);
		}).catch(function(){
		root.getProgress().oneMoreDone();
	});
};

CloudTreeFolderObject.prototype.glue=CloudTreeFileObject.prototype.glue;
CloudTreeFolderObject.prototype._makeAdd=CloudTreeFileObject.prototype._makeAdd;
CloudTreeFolderObject.prototype.clone=CloudTreeFileObject.prototype.clone;
CloudTreeFolderObject.prototype.evolve=CloudTreeFileObject.prototype.evolve;

CloudTreeFolderObject.prototype.load=function(oid)
{
	var l=vn.cloud.getObject(oid);
	var self=this;
	l.whenReady().then(function(l){
		self.glue(l);
		self.removeAll();
		if(l.info.VN_LIST)
		for(var VN_OID in l.info.VN_LIST)
		{
			self._makeAdd({VN_OID:VN_OID,VN_CLASS:l.info.VN_LIST[VN_OID].VN_CLASS,VN_NAME:l.info.VN_LIST[VN_OID].VN_NAME});
		}
		self.sort();
		self.populate();
	});
	return l;
};

CloudTreeFolderObject.prototype.populate=function()
{
	if(typeof this.cloudObject==='undefined')return;//This folder has not been loaded yet from the cloud
	
	var root=this.getRoot();
	
	var c=this.getContents();
	for(var i=0;i<c.length;i++)
	{
		if(c[i].isFolder() && typeof c[i].cloudObject==='undefined')
		{
			if(root)root.getProgress().oneMoreToDo();
			c[i].cloudObject=vn.cloud.getObject(c[i].oid);
			c[i].cloudObject.clientObject=c[i];
			c[i].cloudObject.whenReady().then(function(o){
				if(root)root.getProgress().oneMoreDone();
				o.clientObject.removeAll();
				if(o.info.VN_LIST)
					for(VN_OID in o.info.VN_LIST)
					{
						o.clientObject._makeAdd({VN_OID:VN_OID,VN_CLASS:o.info.VN_LIST[VN_OID].VN_CLASS,VN_NAME:o.info.VN_LIST[VN_OID].VN_NAME});
					}
					o.clientObject.sort();
			}).catch(function(o){
				if(root)root.getProgress().oneMoreDone();
				
			});
		}
	}
			
};

vn.extend(TreeFolderObject,CloudTreeFolderObject)

function VNCloudEncoderInstance()
{
	var worker=new Worker(vn._cloud_encoder);
	var _p=[];
	
	var format=function(b,opt){
		if(opt)
		{
			var t=opt.type||"";
			t=t.toLowerCase();
			//if(t=='string')return arrayBufferToString(b);
			if(t=='blob')
			{
				if(opt.mime)return new Blob([b],{type:opt.mime});
				else return new Blob([b]);
			}
			else if(t=='url'){
				if(opt.mime){
				var blob=new Blob([b],{type:opt.mime});
				return URL.createObjectURL(blob);}
				else {
				var blob=new Blob([b]);
				return URL.createObjectURL(blob);}
			}
			return b;
		}
		else return b;
	};
	
	worker.onmessage=function(e)
	{
		var data=e.data;
		var p=_p.shift();
		if(data.error){
			p.callCatch({
				object:data.error
			})
			//worker.terminate();
		}
		else{

			p.callThen({
				object:format(data.output,data.options)
			});
			//worker.terminate();
		}
	};
	
	this.decode=function(data,options){
		var p=new VNPromise();
		_p.push(p);
		worker.postMessage({decode:data,options:options});
		return p;
	};
	
	this.format=function(data,options){
		var p=new VNPromise();
		_p.push(p);
		worker.postMessage({format:data,options:options});
		return p;
	};
	
	this.encode=function(data){
		var p=new VNPromise();
		_p.push(p);
		worker.postMessage({encode:data});
		return p;
	};
	
	this.terminate=function(){worker.terminate();};
}

function VNCloudEncoder()
{
	var instance=[];
	var next=0;
	
	var init=function()
	{
		if(instance.length==0)
		{
			for(var i=0;i<vn.cloud_threads;i++)instance[i]=new VNCloudEncoderInstance();
			next=instance.length-1;
		}
	}
	
	var nextID=function()
	{
		next+=1;
		if(next>=instance.length)next=0;
		return next;
	}
	
	this.decode=function(data,options){
		init();
		return instance[nextID()].decode(data,options);		
	};
	
	this.format=function(data,options){
		init();
		return instance[nextID()].format(data,options);	
	};
	
	this.encode=function(data){
		init();
		return instance[nextID()].encode(data);	
	};
	
	this.terminate=function(){
		for(var i=0;i<instance.length;i++)instance[i].terminate();
	};
	
}