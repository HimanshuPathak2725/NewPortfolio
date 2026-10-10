import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
export const compile = (name,module=ts.ModuleKind.CommonJS) => ts.transpileModule(fs.readFileSync(`src/lib/essays/${name}.ts`,'utf8'),{compilerOptions:{module,target:ts.ScriptTarget.ES2022}}).outputText;
export function essayModules() {
  const modules={};
  for(const name of ['models','figures']) {
    const exports={};
    vm.runInNewContext(compile(name),{exports,require:path=>path.endsWith('.json')?{default:JSON.parse(fs.readFileSync(`src/data/${path.split('/').at(-1)}`,'utf8'))}:modules[path.replace('./','')]});
    modules[name]=exports;
  }
  return modules;
}
