import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const modules={};
for(const name of ['architecture-diagrams','architecture-scenes','architecture-art']){
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/lib/world-models/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:path=>modules[path.replace('./','')]});
 modules[name]=exports;
}
for(const id of Object.keys(modules['architecture-diagrams'].architectureDiagrams)){
 fs.writeFileSync(`public/images/world-models/architecture-${id}.svg`,modules['architecture-art'].renderArchitectureSvg(id));
}
console.log('Generated six source-linked architecture SVGs.');
