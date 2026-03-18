/* V1.1
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
 
function VisiNeatAPI()
{
	this.libs={};
	this.hostname="";
}

VisiNeatAPI.prototype.onload=function(onLoad){this.importScripts(onLoad);};
VisiNeatAPI.prototype.onLoad=function(onLoad){this.importScripts(onLoad);};

VisiNeatAPI.prototype.importScripts=function(src,onLoad)
{
	if(typeof onLoad==='undefined')
	{
		if(document.location.hostname=='www.visineat.com')
			this.importScripts(['visineat-webgl-2.7','visineat-windows-1.0','visineat-server-1.2','visineat-file-formats-1.0'],src);
		else this.importScripts(['visineat-webgl-2.7','visineat-windows-1.0','visineat-server-1.2','visineat-file-formats-1.0'],src);
	}
	else
	{
	if(typeof src==='string') this.importScript(src,onLoad);
	else
	{
		if(src.length==1) this.importScript(src[0],onLoad);
		else
		{
		var src1=src[0];
		src.shift();
		var self=this;
		this.importScript(src1,function(){self.importScripts(src,onLoad)});
		}
	}
	}
};

VisiNeatAPI.prototype.loaded=function(src)
{
  var src_=(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//www.visineat.com/js/'+src+'.js';
  if(typeof this.libs[src_]!=='undefined') return true;
  else return false;
}

VisiNeatAPI.prototype.importScript=function(src,onLoad)
{
  var src_=(('https:' == document.location.protocol) ? 'https:' : 'http:')+'//www.visineat.com/js/'+src+'.js';
  if(typeof this.libs[src_]!=='undefined')
  {
	onLoad();
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
	  self.libs[src_]=new Object();
      r = true;
      onLoad();
    }
  };
  s.src = src_;
  t = document.getElementsByTagName('script')[0];
  t.parentNode.insertBefore(s, t);
};

/*VisiNeatAPI.prototype.WebGLCanvas=function(div)
{
	return new WebGLCanvas(div);
};*/

var vn=new VisiNeatAPI();