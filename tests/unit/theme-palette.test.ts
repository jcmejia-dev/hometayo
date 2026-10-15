import {test} from "node:test";
import assert from "node:assert/strict";
import {themes,paletteAt,themedStyles} from "../../apps/mobile/src/theme-palette.ts";
test("native palette recolors text, borders, fields and nested styles without changing layout or safety colors",()=>{
 const forest=themes[0].palette,plum=themes[2].palette;
 const source={title:{color:forest.green,fontSize:24},field:{borderColor:forest.border,backgroundColor:forest.field},badge:{backgroundColor:forest.soft},error:{color:forest.danger},nested:[{shadowColor:forest.green,opacity:.3}]};
 const result=themedStyles(source,plum);
 assert.equal(result.title.color,plum.green);assert.equal(result.field.borderColor,plum.border);assert.equal(result.field.backgroundColor,plum.field);assert.equal(result.badge.backgroundColor,plum.soft);assert.equal(result.nested[0].shadowColor,plum.green);assert.equal(result.title.fontSize,24);assert.equal(result.error.color,forest.danger);assert.equal(source.title.color,forest.green);
});
test("theme interpolation reaches the exact palette and can continue from an interrupted transition",()=>{
 const a=themes[0].palette,b=themes[1].palette,c=themes[2].palette;
 assert.deepEqual(paletteAt(a,b,0),Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v.toLowerCase()])));
 assert.deepEqual(paletteAt(a,b,1),Object.fromEntries(Object.entries(b).map(([k,v])=>[k,v.toLowerCase()])));
 const halfway=paletteAt(a,b,.5);assert.notEqual(halfway.green,a.green.toLowerCase());assert.notEqual(halfway.green,b.green.toLowerCase());assert.equal(paletteAt(halfway,c,1).green,c.green.toLowerCase());
});
