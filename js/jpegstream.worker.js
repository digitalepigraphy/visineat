(function () {
  'use strict';

  importScripts('b64.js');
  
	var dframes;
	var width;
	var height;
	var acc_buf;
	var rec_buf;
  
	var fcounter=0;
	
	var key_received=false;
  
  var init = function (config) {
	  dframes=config.dframes || 5;
	  width=config.width || 240;
	  height=config.height || 180;
		//console.log('JPEGSTREAM Worker Started');
  };

  
 
 var newKey=function(buf,url)
 {
	 acc_buf=buf;
	 if(url)self.postMessage({cmd:'frame_out',buf:toByteArray(url.slice(url.indexOf('base64,')+7).slice(828),[1])});
 }
 
 var encode=function(buf)
 {
	//console.log('encoding');
	if(acc_buf)
	{
		var a=acc_buf;
		var b=buf;
		var d=0;
		var ad=0;
		for(var i=b.length-1;i>=0;)	
		{
			i--;
			d=a[i]-b[i];ad=Math.abs(d);if(ad<4)b[i]=128;else if(ad<64)b[i]=(128-d);else if(d>0) b[i]=128-32-d/2;else b[i]=128+32-d/2;i--;
			d=a[i]-b[i];ad=Math.abs(d);if(ad<4)b[i]=128;else if(ad<64)b[i]=(128-d);else if(d>0) b[i]=128-32-d/2;else b[i]=128+32-d/2;i--;
			d=a[i]-b[i];ad=Math.abs(d);if(ad<4)b[i]=128;else if(ad<64)b[i]=(128-d);else if(d>0) b[i]=128-32-d/2;else b[i]=128+32-d/2;i--;
		}
		//console.log('done encoding');
		self.postMessage({cmd:'dframe',buf:b});
	} 
 };
 
 var decode=function(buf)
 {
	if(acc_buf)
	{
		var a=acc_buf;
		var b=buf;
		var d=0;
		for(var i=b.length-1;i>=0;)
		{
			i--;
			d=b[i]-128;if(Math.abs(d)<64)a[i]=a[i]+d;else if(d>0)a[i]=a[i]+(d-32)*2;else a[i]=a[i]+(d+32)*2;i--;
			d=b[i]-128;if(Math.abs(d)<64)a[i]=a[i]+d;else if(d>0)a[i]=a[i]+(d-32)*2;else a[i]=a[i]+(d+32)*2;i--;
			d=b[i]-128;if(Math.abs(d)<64)a[i]=a[i]+d;else if(d>0)a[i]=a[i]+(d-32)*2;else a[i]=a[i]+(d+32)*2;i--;
		}
	} 
 };

 var hdr='data:image/jpeg;base64,'+'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCA'+'C0'+'A'+'PA'+'DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEA';
 
  self.onmessage = function (e) {
    switch (e.data.cmd) {
      case 'frameEncode':
    	  if(key_received) encode(e.data.rgba);
        break;
	  case 'frameDecode':
        if(key_received){
			decode(e.data.rgba);
			self.postMessage({cmd:'frame_decoded',buf:acc_buf});
			}
        break;
	  case 'update':
	    if(key_received)
		{
			decode(e.data.rgba);
			var url=e.data.base64;
			self.postMessage({cmd:'frame_out',buf:toByteArray(url.slice(url.indexOf('base64,')+7).slice(828),[0])});
		}
        break;
  	  case 'keyFrameEncode':
		key_received=true;
		newKey(e.data.rgba,e.data.base64);
		break;
	  case 'keyFrameDecode':
	    key_received=true;
		newKey(e.data.rgba);
		break;
	  case 'inputFrame':
		var b=e.data.buf;
		if(b instanceof ArrayBuffer)b=new Uint8Array(b);		
		if(b[b.length-1]==1)self.postMessage({cmd:'inputKeyFrame',base64:hdr+fromByteArray(b,1)});
		else if(acc_buf)self.postMessage({cmd:'inputFrame',base64:hdr+fromByteArray(b,1)});
	    break;
	  case 'init':
        init(e.data.config);
        break;
    }
  };

})();
