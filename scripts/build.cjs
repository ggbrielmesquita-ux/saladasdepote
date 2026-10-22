const fs = require('node:fs');
const path = require('node:path');
const { root, generate, validate, localReferences } = require('./seo.cjs');

generate();
validate();

const output = path.resolve(root, 'dist');
if (path.relative(root, output) !== 'dist' || output === root) throw new Error('Diretório de saída fora do projeto.');
const marker = path.join(output, '.saladasdepote-build.json');
if (fs.existsSync(output)) {
  if (!fs.existsSync(marker) || JSON.parse(fs.readFileSync(marker, 'utf8')).managedBy !== 'saladasdepote-build') {
    throw new Error('dist já existe e não pertence a este build; preserve seus arquivos antes de continuar.');
  }
  // A saída absoluta foi validada e contém o identificador deste gerador.
  fs.rmSync(output, { recursive: true });
}
fs.mkdirSync(output);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = new Set(['index.html', '404.html', 'robots.txt', 'sitemap.xml', ...localReferences(html)]);
files.add('assets/favicon-192.png');
files.add('favicon.svg');
for (const file of files) {
  const source = path.resolve(root, file);
  const relative = path.relative(root, source);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.startsWith(`saladasdepote${path.sep}`)) throw new Error(`Arquivo de publicação inválido: ${file}`);
  const destination = path.join(output, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
// Imagem de compartilhamento é declarada por URL absoluta nos metadados.
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
fs.copyFileSync(path.join(root, 'assets/social-preview.jpg'), path.join(output, 'assets/social-preview.jpg'));
fs.writeFileSync(marker, JSON.stringify({ managedBy: 'saladasdepote-build' }));
validate(output);
console.log(`Publicação preparada em ${output}; a cópia interna e os arquivos de desenvolvimento foram excluídos.`);
