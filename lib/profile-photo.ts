export function validProfilePhoto(value:unknown):value is string{
 if(typeof value!=="string"||value.length>180000)return false;
 if(value==="")return true;
 const match=value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!match)return false;
 const bytes=Buffer.from(match[2],"base64");
 if(match[1]==="jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(match[1]==="png")return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 return bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP";
}
