/* V1
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
 
function OBJZIP(canvas)
	{
		this.canvas=canvas;
		this.gl=canvas.gl;
		this.camera=canvas.camera;
		this.shader=null;
		this.obj=new Array();
		this.img=null;
		this.loaded=false;
		this.center=[0,0,0];
		this.mean=[0,0,0];
		this.min=[0,0,0];
		this.max=[0,0,0];
		this.mvMatrix= mat4.create();
		this.filename='';
		this.bounding_box=null;
		this.show_box=false;
	}
	
	OBJZIP.prototype.getShader=function(){return this.shader;};
	
	OBJZIP.prototype.onTap=function(){};
	OBJZIP.prototype.onMouseEnter=function(){};
	OBJZIP.prototype.onMouseLeave=function(){};
	OBJZIP.prototype.onDrag=function(e){};
	OBJZIP.prototype.onDragStart=function(e){};
	OBJZIP.prototype.onDragEnd=function(e){};
	
	OBJZIP.prototype.load=function(filename)
	{
	this.filename=filename;
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
		 var zip = new JSZip(xmlhttp.response);
		
		 self.obj_filename='';
		 self.tex_filename='';
	     for(var fn in zip.files) 
			if(fn.indexOf('.obj', fn.length - 4) !== -1) self.obj_filename=fn;
			else if(fn.indexOf('.jpg', fn.length - 4) !== -1) self.tex_filename=fn;
	
          var f=zip.file(self.obj_filename).asText().split(/\s+/);
          //c.println(f.length);
          var v_counter=0;
          var f_counter=0;
          var vt_counter=0;
		  var n_counter=0;
          for(var i=0;i<f.length;i++)
          {
          	if(f[i]=='v') 
          	{
          		v_counter+=1;
				i+=3;
			}
          	if(f[i]=='vn') 
          	{
          		n_counter+=1;
				i+=3;
			}
			else if(f[i]=='vt')
          	{
          		vt_counter+=1;
          		i+=2;
          	}
          	else if(f[i]=='f')
          	{
          		f_counter+=1;
          		i+=3;
          	}
          }
		  
		  //if(vt_counter>0) c.println(v_counter+' vertices, '+f_counter+' polygons, textured');
          //else c.println(v_counter+' vertices, '+f_counter+' polygons, no texture');
          
          var xyz=new Float32Array(v_counter*3);
		var nrm=new Float32Array(v_counter*3);
		var uv=null;
		if(vt_counter>0) uv=new Float32Array(v_counter*2);
		var tri=null;

		if(v_counter>256*256)
		{
			tri=new Uint32Array(f_counter*3);
		}
		else tri=new Uint16Array(f_counter*3);
		
		v_counter=0;
          f_counter=0;
          n_counter=0;
          var uv_counter=0;
          var avg=[0,0,0];
          var mn=[0,0,0];
          var mx=[0,0,0];
          var stat_c=0;
          for(var i=0;i<f.length;i++)
          {
          	if(f[i]=='v') 
          	{
          		i+=1;
          		xyz[v_counter]=parseFloat(f[i]);
          		if(xyz[v_counter]<mn[0])mn[0]=xyz[v_counter]; else if(xyz[v_counter]>mx[0])mx[0]=xyz[v_counter];
          		avg[0]+=xyz[v_counter];
          		v_counter+=1;i+=1;
          		xyz[v_counter]=-parseFloat(f[i]);
          		if(xyz[v_counter]<mn[1])mn[1]=xyz[v_counter]; else if(xyz[v_counter]>mx[1])mx[1]=xyz[v_counter];
          		avg[1]+=xyz[v_counter];
          		v_counter+=1;i+=1;
          		xyz[v_counter]=-parseFloat(f[i]);
          		if(xyz[v_counter]<mn[2])mn[2]=xyz[v_counter]; else if(xyz[v_counter]>mx[2])mx[2]=xyz[v_counter];
          		avg[2]+=xyz[v_counter];
          		v_counter+=1;
          		if(stat_c==0)
          		{
          			mn[0]=avg[0];
          			mn[1]=avg[1];
          			mn[2]=avg[2];
          			mx[0]=avg[0];
          			mx[1]=avg[1];
          			mx[2]=avg[2];
          		}
          		stat_c+=1;
          	}
          	else if(f[i]=='vn')
          	{
          		i+=1;
          		nrm[n_counter]=parseFloat(f[i]);
          		n_counter+=1;i+=1;
          		nrm[n_counter]=-parseFloat(f[i]);
          		n_counter+=1;i+=1;
          		nrm[n_counter]=-parseFloat(f[i]);
          		n_counter+=1;
			}
          	else if(f[i]=='vt')
          	{
          		i+=1;
          		uv[uv_counter]=parseFloat(f[i]);
          		uv_counter+=1;i+=1;
          		uv[uv_counter]=parseFloat(f[i]);
          		uv_counter+=1;
          	}
          	else if(f[i]=='f')
          	{
          		i+=1;
          		tri[f_counter]=parseInt(f[i])-1;
          		f_counter+=1;i+=1;
  			tri[f_counter]=parseInt(f[i])-1;
          		f_counter+=1;i+=1;
          		tri[f_counter]=parseInt(f[i])-1;
          		f_counter+=1;
          	}
          }
          avg[0]/=stat_c;
          avg[1]/=stat_c;
          avg[2]/=stat_c;
          self.mean=avg;
          
          var ctr=[(mx[0]+mn[0])/2,(mx[1]+mn[1])/2,(mx[2]+mn[1])/2];
          for(var i=0;i<xyz.length;i++)
          {
          		xyz[i]-=ctr[0];
          		i+=1;
          		xyz[i]-=ctr[1];
          		i+=1;
          		xyz[i]-=ctr[2];
          }
          mn[0]-=ctr[0];
          mn[1]-=ctr[1];
          mn[2]-=ctr[2];
          mx[0]-=ctr[0];
          mx[1]-=ctr[1];
          mx[2]-=ctr[2];	
          
          self.center=ctr;
          self.min=mn;
          self.max=mx;
         
		 if((self.max[1]-self.min[1])/(self.max[0]-self.min[0])>self.gl.viewportHeight/self.gl.viewportWidth)
		self.scale=1.2/(self.max[1]-self.min[1]);
		else self.scale=(1.2*self.gl.viewportWidth/self.gl.viewportHeight)/(self.max[0]-self.min[0]);
		  
		if(n_counter==0)
		{
			//calculate N.
			//var nc=new Uint8Array(v_counter);
		}
		  
          
          if(stat_c>256*256) //needs restructuring
          {
          	var goes_to=new Uint32Array(stat_c);
          	var used_in_batch=new Uint8Array(stat_c);
          	var num_of_faces=tri.length/3;
          	var fc=0;
          	var batch_now=1;
          	var max16bit=256*256;
          	var v_next=0;
          	var from_face=0;
          	var _xyz=new Float32Array(max16bit*3);
          	var _nrm=new Float32Array(max16bit*3);
          	var _c1=0;
          	var _c2=0;
          	for(var f=0; f<num_of_faces;f++)
          	{
          		if(v_next>max16bit-3)
          		{
          			var obj=new GLObject(self.canvas);
					obj.onTap=function(e){self.onTap(e);};
					obj.onMouseEnter=function(e){self.onMouseEnter(e);};
					obj.onMouseLeave=function(e){self.onMouseLeave(e);};
					obj.onDrag=function(e){self.onDrag(e);};
					obj.onDragStart=function(e){self.onDragStart(e);};
					obj.onDragEnd=function(e){self.onDragEnd(e);};
          			var _v=_xyz.subarray(0,v_next*3);
				obj.setXYZ(_v);
				obj.setNormals(_nrm.subarray(0,v_next*3));
				//obj.setUV(uv);
				obj.setTriangles(tri.subarray(from_face*3,f*3));
				self.obj.push(obj);
				
				from_face=f;
          			v_next=0;
          			batch_now+=1;
          		}
          		
          		for(var fci=0;fci<3;fci++)
          		{
          			if(used_in_batch[tri[fc]]!=batch_now)
          			{
          				used_in_batch[tri[fc]]=batch_now;
          				goes_to[tri[fc]]=v_next;
          				//copy xyz and normal of the new vector.
          				_c1=v_next*3;
          				_c2=tri[fc]*3;
          				_xyz[_c1]=xyz[_c2];
          				_nrm[_c1]=nrm[_c2];
          				_c1+=1;_c2+=1;
          				_xyz[_c1]=xyz[_c2];
          				_nrm[_c1]=nrm[_c2];
          				_c1+=1;_c2+=1;
          				_xyz[_c1]=xyz[_c2];
          				_nrm[_c1]=nrm[_c2];
          
          				tri[fc]=goes_to[tri[fc]];
          				v_next+=1;
          			}
          			else
          			{
          				tri[fc]=goes_to[tri[fc]];
          			}
          			fc+=1;
          		}
          	}
          	
          	if(v_next>0)
          	{
				var obj=new GLObject(self.canvas);
				obj.onTap=function(e){self.onTap(e);};
				obj.onMouseEnter=function(e){self.onMouseEnter(e);};
				obj.onMouseLeave=function(e){self.onMouseLeave(e);};
				obj.onDrag=function(e){self.onDrag(e);};
				obj.onDragStart=function(e){self.onDragStart(e);};
				obj.onDragEnd=function(e){self.onDragEnd(e);};
			var _v=_xyz.subarray(0,v_next*3);
			obj.setXYZ(_v);
			obj.setNormals(_nrm.subarray(0,v_next*3));
			//obj.setUV(uv);
			var _f=tri.subarray(from_face*3,num_of_faces*3);
			obj.setTriangles(_f);
			self.obj.push(obj);
          	}
          }
          else
          {
			  
		var obj=new GLObject(self.canvas);
		obj.onTap=function(e){self.onTap(e);};
		obj.onMouseEnter=function(e){self.onMouseEnter(e);};
		obj.onMouseLeave=function(e){self.onMouseLeave(e);};
		obj.onDrag=function(e){self.onDrag(e);};
		obj.onDragStart=function(e){self.onDragStart(e);};
		obj.onDragEnd=function(e){self.onDragEnd(e);};
		obj.setXYZ(xyz);
		if(vt_counter>0) obj.setUV(uv);
		/*else*/ obj.setNormals(nrm);
		
		obj.setTriangles(tri);
		//c.println(avg[0]+' '+avg[1]+' '+avg[2]);
		
		self.obj.push(obj);
	}
	
		
	
		var im=zip.file(self.tex_filename);
		if(vt_counter>0 && im!=null)
		{
			var blob = new Blob( [ im.asUint8Array() ], { type: "image/jpeg" } );
          	self.img=new GLTexture(self.canvas);	
			self.img.onLoad=function(){self.loaded=true;self.onLoad();self.canvas.updatePickingMap();};
			self.img.load(URL.createObjectURL(blob));
  		}
		else
		{
			
			self.loaded=true;
			self.onLoad();
			self.canvas.updatePickingMap();
		}
		self.initShaders();
		self.canvas.oneMoreDone();
		self.canvas.renderFrame();
		}//if file downloaded end
          
	};
	xmlhttp.overrideMimeType("text/plain; charset=x-user-defined");
	//c.println("Start loading file...");
	this.canvas.oneMoreToDo();
	
	vn.import("//www.visineat.com/js/jszip.min.js").then(function()
	{
		xmlhttp.open("GET",filename,true);
		xmlhttp.send();
	});

	};
	
	OBJZIP.prototype.onLoad=function(){};
	
	OBJZIP.prototype.isLoaded=function(){return this.loaded;};
	
	OBJZIP.prototype._drawBoundingBox=function()
	{
		if(this.bounding_box==null) this.bounding_box=new BoundingBox(this.min,this.max,this.canvas);
		this.bounding_box.obj.getShader().updateProjection();
		this.bounding_box.obj.getShader().setModelView(this.mvMatrix);
		this.bounding_box.obj.getShader().setColorMask([0,0,1,1]);
		this.bounding_box.obj.draw();
		this.bounding_box.obj_h.getShader().updateProjection();
		this.bounding_box.obj_h.getShader().setModelView(this.mvMatrix);
		this.bounding_box.obj_h.draw();
	};
	
	OBJZIP.prototype.setDrawBoundingBox=function(flag)
	{
		this.show_box=flag;
		//this.canvas.renderFrame();
	};
	
	OBJZIP.prototype.draw=function()
{
	if(!this.loaded) return;
	var gl=this.gl;
	//if(this.camera.view_changed)
	{
		mat4.set(this.camera.mvMatrix,this.mvMatrix);
		mat4.scale(this.mvMatrix,[this.scale,this.scale,this.scale]);    	
	}
	
	
	
	var s=this.obj[0].getShader();
	
	s.updateAndUse();
	s.setModelView(this.mvMatrix);
	if(this.img!=null) this.img.use();
	for(var i=0;i<this.obj.length;i++)
		this.obj[i].draw();	
		
	if(this.show_box) {this._drawBoundingBox();}
};

OBJZIP.prototype.setDrawMode=function(mode)
{
	for(var i=0;i<this.obj.length;i++)
		this.obj[i].setDrawMode(mode);
};
	
OBJZIP.prototype.initShaders=function()
{
	if(this.shader==null)
	{
		var flags={diffuse:true,specular:true};
		if(this.img!=null) flags.uv=true;
		
		this.shader=new GLShader(this.canvas,flags);
		for(var i=0;i<this.obj.length;i++)
			this.obj[i].setShader(this.shader);

		if(this.img==null) 
		{
			this.shader.useLighting(true); 
			this.shader.useTexture(false);
		}
		else 
		{
			this.shader.useTexture(true);
			this.shader.useLighting(false);
		}
	}
		   
	
    //mat4.set(this.camera.mvMatrix,this.mvMatrix);
    //mat4.scale(this.mvMatrix,[this.scale,this.scale,this.scale]);
    //this.shader.setModelView(this.mvMatrix);
};